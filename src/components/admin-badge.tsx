import { LucideShield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const AdminBadge = () => {
  return (
    <Badge 
      variant="secondary" 
      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
    >
      <LucideShield className="w-3 h-3 mr-1" />
      Admin
    </Badge>
  )
}

export { AdminBadge }
