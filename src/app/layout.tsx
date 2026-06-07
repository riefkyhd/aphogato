import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppToaster } from "@/components/AppToaster";

export const metadata: Metadata = {
  title: "Gallery of Muhammad Hadid",
  description: "Gallery of Muhammad Hadid — client photo selection",
  icons: {
    icon: [{ url: "/images/logo/MH_logo.png", type: "image/png" }],
    apple: "/images/logo/MH_logo.png",
    shortcut: "/images/logo/MH_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-bg-primary">
      <body className="bg-bg-primary text-text-primary antialiased min-h-screen">
        {children}
        <AppToaster />
        <Analytics />
      </body>
    </html>
  );
}
