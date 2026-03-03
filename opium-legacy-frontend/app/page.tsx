import Header from "@/components/Header";
import Hero from "@/components/Hero";
export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Plans = [] = [
    {
    name: "Free",
    description: "Create your digital presence with a simple bio page.",
    price: "$0",
    features: [
      `Free Effects`,
      `Free Layouts`,
      `Typewriter Animation`,
      `Markdown (coming soon)`,
    ],
    Button: "Get Started",
    prefix: "/Lifetime",
  },
  {
    name: "Pro",
    description: "Elevate your online presence with advanced features and customizable layouts.",
    prefix: "/Lifetime",
    price: "$3.99",
    Button: "Purchase",
    features: [
      `All in the free plan`,
      `Extra layouts`,
      `Profile Effects`,
      `Custom Domains (Coming Soon)`,
      `Emails (coming soon)`,
      `Premium Badge`,
    ],
  }
];
  return (
    <>
    <Header />
    <Hero />
    </>
  );
}
