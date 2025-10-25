import { Footer } from "@/app/_navigation/footer"
import { SideBar } from "@/app/_navigation/sidebar/components/sidebar"
import { Header } from "@/components/header"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect"

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await getAuthOrRedirect()
  
  return (
    <>
      <Header />
      <div className="flex h-screen overflow-hidden border-collapse">
        <SideBar />
        <main className="min-h-screen flex-1 overflow-y-auto overflow-x-hidden pt-24 pb-16 px-3 sm:px-6 lg:px-8 bg-secondary/20 flex flex-col">
          {children}
        </main>
      </div>
      <Footer />
    </>
  )
}