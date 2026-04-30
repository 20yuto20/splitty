import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Splitty — Split shared expenses, fast and fair",
  description:
    "Splitty is a free tool to track group expenses for trips, dinners, and roommates. Add who paid what, and Splitty figures out who owes whom.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-16 sm:px-6">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="mt-16 text-center text-xs text-slate-400">
            Built with Splitty · Share fairly.
          </footer>
        </div>
      </body>
    </html>
  );
}
