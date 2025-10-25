import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {NuqsAdapter} from "nuqs/adapters/next/app";
import {Footer} from "@/app/_navigation/footer";
import {SideBar} from "@/app/_navigation/sidebar/components/sidebar";
import {ReactQueryProvider} from "@/app/_providers/react-query/react-query-provider";
import {Header} from "@/components/header";
import {MobileSidebar} from "@/components/mobile-sidebar";
import {MobileSidebarProvider} from "@/components/mobile-sidebar-context";
import {ThemeProvider} from "@/components/theme/theme-provider";
import {Toaster} from "@/components/ui/sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Road To Next",
  description: "My Road To Next Application ...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html suppressHydrationWarning lang="en">
    <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
    <NuqsAdapter>
      <ThemeProvider>
        <ReactQueryProvider>
          <MobileSidebarProvider>
            <Header/>
            <div className="flex h-screen overflow-hidden border-collapse">
              <SideBar/>
              <main
                  className='min-h-screen flex-1 overflow-y-auto overflow-x-hidden pt-24 pb-16 px-3 sm:px-6 lg:px-8 bg-secondary/20 flex flex-col '>
                {children}
              </main>
            </div>
            <MobileSidebar />
            <Footer/>
            <Toaster expand/>
          </MobileSidebarProvider>
        </ReactQueryProvider>
      </ThemeProvider>
    </NuqsAdapter>
    </body>
    </html>
  );
}
