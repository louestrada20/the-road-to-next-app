import { Header } from "@/components/header"

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <main className="min-h-screen flex-1 overflow-y-auto overflow-x-hidden pt-16">
        {children}
      </main>
    </>
  )
}

