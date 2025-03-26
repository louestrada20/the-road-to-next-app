import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {NuqsAdapter} from "nuqs/adapters/next/app";
import {SideBar} from "@/app/_navigation/sidebar/components/sidebar";
import {ReactQueryProvider} from "@/app/_providers/react-query/react-query-provider";
import {Header} from "@/components/header";
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


          <Header/>
          <div className="flex h-screen overflow-hidden border-collapse">
            <SideBar/>
            <main
                className='min-h-screen flex-1 overflow-y-auto overflow-x-hidden py-24 px-8 bg-secondary/20 flex flex-col '>
              {children}
            </main>
          </div>
          <Toaster expand/>
        </ReactQueryProvider>
      </ThemeProvider>
    </NuqsAdapter>
    <footer className="text-center m-1 p-1">
      Website by Louis Estrada - from The Road to Next Course by Robin Wieruch -
      <a href="https://www.road-to-next.com/"
         target="_blank"
         rel="noopener noreferrer">
        Road To Next
      </a>
    </footer>
    </body>
    </html>
  );
}
