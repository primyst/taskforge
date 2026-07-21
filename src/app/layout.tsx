import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const bodyFont = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskForge — AI-assisted project management",
  description:
    "Describe the goal, watch the tasks appear. Teams, roles, comments, and files, all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.className} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}