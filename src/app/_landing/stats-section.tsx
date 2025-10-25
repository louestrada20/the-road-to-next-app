import { LucideBuilding2, LucideCheckCircle, LucideDollarSign, LucideTicket } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/features/landing/components/stat-card"
import { getPlatformStats } from "@/features/landing/queries/get-platform-stats"
import { fromCent } from "@/utils/currency"

async function StatsContent() {
  const stats = await getPlatformStats()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard value={stats.organizations} label="Organizations" icon={LucideBuilding2} />
      <StatCard value={stats.totalTickets} label="Total Tickets" icon={LucideTicket} />
      <StatCard value={stats.resolvedTickets} label="Resolved" icon={LucideCheckCircle} />
      <StatCard
        value={fromCent(stats.totalBounties)}
        label="Bounties Paid"
        icon={LucideDollarSign}
        prefix="$"
      />
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-8 w-8 mb-4 mx-auto" />
          <Skeleton className="h-10 w-24 mb-2 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export function StatsSection() {
  return (
    <section className="py-16 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Platform Statistics</h2>
          <p className="text-muted-foreground">Real-time insights from our growing community</p>
        </div>
        <Suspense fallback={<StatsLoading />}>
          <StatsContent />
        </Suspense>
      </div>
    </section>
  )
}

