import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FrameForge AI — Film Studio",
  description:
    "One easy tool to make AI videos: idea to story to storyboard to generation to export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
