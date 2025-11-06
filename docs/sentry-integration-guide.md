# Sentry Integration Guide

This guide covers where and how to use Sentry error monitoring in the Road to Next application.

## ✅ Configuration Status

Sentry is fully integrated with:
- **Client-side monitoring** - Browser errors captured automatically
- **Server-side monitoring** - API route and server action errors
- **Edge runtime monitoring** - Middleware and edge function errors
- **Performance tracking** - 10% sample rate in production
- **Session replay** - 100% of error sessions recorded
- **Prisma integration** - Database query monitoring
- **Source maps** - Readable stack traces via Vercel integration

## ❌ Where NOT to Use Sentry

### 1. Test Files (Mock Sentry Instead)

**Why:** Tests intentionally throw errors - sending them to Sentry would:
- ❌ Pollute your dashboard with fake errors
- ❌ Waste Sentry quota
- ❌ Trigger false alerts
- ❌ Make it harder to find real production issues

**Already configured:** Sentry is mocked in `src/test/setup.ts`:

```typescript
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  startSpan: vi.fn((options, callback) => callback()),
  // ... other mocks
}))
```

**Verify in tests:**
```typescript
import * as Sentry from "@sentry/nextjs";
import { asMock } from "@/test/types/mocks";

it('should handle errors', async () => {
  await actionThatThrowsError();
  expect(asMock(Sentry.captureException)).toHaveBeenCalled();
});
```

### 2. Seed Scripts (Development Data Only)

**Why:** Seed scripts run during development and testing - errors here should:
- ❌ NOT go to production monitoring
- ✅ Be logged to console for immediate visibility
- ✅ Fail the seed process loudly

**Already configured:** `prisma/seed.ts` doesn't import Sentry.

**Keep seed errors visible:**
```typescript
try {
  await prisma.ticket.create(data);
} catch (error) {
  console.error('❌ Failed to create ticket:', error);
  throw error; // Fail the seed
}
```

### 3. E2E Tests (Playwright)

**Why:** E2E tests are controlled test scenarios, not production errors.

**No action needed:** Playwright tests don't run your app's production code bundle.

---

## ✅ Where TO Use Sentry

### 1. Stripe Webhooks (Critical - Already Missing!)

**Why:** Webhook errors are silent failures that can:
- ❌ Cause payment issues to go unnoticed
- ❌ Break subscription management
- ❌ Miss critical deprovisioning events

**Current status:** `src/app/api/stripe/route.ts` has try/catch but NO Sentry tracking!

**How to add:**

```typescript
// src/app/api/stripe/route.ts
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature")!;
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      category: "stripe.webhook",
      message: `Processing ${event.type}`,
      level: "info",
      data: { eventId: event.id },
    });
    
    // Process webhook...
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, event.created);
        break;
      // ... other cases
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    // CRITICAL: Capture webhook errors in Sentry!
    Sentry.captureException(error, {
      tags: {
        webhook: "stripe",
        eventType: event?.type || "unknown",
      },
      contexts: {
        stripe: {
          eventId: event?.id,
          livemode: event?.livemode,
        },
      },
    });
    
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
```

### 2. Inngest Background Jobs (Critical - Already Missing!)

**Why:** Background job failures are invisible to users but can:
- ❌ Break email delivery
- ❌ Skip critical deprovisioning steps
- ❌ Cause data inconsistencies

**Current status:** Inngest functions have NO error tracking!

**Example: Add to Email Verification Event**

```typescript
// src/features/auth/events/event-email-verification.ts
import * as Sentry from "@sentry/nextjs";
import { inngest } from "@/lib/inngest";

export const emailVerificationEvent = inngest.createFunction(
  { id: "email-verification" },
  { event: "auth/email.verification.requested" },
  async ({ event, step }) => {
    return await Sentry.startSpan(
      {
        op: "inngest.function",
        name: "email-verification",
        attributes: { userId: event.data.userId },
      },
      async () => {
        try {
          await step.run("send-verification-email", async () => {
            const user = await prisma.user.findUniqueOrThrow({
              where: { id: event.data.userId },
            });
            
            await sendEmailVerification(user.email, event.data.token);
          });
        } catch (error) {
          // Capture Inngest job failures
          Sentry.captureException(error, {
            tags: {
              inngest: "email-verification",
              userId: event.data.userId,
            },
          });
          throw error; // Re-throw to trigger Inngest retry
        }
      }
    );
  }
);
```

