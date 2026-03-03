import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Opium | Dashboard",
  description: "Why use a regular .bio when you can use opium.bio?",
  openGraph: {
    title: "Opium",
  description: "Why use a regular .bio when you can use opium.bio?",
    url: "https://opium.bio",
    type: "website",
    siteName: "opium.bio",
  },
};
export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession()
  if(!session) {
    redirect('/')
  }
  return (
      <section
        className="antialiased"
      >
        <div className="h-screen flex">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto">
        {children}
</main></div>
      </section>
  );
}
