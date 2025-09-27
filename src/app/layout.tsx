import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metro Flood",
  description: "Real-time flood risk assessment for subway systems with predictive modeling and mitigation suggestions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
