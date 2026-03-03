import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LinkButton } from "./button";

export default async function Header() {
  const session = await getSession();

  return (
    <div className="transition-all fixed top-0 h-16 z-20 w-screen mx-auto px-3.5 md:px-20 animate-fade-in-top bg-[#0a0a0a]/10 backdrop-blur-md">
      <div className="flex items-center justify-between h-full mx-auto w-full max-w-screen-xl px-3.5 md:px-20 transition-all ease-in-out">
        <Link
          className="font-bold text-xl transition-colors hover:text-pink-700"
          href={"/"}
        >
          opium
        </Link>
        <div className="space-x-2">
          <LinkButton href={"https://discord.gg/rQGAp48cP2"}>Discord</LinkButton>
          {session ? (
            <>
              <LinkButton href={"/dash"}>Dashboard</LinkButton>
            </>
          ) : (
            <>
              <LinkButton href={"/login"}>Login</LinkButton>
              <LinkButton href={"/register"}>Register</LinkButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
