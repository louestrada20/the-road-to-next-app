import { stripe } from "@/lib/stripe";

/**
 * Script to update allowedMembers metadata on existing Stripe products
 * Run with: npx tsx src/lib/stripe/update-metadata.ts
 */
const updateProductMetadata = async () => {
  console.log("Starting Stripe product metadata update...");

  try {
    // Get all active products
    const products = await stripe.products.list({ active: true });

    console.log(`Found ${products.data.length} active products`);

    for (const product of products.data) {
      console.log(`\nProduct: ${product.name} (${product.id})`);
      console.log(`Current metadata:`, product.metadata);

      // Update based on product name or ID
      let allowedMembers: number | undefined;

      if (product.name.toLowerCase().includes("starter") || product.name.toLowerCase().includes("free")) {
        allowedMembers = 3;
      } else if (product.name.toLowerCase().includes("basic")) {
        allowedMembers = 15;
      } else if (product.name.toLowerCase().includes("pro")) {
        allowedMembers = 50;
      } else if (product.name.toLowerCase().includes("enterprise") || product.name.toLowerCase().includes("business")) {
        allowedMembers = 9999; // Unlimited-ish
      }
      // Add more conditions as needed

      if (allowedMembers !== undefined) {
        await stripe.products.update(product.id, {
          metadata: {
            ...product.metadata, // Keep existing metadata
            allowedMembers: allowedMembers.toString(),
          },
        });
        console.log(`✓ Updated ${product.name} → allowedMembers: ${allowedMembers}`);
      } else {
        console.log(`⚠ Skipped ${product.name} (no matching rule)`);
      }
    }

    console.log("\n✓ Metadata update completed successfully");
  } catch (error) {
    console.error("Error updating metadata:", error);
    throw error;
  }
};

updateProductMetadata();

