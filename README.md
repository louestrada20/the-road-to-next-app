# The Road to Next

**A modern, multi-tenant SaaS application for ticket management with bounty incentives**

A production-ready, full-stack ticketing system built with Next.js 16, featuring organization-based access control, monetary bounties for ticket resolution, and integrated AI agent collaboration via Model Context Protocol (MCP).

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/the-road-to-next-app.git
cd the-road-to-next-app
npm install

# Configure environment (see Getting Started section)
cp .env.example .env

# Initialize database
npx prisma db push
npm run seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` and sign in with:
- **Email**: `admin@admin.com`
- **Password**: `password123`

## 🎯 Key Features

### Multi-Tenant Architecture
- **Organization-based isolation**: Complete data separation between organizations
- **Role-based access control**: Granular permissions (Member/Admin) with fine-grained controls (create, update, delete, resolve)
- **Secure authentication**: Custom session-based auth with email verification and password reset flows
- **Rate limiting**: Multi-stage protection using Upstash Redis (IP + email-level throttling)

### Bounty Resolution System
- **Monetary incentives**: Attach rewards to tickets to motivate quick resolutions
- **Approval workflow**: Request → Approve → Pay flow with audit trail
- **Solver tracking**: Automatic assignment and payment tracking for completed tickets
- **Public ticket sharing**: Publish tickets externally with controlled access

### Real-Time Collaboration
- **Ticket comments**: Threaded conversations on any ticket
- **File attachments**: Upload files with automatic thumbnail generation via Vercel Blob
- **Status tracking**: OPEN → IN_PROGRESS → DONE workflow
- **Notifications**: Email notifications via Resend for all ticket events

### Payments & Subscriptions
- **Stripe integration**: Full subscription management with webhook handling
- **Race condition protection**: Event timestamp-based idempotency for reliable webhook processing
- **Multiple subscription tiers**: Support for trial, active, past_due, and cancellation states
- **Automated deprovisioning**: Multi-stage grace period system with email notifications before account cleanup

### AI Agent Integration
- **Model Context Protocol (MCP)**: Custom server exposing 9 authenticated tools for AI assistants
- **CRUD operations**: List, create, update, delete, and search tickets programmatically
- **Organization scoping**: All operations automatically scoped to authenticated context
- **Credential-based auth**: Secure API token system for AI agent access

### Enterprise Testing
- **Vitest + React Testing Library**: Comprehensive unit and integration test coverage
- **Playwright E2E**: Full browser automation testing across Chromium, Firefox, and WebKit
- **Type-safe mocks**: Comprehensive mocking of Prisma, Next.js, and external services
- **100% TypeScript**: Strict type checking including test files with separate TypeScript configs

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - App Router with React Server Components
- **React 19** - Latest React features with concurrent rendering
- **TypeScript** - Strict type safety throughout
- **ShadCN UI** - Accessible component library built on Radix UI
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Server state management
- **React Email** - Beautiful transactional email templates

### Backend
- **Next.js Server Actions** - Type-safe mutations with built-in form handling
- **Prisma ORM** - Type-safe database access with PostgreSQL
- **Zod** - Runtime validation and type inference
- **Custom Auth** - Session-based authentication with Argon2 password hashing

### Infrastructure
- **Upstash Redis** - Distributed rate limiting and caching
- **Vercel Blob** - File storage with CDN
- **Resend** - Transactional email delivery
- **Inngest** - Reliable background job processing
- **Stripe** - Payment processing and subscription management

### Developer Experience
- **MCP Server** - Custom implementation for AI agent integration
- **Vitest** - Fast unit testing with Hot Module Replacement
- **Playwright** - E2E testing with cross-browser support
- **TypeScript strict mode** - Catching errors at compile time
- **ESLint + Prettier** - Code quality and formatting

## 📁 Architecture

### Feature-Based Organization
```
src/
├── features/[domain]/
│   ├── actions/        # Server actions (mutations)
│   ├── components/     # Feature-specific UI
│   ├── queries/        # Data fetching
│   ├── types/          # TypeScript definitions
│   └── utils/          # Feature utilities
├── components/
│   ├── form/           # Form handling utilities
│   └── ui/             # ShadCN UI components
├── lib/                # Shared utilities
└── app/                # Next.js App Router pages
```

### Key Patterns

**Server Actions Pattern**
```typescript
"use server"
export const upsertTicket = async (
  id: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, activeOrganization } = await getAuthOrRedirect()
  
  // Validation with Zod
  const data = actionSchema.parse(Object.fromEntries(formData))
  
  // Database operations with Prisma
  await prisma.ticket.upsert({
    where: { id: id || "" },
    update: dbData,
    create: { ...dbData, organizationId: activeOrganization!.id }
  })
  
  // Revalidation
  revalidatePath(ticketsPath())
}
```

**Race Condition Protection** (Stripe Webhooks)
```typescript
const handleSubscriptionCreated = async (
  subscription: Stripe.Subscription,
  eventAt: number
) => {
  const existing = await prisma.stripeCustomer.findUniqueOrThrow({
    where: { customerId: subscription.customer as string }
  })
  
  // Only update if this event is newer
  if (!existing.eventAt || existing.eventAt < eventAt) {
    await prisma.stripeCustomer.update({
      where: { customerId: subscription.customer as string },
      data: {
        // ... subscription data
        eventAt, // Store event timestamp
      }
    })
  }
}
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20.9.0 or higher
- **PostgreSQL** database
- **Upstash Redis** account (for rate limiting)
- **Stripe** account (for payments)
- **Resend** account (for email)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-road-to-next-app.git
cd the-road-to-next-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npx prisma db push

