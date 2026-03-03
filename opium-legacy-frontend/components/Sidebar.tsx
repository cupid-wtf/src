'use client';

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Gem,
  LogOut,
  Settings
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, href: "/dash", label: "Dashboard" },
  { icon: User, href: "/dash/profile", label: "Profile" },
  { icon: Gem, href: "/dash/premium", label: "Premium" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const cachedSidebarItems = useMemo(() => sidebarItems, []);

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        router.push('/');
      }
    } catch {
    }
  }

  return (
    <div className="w-20 border-zinc-900 border-r-2 h-screen flex flex-col items-center justify-between py-8">
      <div className="flex-1 flex flex-col items-center space-y-2">
        {cachedSidebarItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "p-3 rounded-lg border-2 border-transparent transition-colors duration-200 hover:bg-pink-700 hover:border-solid group",
              pathname === item.href ? "border-2 border-pink-700 border-dashed" : "text-white"
            )}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        ))}
      </div>
      <div className="flex flex-col">
        <Link
          href={'/dash/account'}
          className="p-3 rounded-xl hover:bg-pink-700 transition-colors duration-200"
          aria-label="Logout"
        >
          <Settings className="w-6 h-6" />
        </Link>
        <button
          onClick={handleLogout} 
          className="p-3 rounded-xl hover:bg-pink-700 transition-colors duration-200"
          aria-label="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
