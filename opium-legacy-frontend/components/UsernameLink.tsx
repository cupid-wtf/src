'use client';  
import { useState } from 'react';
import { LinkButton } from "@/components/button";

const UsernameLink = () => {
  const [username, setUsername] = useState<string>('');

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value); 
  };

  const uri = `/register?username=${username}`;

  return (
    <>
      <div className="bg-black border inline-flex items-center h-10 border-pink-700 shadow-lg px-2.5 py-2 w-[272px] rounded-lg">
        <p className="select-none">opium.bio/</p>
        <input
          className="bg-transparent placeholder:text-zinc-500 text-white focus-visible:outline-none focus:ring-transparent focus-visible:border-transparent focus-visible:ring-0"
          placeholder="username"
          value={username}
          onChange={handleUsernameChange}
        />
      </div>
      <div>
        <LinkButton href={uri}>Claim</LinkButton>
      </div>
    </>
  );
};

export default UsernameLink;
