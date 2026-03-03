/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/button";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle, Check, X, CircleX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { Turnstile } from '@marsidev/react-turnstile'
import { Input } from "@/components/input";

export default function Register() {
    const [url, setUrl] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [token, setToken] = useState<any>('');
    const router = useRouter();
    const [signUpSuccess, setSignUpSuccess] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (signUpSuccess) {
            const timer = setTimeout(() => {
                router.push('/login'); 
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [signUpSuccess, router]);

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => {
                setAlertMessage(null);
                setIsSuccess(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    username,
                    email,
                    token,
                    password,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                setAlertMessage(result.error || "Failed to register. Please try again.");
                setIsSuccess(false);
            } else {
                setAlertMessage("Successfully registered! Please check your email for a verification link.");
                setIsSuccess(true);
                setSignUpSuccess(true);             
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to register. Please try again.";
            console.error("Sign-up error:", errorMessage);
            setAlertMessage(errorMessage);
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen">
            <main className="h-auto flex flex-col p-8 rounded-md justify-center">
                <h1 className="text-2xl font-bold mb-3.5">Create an Account</h1>
                <form className="w-72 flex flex-col items-center justify-center space-y-4 rounded-md" onSubmit={handleSubmit}>
                <div className="inline-flex items-center h-10 shadow-lg py-2 w-full rounded-lg">
    <p className="select-none border-2 py-2 rounded-l-lg border-zinc-900 px-1.5 border-r-0">opium.bio/</p>
    <Input 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        required 
        className="flex-grow rounded-l-none" 
        type="text" 
        placeholder="Username" 
        disabled={loading} 
    />
</div>
                    <Input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        className="w-full"
                        type="text" 
                        placeholder="Username" 
                        disabled={loading} 
                    />
                    <Input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className="w-full"
                        type="email" 
                        placeholder="example@example.com" 
                        disabled={loading} 
                    />
                    <Input 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        type="password" 
                        className="w-full"
                        placeholder="Password" 
                        disabled={loading} 
                    />
                    <Turnstile 
                        siteKey='0x4AAAAAAAyrZ67-i4Wan6hb' 
                        options={{
                            action: 'submit-form',
                            theme: 'dark',
                            size: 'normal',
                            language: 'en',
                        }}
                        onSuccess={setToken}
                        scriptOptions={{
                            appendTo: 'body',
                        }}
                    />
                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading && (<LoaderCircle className="animate-spin h-4 w-4 mr-2"/>)}
                        Register
                    </Button>
                </form>
            </main>
            <AnimatePresence>
                {alertMessage && (
                    <motion.div
                        className="fixed bottom-8 transform px-4 py-3 rounded-lg shadow-lg"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Alert 
                            className={`border-2 ${isSuccess ? 'border-green-600 bg-green-700' : 'border-red-600 bg-red-700'}`}
                        >
                            {isSuccess ? (
                                <Check className="h-4 w-4 text-green-200" />
                            ) : (
                                <X className="h-4 w-4 text-red-200" />
                            )}
                            <CircleX className="h-4 w-4" />
                            <AlertTitle>{isSuccess ? "Success" : "Error"}</AlertTitle>
                            <AlertDescription>{alertMessage}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
