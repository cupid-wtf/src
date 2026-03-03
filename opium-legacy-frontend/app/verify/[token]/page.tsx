'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LinkButton } from "@/components/button"
import { Check, CircleX, X } from "lucide-react"
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { use } from 'react'

export default function EmailVerification({ params }: { params: Promise<{ token: string }> }) {
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null)
    const [showIcon, setShowIcon] = useState(false)
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const { token } = use(params)

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) throw new Error('Verification failed');
                
                setIsSuccess(true);
                setAlertMessage('Your email has been successfully verified!');
            } catch {
                setIsSuccess(false);
                setAlertMessage('Verification failed.');
            }
        };

        if (token) {
            verifyEmail();
        } else {
            setIsSuccess(false);
            setAlertMessage('Invalid token. Please check the link in your email.');
        }
    }, [token]);

    useEffect(() => {
        if (isSuccess !== null) {
            const timer = setTimeout(() => setShowIcon(true), 500)
            return () => clearTimeout(timer)
        }
    }, [isSuccess]);
    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => setAlertMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    if (isSuccess === null) {
        return (
            <div className="w-screen h-screen flex items-center justify-center">
                <div className="p-8 w-full max-w-md border-zinc-900 border-2 rounded-xl shadow-lg flex flex-col space-y-6 items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    <p>Verifying your email...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-screen h-screen flex items-center justify-center">
            <div className="p-8 w-full max-w-md border-zinc-900 border-2 rounded-xl shadow-lg flex flex-col space-y-6 items-center justify-center transition-all duration-300 ease-in-out">
                <div className={`rounded-full border-4 ${isSuccess ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} p-2 transition-all duration-500 ease-in-out transform ${showIcon ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                    {isSuccess ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
                </div>
                <h1 className="text-2xl font-bold">
                    {isSuccess ? 'Email Verified Successfully' : 'Email Verification Failed'}
                </h1>
                {isSuccess && (
                    <p className="text-center">
                        Your email has been verified. You can now access your account.
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <LinkButton 
                        href='/'
                        className={`w-full text-white transition-colors duration-300 ${
                            isSuccess 
                                ? 'bg-green-600 border-green-700 hover:bg-green-700' 
                                : 'bg-red-600 border-red-700 hover:bg-red-700'
                        }`}
                    >
                        {isSuccess ? 'Go Home' : 'Try Again'}
                    </LinkButton>
                </div>
                {!isSuccess && (
                    <p className="text-sm">
                        Need help? <Link href="https://discord.gg/potus" className="text-red-500 transition-all duration-200 hover:underline">Join our discord server</Link>
                    </p>
                )}
            </div>
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
                        <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{alertMessage}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
