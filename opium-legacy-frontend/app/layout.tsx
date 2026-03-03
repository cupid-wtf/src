import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const font = localFont({
  src: './fonts/Poppins-Regular.woff',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Opium",
  description: "Why use a regular .bio when you can use opium.bio?",
  openGraph: {
    title: "Opium",
  description: "Why use a regular .bio when you can use opium.bio?",
    url: "https://opium.bio",
    type: "website",
    siteName: "opium.bio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${font.className} antialiased`}>
             <link rel="icon" href={'https://github.com/opium-bio/.github/blob/main/assets/outline.png?raw=true'} sizes="any" />
        {children}
      </body>
    </html>
  );
}
