import {
  LucideBell,
  LucideBuilding2,
  LucideDollarSign,
  LucideFileText,
  LucideShield,
  LucideUsers,
} from "lucide-react"
import { FeatureCard } from "@/features/landing/components/feature-card"

const features = [
  {
    title: "Bounty System",
    description: "Attach monetary rewards to tickets to incentivize quick resolutions and motivate your team",
    icon: <LucideDollarSign className="h-8 w-8" />,
  },
  {
    title: "Multi-Tenant Organizations",
    description: "Organization-based access control with role permissions and secure data isolation",
    icon: <LucideBuilding2 className="h-8 w-8" />,
  },
  {
    title: "Real-time Collaboration",
    description: "Stay synced with instant notifications, comments, and live updates across your team",
    icon: <LucideBell className="h-8 w-8" />,
  },
  {
    title: "Secure Authentication",
    description: "Custom session-based authentication with email verification and password management",
    icon: <LucideShield className="h-8 w-8" />,
  },
  {
    title: "Role-based Permissions",
    description: "Granular control over who can create, update, or delete tickets within organizations",
    icon: <LucideUsers className="h-8 w-8" />,
  },
  {
    title: "File Attachments",
    description: "Upload and share files with automatic thumbnails and cloud storage integration",
    icon: <LucideFileText className="h-8 w-8" />,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete ticketing system with powerful features designed for modern development teams
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