### 3. Deprovisioning Service (Critical - Already Missing!)

**Why:** Deprovisioning logic is complex and critical - errors here can:
- ❌ Remove wrong members
- ❌ Skip member removal entirely
- ❌ Break subscription downgrade flows

**Current status:** `src/features/deprovisioning/service/handle-subscription-change.ts` has try/catch but basic console.error!

**How to improve:**

```typescript
// src/features/deprovisioning/service/handle-subscription-change.ts
import * as Sentry from "@sentry/nextjs";

export async function handleSubscriptionChange(
  organizationId: string,
  oldProductId: string | null | undefined,
  newProductId: string | null | undefined,
  eventAt: number
): Promise<void> {
  return await Sentry.startSpan(
    {
      op: "deprovisioning.subscription_change",
      name: "handle-subscription-change",
      attributes: {
        organizationId,
        oldProductId: oldProductId || "none",
        newProductId: newProductId || "none",
      },
    },
    async () => {
      try {
        Sentry.addBreadcrumb({
          category: "deprovisioning",
          message: "Processing subscription change",
          level: "info",
          data: { organizationId, oldProductId, newProductId, eventAt },
        });
        
        // Existing logic...
        if (!newProductId) {
          await handleDowngrade(organizationId, 1, DeprovisioningReason.SUBSCRIPTION_CANCELLED);
          return;
        }
        
        const comparison = await isDowngrade(oldProductId, newProductId);
        if (!comparison) return;
        
        if (comparison.isDowngrade) {
          await handleDowngrade(organizationId, comparison.newLimit, DeprovisioningReason.SUBSCRIPTION_DOWNGRADE);
        } else {
          await handleUpgrade(organizationId);
        }
      } catch (error) {
        // Capture deprovisioning errors with full context
        Sentry.captureException(error, {
          tags: {
            feature: "deprovisioning",
            organizationId,
            isDowngrade: !!newProductId && oldProductId && newProductId < oldProductId,
          },
          contexts: {
            subscription: {
              oldProductId: oldProductId || "none",
              newProductId: newProductId || "none",
              eventAt,
            },
          },
        });
        
        console.error(`Deprovisioning failed for org ${organizationId}:`, error);
        // Don't re-throw - webhook should still return 200
      }
    }
  );
}
```

### 4. Server Actions (Partially Implemented)

**Status:** Server actions have good error handling with `fromErrorToActionState`, but could add explicit Sentry tracking for critical operations.

**When to add Sentry:**
- ✅ Critical mutations (payment processing, data deletion)
- ❌ Expected validation errors (use ActionState only)
- ❌ Rate limit errors (not actionable)

**Example: Critical Ticket Deletion**

```typescript
// src/features/ticket/actions/delete-ticket.ts
import * as Sentry from "@sentry/nextjs";

export const deleteTicket = async (id: string) => {
  const { user } = await getAuthOrRedirect();
  
  try {
    Sentry.addBreadcrumb({
      category: "action",
      message: "User attempting to delete ticket",
      level: "info",
      data: { ticketId: id, userId: user.id },
    });
    
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket || !isOwner(user, ticket)) {
      return toActionState("ERROR", "Not authorized");
    }
    
    await prisma.ticket.delete({ where: { id } });
    
  } catch (error) {
    // Only capture unexpected errors (not validation errors)
    if (!(error instanceof Error && error.message.includes("Not authorized"))) {
      Sentry.captureException(error, {
        tags: { action: "delete-ticket", ticketId: id },
        user: { id: user.id, email: user.email },
      });
    }
    
    return fromErrorToActionState(error);
  }
  
  revalidatePath(ticketsPath());
  redirect(ticketsPath());
};
```

### 5. Cron Jobs & Health Checks

**Current status:** `src/app/api/cron/keep-alive/route.ts` exists but may not have Sentry.

**Add Sentry for monitoring:**

```typescript
// src/app/api/cron/keep-alive/route.ts
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ status: "healthy" });
  } catch (error) {
    // Capture infrastructure failures
    Sentry.captureException(error, {
      tags: { cron: "keep-alive", severity: "critical" },
    });
    
    return NextResponse.json({ status: "unhealthy" }, { status: 500 });
  }
}
```

---

## 🎯 Sentry Best Practices