# Seed database (creates demo data + MCP credential)
npm run seed

# Start development server
npm run dev
```

### Environment Variables

```env
# App Configuration
NEXT_PUBLIC_APP_URL="https://www.yourdomain.com"  # Your canonical domain (production)

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Stripe
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

# Resend
RESEND_API_KEY="..."

# Session (auto-generated, kept in .env)
SESSION_SECRET="..."

# MCP (auto-generated by seed script)
MCP_CREDENTIAL_TOKEN="..."
```

### MCP Server Setup (Optional)

For AI assistant integration:

```bash
# Configure Cursor/Claude Desktop with MCP credential
npm run setup-mcp

# Restart your editor completely
```

The seed script auto-generates the MCP credential token. See `docs/mcp-setup.md` for detailed setup instructions.

## 💻 Development

### Running Tests

```bash
# Run unit tests in watch mode
npm test

# Run unit tests once
npm run test:run

# Run with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# TypeScript type checking
npm run type

# TypeScript checking for tests
npm run type:test

# ESLint
npm run lint

# Fix linting issues
npm run lint-fix
```

### Database Management

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Generate Prisma Client (runs on postinstall)
npx prisma generate

# Create migration (if needed)
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

## 📦 Deployment

### Vercel

This project is optimized for Vercel deployment with:

- Custom Prisma build script (`scripts/prisma-vercel-build.js`)
- Vercel Blob integration for file storage
- Environment variable configuration
- Edge-compatible packages

```bash
# Deploy to Vercel
vercel

# Preview deployment
vercel --prod
```

### Build Process

```bash
# Type check before building
npm run type && npm run type:test

# Build for production
npm run build

# Start production server
npm run start
```

The build process includes:
- TypeScript compilation with no errors
- Prisma Client generation with proper binary targets
- Next.js optimization and code splitting
- Test files excluded from production bundle

## 🎓 Key Implementation Examples

### Authentication & Authorization
See: `src/features/auth/actions/sign-in.ts`
- Rate limiting (IP + email level)
- Password hashing with Argon2
- Session management with secure cookies
- Email verification workflow

### Form Handling
See: `src/features/ticket/components/ticket-upsert-form.tsx`
- Client-side ActionState management
- Server-side Zod validation
- Error handling with field-level feedback
- Optimistic updates

### Server Actions
See: `src/features/ticket/actions/upsert-ticket.ts`
- Type-safe mutations
- Authorization checks before operations
- Database upsert patterns
- Path revalidation after mutations

### Webhook Processing
See: `src/app/api/stripe/webhook/route.ts`
- Stripe signature verification
- Idempotency with event timestamps
- Race condition protection
- Error handling for invalid events

## 🧪 Testing Strategy

### Unit & Integration Tests
- **Framework**: Vitest with React Testing Library
- **Location**: `src/**/__tests__/`
- **Mocking**: Comprehensive mocks for Prisma, Next.js, external services
- **Coverage**: Server actions, components, utilities

### End-to-End Tests
- **Framework**: Playwright
- **Location**: `e2e/*.spec.ts`
- **Browsers**: Chromium, Firefox, WebKit
- **Scenarios**: Authentication, ticket CRUD, search, public tickets

### Test Utilities
- Factories: `src/test/factories/` - Consistent test data generation
- Helpers: `src/test/helpers/` - Rendering utilities and auth mocks
- Mocks: `src/test/types/mocks.ts` - Type-safe mock functions

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Testing Guide](docs/testing.md)** - Testing patterns and best practices
- **[E2E Testing](docs/e2e-testing.md)** - Playwright setup and usage
- **[MCP Setup](docs/mcp-setup.md)** - MCP server configuration
- **[Bounty System](docs/bounty-resolution-system.md)** - Feature deep-dive
- **[Deprovisioning](docs/deprovisioning-notifications-and-execution.md)** - Background job automation
- **[Architecture](.cursorrules)** - Full development guide and patterns

## 🌟 Project Highlights

### Production-Ready Features
- ✅ Type-safe end-to-end (TypeScript strict mode everywhere)
- ✅ Comprehensive test coverage (Vitest + Playwright)
- ✅ Rate limiting on all sensitive operations
- ✅ Webhook race condition protection
- ✅ Multi-stage organization deprovisioning
- ✅ Custom MCP server for AI agent integration
- ✅ Proper authorization on all mutations
- ✅ File upload with automatic thumbnails
- ✅ Email notifications via Resend
- ✅ Stripe subscription management

### Engineering Decisions
- **Server Actions over API Routes**: Type safety and better integration with forms
- **Prisma over raw SQL**: Type-safe queries with great DX
- **Feature-based architecture**: Scales well and enforces separation of concerns
- **Custom auth over NextAuth**: Full control over session management
- **Vercel Blob over S3**: Simpler integration for serverless
- **ActionState pattern**: Consistent error handling across all forms

## 📊 Project Stats

- **Lines of Code**: ~15,000+
- **TypeScript Coverage**: 100%
- **Test Coverage**: Server actions, components, utilities
- **Database Models**: 11 with complex relations
- **Server Actions**: 20+ type-safe mutations
- **API Endpoints**: Webhook handlers, MCP server
- **Components**: 50+ reusable UI components

## 🤝 Contributing

While this is currently a personal project, contributions and feedback are welcome. Please open an issue to discuss any changes.



---

**Built with ❤️ using Next.js 16 and modern web technologies**