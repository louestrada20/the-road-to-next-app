import { Header } from "@/components/header"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Public auth pages (sign-in, sign-up, password-forgot, etc.)
  // Need Header + centered content with proper min-height
  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col pt-16">
        {children}
      </main>
    </>
  )
}
