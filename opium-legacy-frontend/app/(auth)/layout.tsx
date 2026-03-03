'use client';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className={`min-h-screen antialiased`}>
      {children}
    </section>
  );
}