import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Synthetic Data Generator",
  description: "Generate millions of records of synthetic data for testing and QA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 min-h-screen flex flex-col`}>
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Synthetic<span className="text-blue-500">Data</span></h1>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
              For testing purposes only
            </div>
          </div>
        </header>
        <div className="flex flex-1 max-w-7xl mx-auto w-full">
          <Sidebar />
          <main className="flex-1 px-4 py-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
