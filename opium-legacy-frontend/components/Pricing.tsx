import { CheckIcon } from "lucide-react";
import { Button } from "./button";
import { getSession } from "@/lib/auth";

export default async function Prcing() {
    const session = getSession();
    const tiers = [
        {
          name: 'Free',
          id: '0',
          href: '/Lifetime',
          price: '$0',
          description: `Create your digital presence with a simple bio page..`,
          features: [
            'Free Effects',
           'Free Layouts',
           'Typewriter Animation',
           'Markdown (coming soon)',
          ],
          cta: `Get Started`,
        },
        {
            name: "Pro",
            price: "$3.99",
            href: '/Lifetime',
            description: "Elevate your online presence with advanced features and customizable layouts.",
            features: [
              "All in Free Plan",
              "Extra Layouts",
              "Profile Effects",
              "Custom Domains (Coming Soon)",
              "Emails (coming soon)",
              "Premium Badge",
            ],
            highlighted: true,
            cta: "Purchase",
          },
      ];
    return(
        <div className="mx-auto max-w-2xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.id || tier.name}
                className={`relative rounded-xl border-2 shadow-lg  ${
                  tier.highlighted ? "border-pink-700" : "border-zinc-900"
                }`}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold">{tier.name}</h2>
                  <p className="mt-2 text-muted-foreground">{tier.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground ml-2">{tier.href}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-primary mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0">
                <Button disabled={!!session && tier.name === "Free"}>
                {tier.cta}
              </Button>
                </div>
              </div>
            ))}
          </div>
        </div>     
    )
}