### 1. Use Breadcrumbs for Context
```typescript
Sentry.addBreadcrumb({
  category: "user.action",
  message: "User clicked delete button",
  level: "info",
  data: { ticketId: "123", organizationId: "org-456" },
});
```

### 2. Add Tags for Filtering
```typescript
Sentry.captureException(error, {
  tags: {
    feature: "stripe",
    eventType: "subscription.created",
    organizationId: org.id,
  },
});
```

### 3. Use Spans for Performance Tracking
```typescript
await Sentry.startSpan(
  { op: "db.query", name: "fetch-tickets" },
  async () => {
    return await prisma.ticket.findMany();
  }
);
```

### 4. Set User Context in Server Actions
```typescript
const { user } = await getAuthOrRedirect();

Sentry.setUser({
  id: user.id,
  email: user.email,
  organizationId: activeOrganization?.id,
});
```

### 5. Don't Capture Expected Errors
```typescript
// ❌ BAD: Capturing validation errors
try {
  const data = schema.parse(input);
} catch (error) {
  Sentry.captureException(error); // Don't do this!
  return toActionState("ERROR", "Validation failed");
}

// ✅ GOOD: Only capture unexpected errors
try {
  const data = schema.parse(input);
  await prisma.ticket.create({ data });
} catch (error) {
  if (error instanceof ZodError) {
    // Validation error - expected, don't send to Sentry
    return fromErrorToActionState(error);
  }
  
  // Unexpected error - send to Sentry
  Sentry.captureException(error);
  return toActionState("ERROR", "Something went wrong");
}
```

---

## 🚀 Next Steps - Implementation Plan

### Priority 1: Critical Silent Failures (Implement ASAP)
1. ✅ **Stripe Webhooks** - Add Sentry to `/api/stripe/route.ts`
2. ✅ **Deprovisioning Service** - Add Sentry to subscription change handlers
3. ✅ **Inngest Functions** - Add Sentry to all background job events

### Priority 2: Infrastructure Monitoring
4. ✅ **Cron Jobs** - Add health check monitoring
5. ✅ **Database Queries** - Already covered by Prisma integration

### Priority 3: Enhanced Context (Optional)
6. ⏳ Add user context to critical server actions
7. ⏳ Add performance spans to slow operations
8. ⏳ Add custom breadcrumbs to complex workflows

---

## 🧪 Testing Sentry Integration

### Test in Development (Temporarily Enable)
```typescript
// instrumentation-client.ts (TEMP)
enabled: true,  // Force enable for testing
```

Visit test page and throw real errors from component code:
```typescript
<button onClick={() => { throw new Error("Test error"); }}>
  Test Sentry
</button>
```

**Check Sentry:** https://roadtonextprodemo.sentry.io/issues/

**Don't forget to revert:**
```typescript
enabled: process.env.NODE_ENV === 'production',
```

### Test in Production
- Deploy changes
- Trigger real errors (failed webhooks, API errors)
- Monitor Sentry dashboard
- Verify source maps work (readable stack traces)

---

## 📊 Monitoring & Alerts

### Key Metrics to Watch
- **Error rate** - Sudden spikes indicate issues
- **Error volume** - High volume = systemic problem
- **Unresolved issues** - Track backlog
- **Release comparisons** - Which deploy broke things?

### Recommended Alerts
1. **Critical webhooks failing** (Stripe)
2. **Deprovisioning errors** (member removal)
3. **Email delivery failures** (Inngest)
4. **Database connection issues** (Prisma)

### Configure in Sentry Dashboard
- Go to **Alerts** → **Create Alert**
- Set threshold: > 10 errors in 5 minutes
- Notify: Email, Slack, or PagerDuty

---

## 📝 Summary

| Area | Status | Action Needed |
|------|--------|---------------|
| Test files | ✅ Mocked | None - correctly configured |
| Seed scripts | ✅ No Sentry | None - keep as-is |
| Stripe webhooks | ❌ Missing | **ADD Sentry tracking** |
| Inngest jobs | ❌ Missing | **ADD Sentry tracking** |
| Deprovisioning | ❌ Basic logging | **ENHANCE with Sentry** |
| Server actions | ⚠️ Partial | Add to critical actions only |
| Cron jobs | ⚠️ Unknown | Add health monitoring |
| Production | ✅ Configured | None - working correctly |

**Estimated effort:** 2-3 hours to add Sentry to all critical areas.

