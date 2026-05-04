import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyAbroad AI — Your International Study Advisor",
  description: "AI-powered advisor for studying in USA, Canada, and UK",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
