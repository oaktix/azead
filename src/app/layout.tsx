import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azead | Premium Fintech & Wealth Generation Platform",
  description: "Invest in high-yield structured packages with real-time progressive accrual tracking, instant withdrawals, and bank-grade security on Azead.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
