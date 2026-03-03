'use client';
import { Button } from "@/components/button";
import { CheckIcon, Gem } from "lucide-react";
import { motion } from "framer-motion";

export default function Premium() {
  const tiers = [
    {
      name: "Premium",
      id: '0',
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
      cta: "Coming Soon",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col px-6 md:px-0 items-center justify-center space-y-6">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ ease: "easeInOut", duration: 0.5 }} 
        className="text-3xl font-semibold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent hover:text-foreground transition-colors duration-200 ease-in-out select-none"
      >
        Upgrade Your Plan
      </motion.h1>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ ease: "easeInOut", duration: 0.5, delay: 0.6 }}
        className="w-full max-w-[340px]"
      >
        <div className="grid gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-xl border-2 shadow-lg p-6 ${
                tier.highlighted ? "border-pink-700" : "border-zinc-900"
              }`}
            >
              <h2 className="text-2xl font-bold">{tier.name}</h2>
              <p className="mt-2 text-muted-foreground">{tier.description}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-zinc-500">{tier.href}</span>
              </div>
              <ul className="mt-6 space-y-3">
                  <li  className="flex items-center select-none hover:text-pink-700 transition-all duration-200 ease-in-out">
                    <Gem className="h-5 w-5 text-primary mr-2 shrink-0" />
                    <span>Premium Badge</span>
                  </li>
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center select-none hover:text-pink-700 transition-all duration-200 ease-in-out">
                    <CheckIcon className="h-5 w-5 text-primary mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-6">
                <Button disabled>{tier.cta}</Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
