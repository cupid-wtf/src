'use client';
import { useState } from "react";
import { LinkButton } from "@/components/button";
export default function Hero() {
  const [username, setUsername] = useState<string>('')
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value); 
  };
  const uri = `/register?username=${username}`
    return(
      <main className="items-center justify-center space-y-2 flex flex-col min-h-[calc(100vh-0rem)]">
        <h1 
          className="text-3xl font-bold"
        >
          opium.<span className="text-pink-700">bio</span>
        </h1>
        <p>
          Why use a regular{' '}<span className="text-pink-700 font-bold">.bio</span>{' '}when you can use opium.bio?
        </p>
        <section className="flex space-x-4">
          <div 
            className="bg-black border inline-flex items-center h-10 border-pink-700 shadow-lg px-2.5 py-2 w-[272px] rounded-lg"
          >
            <p className="select-none">opium.bio/</p>
            <input 
              className="bg-transparent placeholder:text-zinc-500 text-white focus-visible:outline-none focus:ring-transparent focus-visible:border-transparent focus-visible:ring-0" 
              placeholder="username"
              value={username}
              onChange={handleUsernameChange}
            />
          </div>
          <div
          >
            <LinkButton href={uri}>Claim</LinkButton>
          </div>
        </section>
      </main>
    )
}