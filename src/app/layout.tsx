import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Transplant Wizard MVP",
  description: "Milestone 2 scaffold for clinic, patient, and center portals.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
