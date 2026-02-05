import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Lucky Spin - Win Amazing Prizes",
  description: "Spin the wheel and win amazing prizes with blockchain-powered fairness using Chainlink VRF",
  keywords: ["lucky draw", "spin wheel", "blockchain", "web3", "prizes", "chainlink vrf"],
  authors: [{ name: "Lucky Spin" }],
  openGraph: {
    title: "Lucky Spin - Win Amazing Prizes",
    description: "Spin the wheel and win amazing prizes with blockchain-powered fairness",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1628",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a1628] min-h-screen text-white`}
      >
        <Web3Provider>
          {children}
          <ToastProvider />
        </Web3Provider>
      </body>
    </html>
  );
}
