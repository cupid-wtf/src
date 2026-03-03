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

export default function Login() {
    const [identifier, setIdentifier] = useState<string>('');
    const [token, setToken] = useState<any>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();
    const [signInSuccess, setSignInSuccess] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (signInSuccess) {
            const timer = setTimeout(() => {
                router.push('/dash');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [signInSuccess, router]);

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
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier,
                    token,
                    password,
                }),
            });
    
            const result = await response.json();
    
            if (!result.success) {
                setAlertMessage(result.message ? result.message : "Invalid credentials. Please check your email and password.");
                setIsSuccess(false);
            } else {
                setAlertMessage(result.message || "Successfully signed in!");
                setIsSuccess(true);
                setSignInSuccess(true);
                router.push('/dash'); 
            } 
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to sign in. Please try again.";
            setAlertMessage(errorMessage);
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <main className="flex items-center justify-center min-h-screen">
            <main className="h-auto flex flex-col p-8 rounded-md justify-center">
                <h1 className="text-2xl font-bold mb-2">Login</h1>
                <form className="w-72 flex flex-col items-center justify-center space-y-4 rounded-md" onSubmit={handleSubmit}>
                    <Input 
                        value={identifier} 
                        onChange={(e) => setIdentifier(e.target.value)} 
                        required 
                        className="w-full"
                        type="text" 
                        placeholder="Email" 
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
                        appendTo: 'body'
                      }}
                     />
                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading && (<LoaderCircle className="animate-spin h-4 w-4 mr-2"/>)}
                        Sign In
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
                            className={`border-2 ${
                                isSuccess ? 'border-green-600 bg-green-700' : 'border-red-600 bg-red-700'
                            }`}
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
