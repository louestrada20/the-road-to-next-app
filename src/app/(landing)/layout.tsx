import { Header } from "@/components/header"

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Landing page has its own layout without the h-screen/overflow container
  // This prevents double scrollbars and gives the landing page natural document flow
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}

