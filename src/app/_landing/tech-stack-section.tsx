import { TechCard } from "@/features/landing/components/tech-card"

const techStack = [
  {
    name: "Next.js 16",
    description: "React framework with App Router and Cache Components",
    icon: "⚡",
  },
  {
    name: "TypeScript",
    description: "Type-safe development with strict mode enabled",
    icon: "🔷",
  },
  {
    name: "Prisma",
    description: "Type-safe database ORM with PostgreSQL",
    icon: "🔺",
  },
  {
    name: "Tailwind CSS",
    description: "Utility-first CSS with custom theme support",
    icon: "💨",
  },
  {
    name: "ShadCN UI",
    description: "Beautiful, accessible component library",
    icon: "🎨",
  },
  {
    name: "Stripe",
    description: "Secure payment processing and subscriptions",
    icon: "💳",
  },
  {
    name: "PostHog",
    description: "Product analytics, feature flags, and user insights",
    icon: "📊",
  },
  {
    name: "Sentry",
    description: "Error monitoring, performance tracking, and observability",
    icon: "🐛",
  },
  {
    name: "Inngest",
    description: "Background job processing and event handling",
    icon: "⚙️",
  },
  {
    name: "Upstash Redis",
    description: "Rate limiting and caching infrastructure",
    icon: "🚀",
  },
]

export function TechStackSection() {
  return (
    <section className="py-16 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Built With Modern Tech</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Leveraging the best tools and frameworks for performance, security, and developer experience
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {techStack.map((tech) => (
            <TechCard key={tech.name} {...tech} />
          ))}
        </div>
      </div>
    </section>
  )
}

