import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GED Learning Platform",
  description: "Comprehensive GED preparation platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
