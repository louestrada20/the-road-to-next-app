import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type StatCardProps = {
  value: number | string
  label: string
  icon: LucideIcon
  prefix?: string
}

export function StatCard({ value, label, icon: Icon, prefix }: StatCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Icon className="h-8 w-8 mb-4 text-primary" />
        <div className="text-4xl font-bold tracking-tight mb-2">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-muted-foreground text-center">{label}</div>
      </CardContent>
    </Card>
  )
}

