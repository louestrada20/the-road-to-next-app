import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Product configuration with member limits
const PRODUCTS = {
  STARTER: { name: "Starter Plan", memberLimit: 3, monthlyPrice: 0 },
  BASIC: { name: "Basic Plan", memberLimit: 15, monthlyPrice: 1900 }, // $19
  PRO: { name: "Pro Plan", memberLimit: 50, monthlyPrice: 4900 }, // $49
  ENTERPRISE: { name: "Enterprise Plan", memberLimit: 9999, monthlyPrice: 9900 }, // $99
};

const seed = async () => {
  const t0 = performance.now();
  console.log("💳 Seeding Stripe...");

  // Deactivate existing prices and products
  console.log("  Cleaning up existing Stripe data...");
  const prices = await stripe.prices.list({ limit: 100 });
  const products = await stripe.products.list({ limit: 100 });
  const customers = await stripe.customers.list({ limit: 100 });

  for (const price of prices.data) {
    await stripe.prices.update(price.id, { active: false });
  }

  for (const product of products.data) {
    await stripe.products.update(product.id, { active: false });
  }

  for (const customer of customers.data) {
    await stripe.customers.del(customer.id);
  }

  // Clean up database records
  await prisma.stripeCustomer.deleteMany({});
  console.log("  ✓ Cleaned up existing Stripe data");

  // Get organizations from database
  const organizations = await prisma.organization.findMany({
    include: {
      memberships: {
        include: { user: true },
        where: { membershipRole: "ADMIN" },
        take: 1,
      }
    }
  });

  if (organizations.length === 0) {
    throw new Error("No organizations found. Run 'npm run seed' first.");
  }

  console.log(`  Found ${organizations.length} organizations to process`);

  // Create products and prices
  console.log("  Creating products and prices...");
  
  // Create Starter product
  const starterProduct = await stripe.products.create({
    name: PRODUCTS.STARTER.name,
    description: "Perfect for small teams getting started.",
    metadata: { allowedMembers: String(PRODUCTS.STARTER.memberLimit) },
    marketing_features: [
      { name: "Up to 3 members" },
      { name: "Basic features" },
      { name: "Community support" },
    ],
  });

  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: PRODUCTS.STARTER.monthlyPrice,
    currency: "usd",
    recurring: { interval: "month" },
  });

  // Create Basic product
  const basicProduct = await stripe.products.create({
    name: PRODUCTS.BASIC.name,
    description: "For growing teams.",
    metadata: { allowedMembers: String(PRODUCTS.BASIC.memberLimit) },
    marketing_features: [
      { name: "Up to 15 members" },
      { name: "All features included" },
      { name: "Email support" },
      { name: "Cancel anytime" },
    ],
  });

  const basicPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: PRODUCTS.BASIC.monthlyPrice,
    currency: "usd",
    recurring: { interval: "month" },
  });

  // Create Pro product (for deprovisioning demo history)
  const proProduct = await stripe.products.create({
    name: PRODUCTS.PRO.name,
    description: "For professional teams.",
    metadata: { allowedMembers: String(PRODUCTS.PRO.memberLimit) },
    marketing_features: [
      { name: "Up to 50 members" },
      { name: "All features included" },
      { name: "Priority support" },
      { name: "Cancel anytime" },
    ],
  });

  await stripe.prices.create({
    product: proProduct.id,
    unit_amount: PRODUCTS.PRO.monthlyPrice,
    currency: "usd",
    recurring: { interval: "month" },
  });

  // Create Enterprise product
  const enterpriseProduct = await stripe.products.create({
    name: PRODUCTS.ENTERPRISE.name,
    description: "For large organizations.",
    metadata: { allowedMembers: String(PRODUCTS.ENTERPRISE.memberLimit) },
    marketing_features: [
      { name: "Unlimited members" },
      { name: "All features included" },
      { name: "Dedicated support" },
      { name: "Custom integrations" },
    ],
  });

  await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: PRODUCTS.ENTERPRISE.monthlyPrice,
    currency: "usd",
    recurring: { interval: "month" },
  });

  console.log("  ✓ Created 4 products with prices");

  // Create test clock for deprovisioning demo (14 days in the past)
  const deprovOrg = organizations.find(org => org.name === "Deprovisioning Demo");
  let deprovisioningClock: Stripe.TestHelpers.TestClock | null = null;
  
  if (deprovOrg) {
    console.log("  Creating test clock for deprovisioning demo...");
    deprovisioningClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.round(Date.now() / 1000) - (14 * 24 * 60 * 60), // 14 days ago
      name: "Deprovisioning Demo Clock"
    });
    console.log("  ✓ Created test clock 14 days in the past");
  }

  // Create customers and subscriptions for each organization
  console.log("  Creating customers and subscriptions...");
  let customerCount = 0;
  let subscriptionCount = 0;

  for (const org of organizations) {
    const adminEmail = org.memberships[0]?.user.email || `admin@${org.name.toLowerCase().replace(/\s+/g, '-')}.local`;
    
    // Determine which product/price to use based on org name
    let selectedProduct: Stripe.Product;
    let selectedPrice: Stripe.Price;
    let testClock: string | undefined;

    switch (org.name) {
      case "Main Test Org":
        selectedProduct = starterProduct;
        selectedPrice = starterPrice;
        break;
      case "Deprovisioning Demo":
        selectedProduct = starterProduct; // Currently on Starter (downgraded from Pro)
        selectedPrice = starterPrice;
        testClock = deprovisioningClock?.id;
        break;
      case "E2E Test Org":
      case "Multi-tenant Demo":
        selectedProduct = basicProduct;
        selectedPrice = basicPrice;
        break;
      default:
        selectedProduct = starterProduct;
        selectedPrice = starterPrice;
    }

    // Create customer
    const customer = await stripe.customers.create({
      name: org.name,
      email: adminEmail,
      metadata: {
        organizationId: org.id,
      },
      ...(testClock && { test_clock: testClock }),
    });
    customerCount++;

    // Create a test payment method and attach it to the customer
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: 'tok_visa', // Test visa card
      },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: selectedPrice.id }],
      metadata: {
        organizationId: org.id,
      },
      default_payment_method: paymentMethod.id,
    });
    subscriptionCount++;

    // Save to database
    await prisma.stripeCustomer.create({
      data: {
        customerId: customer.id,
        organizationId: org.id,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status as "active" | "incomplete" | "incomplete_expired" | "past_due" | "canceled" | "unpaid" | "trialed" | "paused",
        productId: selectedProduct.id,
        priceId: selectedPrice.id,
      },
    });

    console.log(`  ✓ Created customer for ${org.name} (${selectedProduct.name})`);
  }

  const t1 = performance.now();
  console.log(`\n✅ Stripe seed completed in ${Math.round(t1 - t0)}ms`);
  console.log('\n📊 Summary:');
  console.log(`  ✓ ${customerCount} customers created`);
  console.log(`  ✓ ${subscriptionCount} subscriptions activated`);
  if (deprovisioningClock) {
    console.log('  ✓ Test clock created for deprovisioning demo');
  }
  console.log('\n🎯 Organization subscriptions:');
  console.log('  - Main Test Org: Starter Plan ($0/month)');
  console.log('  - Deprovisioning Demo: Starter Plan (downgraded from Pro)');
  console.log('  - E2E Test Org: Basic Plan ($19/month)');
  console.log('  - Multi-tenant Demo: Basic Plan ($19/month)');
  console.log('\n✅ All systems ready! You can now:');
  console.log('  - Test subscription management');
  console.log('  - View deprovisioning workflows');
  console.log('  - Run E2E tests');
  console.log('  - Use the MCP server');
};

seed().catch((error) => {
  console.error('❌ Stripe seed failed:', error);
  process.exit(1);
});