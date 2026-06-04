import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Gallery of Muhammad Hadid",
  description: "Gallery of Muhammad Hadid — client photo selection",
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
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#141414",
              border: "1px solid #2a2a2a",
              color: "#f0f0f0",
              borderRadius: "2px",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
