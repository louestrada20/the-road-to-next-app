import { LucideInfo,LucideShield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const AdminBanner = () => {
  return (
    <Alert className="border-blue-200 bg-blue-50/50 mb-6">
      <LucideShield className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Admin Area</strong> - You have administrative privileges for this organization. 
        Changes made here affect all members.
      </AlertDescription>
    </Alert>
  )
}

export { AdminBanner }
