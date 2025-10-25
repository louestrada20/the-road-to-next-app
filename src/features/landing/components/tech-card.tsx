import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TechCardProps = {
  name: string
  description: string
  icon: React.ReactNode
}

export function TechCard({ name, description, icon }: TechCardProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="mb-2 flex items-center justify-center text-4xl">{icon}</div>
        <CardTitle className="text-center text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

