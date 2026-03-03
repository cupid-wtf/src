'use client';
import { Button } from "@/components/button";
import { Check, Eye, Hash, LoaderCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react"

export default function Dash() {
    const [username, setUsername] = useState<string>('');
    const [uid, setUID] = useState<string>('');
    const [domains, setDomains] = useState<string[]>([]); 
    const [loading, isLoading] = useState<boolean>(true);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/user/me');
                const data = await response.json();
                setUsername(data.user.username);
                setUID(data.user.uid);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };
        const fetchDomains = async () => {
            try {
                const response = await fetch('/api/domains/list');
                const data = await response.json();
                if (data.success) {
                    const allDomains = data.domains.flat().map((domain: { url: unknown; }) => domain.url);
                    setDomains(allDomains);
                } else {
                    console.error('Failed to fetch domains:', data);
                }
            } catch (error) {
                console.error('Failed to fetch domains:', error);
            } finally {
                isLoading(false)
            }
        };
        fetchUser();
        fetchDomains();
    }, []);
    if (loading) {
        return <div className="min-h-screen  flex items-center justify-center">
            <LoaderCircle className="animate-spin duration-200 h-24 w-24" />
        </div>; 
    }
    return(
        <main className="p-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="h-48 w-96 p-6 space-y-2 border-2 rounded-lg border-zinc-900 hover:border-pink-700 transition-colors delay-75 duration-200">
                    <div className="w-fit rounded-lg border-2 border-zinc-900 p-2">
                        <UserRound />
                    </div>
                    <div>
                    <h1 className="font-bold text-lg">Username</h1>
                    <h2>{username}</h2>
</div>
</div>
            <div className="h-48 w-96 p-6 space-y-2 border-2 rounded-lg border-zinc-900 hover:border-pink-700 transition-colors delay-75 duration-200">
                    <div className="w-fit rounded-lg border-2 border-zinc-900 p-2">
                        <Hash />
                    </div>
                    <div>
                    <h1 className="font-bold text-lg">UID</h1>
                    <h2>{uid}</h2>
</div>
</div>
            <div className="h-48 w-96 p-6 space-y-2 border-2 rounded-lg border-zinc-900 hover:border-pink-700 transition-colors delay-75 duration-200">
                    <div className="w-fit rounded-lg border-2 border-zinc-900 p-2">
                        <Eye/>
                    </div>
                    <div>
                    <h1 className="font-bold text-lg">Views</h1>
                    <h2>Coming Soon</h2>
</div>
</div>
            <div className="h-96 w-96 p-6 space-y-2 border-2 rounded-lg border-zinc-900 hover:border-pink-700 transition-colors delay-75 duration-200">
                    <div>
                    <h1 className="font-bold text-lg">Domains</h1>
                    <section className="pt-2">
                    <Button disabled className="w-full  ">Add Domain</Button>
                    </section>
                    <section className="mt-2">
    <ul className="max-h-60 overflow-y-auto ">
        {domains.map((domain, index) => (
            <li
                className="flex justify-between items-center hover:text-pink-700 transition-colors delay-75 duration-200 h-10"
                key={index}
            >
                <Link href={`https://${domain}`}>{domain}</Link>
                <Check className="text-green-700 ml-2" />
            </li>
        ))}
    </ul>
</section>
                    <h2></h2>
</div>
</div>
        </main>
    )
}