'use client';
import { useState, useEffect } from "react";
import { Input } from "@/components/input";
import { AtSign, Check, CircleX, Gem, LoaderCircle, Mail, RectangleEllipsis, Share, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/button";
import { Discord, Spotify } from "@/components/icons/Socials";
import { Alert, AlertDescription, AlertTitle } from "@/components/alert";

interface UserData {
    username: string;
    url: string;
    email: string;
}

export default function Account() {
    const [user, setUser] = useState<UserData>({
        username: "",
        url: "",
        email: "",
    });
    const [success, setSuccess] = useState<boolean>(false);
    const [message, setMessage] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        current: "",
        password: ""
    });
    const [key, setKey] = useState({key: ""})
    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/me');
            const data = await response.json();
            if (data.success) {
                setUser({
                    username: data.user.username || "",
                    url: data.user.url || "",
                    email: data.user.email || "",
                });
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setMessage("Failed to load user data");
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []); 

    const showMessage = (msg: string, isSuccess: boolean) => {
        setMessage(msg);
        setSuccess(isSuccess);
        setTimeout(() => setMessage(undefined), 3000);
    };

    const handleSaveChanges = async () => {
        try {
            setUpdating(true);
            const response = await fetch('/api/user/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: user.url,
                    username: user.username,
                }),
            });

            const data = await response.json();

            if (data.success) {
                showMessage("Profile updated successfully", true);
                await fetchUser();
            } else {
                showMessage(data.message || "Failed to update profile", false);
            }
        } catch (error) {
            console.error('Failed to update user:', error);
            showMessage("Failed to update profile", false);
        } finally {
            setUpdating(false);
        }
    };
        const handleRedeemPremium = async () => {
            if (!key.key) {
                showMessage("Please enter a valid key", false);
                return;
            }
        
            try {
                const response = await fetch('/api/redeem', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key: key.key,
                    }),
                });
        
                const data = await response.json();
        
                if (data.success) {
                    showMessage("Premium key redeemed successfully", true);
                    await fetchUser(); 
                } else {
                    showMessage(data.message || "Failed to redeem key", false);
                }
            } catch (error) {
                console.error('Failed to redeem premium key:', error);
                showMessage("Failed to redeem premium key", false);
            }
        };

    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.password) {
            showMessage("Please fill in both password fields", false);
            return;
        }

        try {
            setChangingPassword(true);
            const response = await fetch('/api/user/password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current: passwords.current,
                    password: passwords.password
                }),
            });

            const data = await response.json();

            if (data.success) {
                showMessage("Password updated successfully", true);
                setPasswords({ current: "", password: "" });
            } else {
                showMessage(data.message || "Failed to update password", false);
            }
        } catch (error) {
            console.error('Failed to update password:', error);
            showMessage("Failed to update password", false);
        } finally {
            setChangingPassword(false);
        }
        
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoaderCircle className="animate-spin duration-200 h-24 w-24" />
            </div>
        );
    }

    return (
        <>
            <main className="mx-auto p-4 md:p-8 max-w-screen-xl px-3.5 md:px-20 transition-all flex flex-col ease-in-out space-y-4">
                <h1 className="font-bold text-2xl">Account Settings</h1>
                <div className="flex flex-col space-y-1 w-full">
                    <h1 className="flex items-center font-bold text-lg">
                        <AtSign className="mr-1 text-pink-700" />
                       Url 
                    </h1>
                    <Input 
                        placeholder="Username" 
                        value={user.url} 
                        type="text" 
                        className="w-full md:w-96" 
                        onChange={(e) => setUser((prev) => ({ ...prev, url: e.target.value }))}
                    />
                </div>
                <div className="flex flex-col space-y-1 w-full">
                    <h1 className="flex items-center font-bold text-lg">
                        <User className="mr-1 text-pink-700" />
                        Username
                    </h1>
                    <Input 
                        placeholder="Username" 
                        value={user.username} 
                        type="text" 
                        className="w-full md:w-96" 
                        onChange={(e) => setUser((prev) => ({ ...prev, username: e.target.value }))}
                    />
                </div>
                <div className="flex flex-col space-y-1 w-full">
                    <h1 className="flex items-center font-bold text-lg">
                        <Mail className="mr-1 text-pink-700" />
                        Email
                    </h1>
                    <Input 
                        placeholder="Email"
                        value={user.email}
                        type="email" 
                        className="w-full md:w-96" 
                        readOnly
                    />
                </div>
                <Button 
    className="w-full md:w-48 flex items-center justify-center space-x-2"
    onClick={handleSaveChanges}
    disabled={updating}
>
    {updating ? (
        <>
            <LoaderCircle className="animate-spin duration-200 h-5 w-5" />
        </>
    ) : (
        'Save Changes'
    )}
</Button>
                <div className="flex flex-col space-y-1 w-full">
                    <h1 className="flex items-center font-bold text-lg">
                        <RectangleEllipsis className="mr-1 text-pink-700" />
                        Password
                    </h1>
                    <section className="flex flex-col space-y-2">
                        <Input 
                            placeholder="Current Password" 
                            type="password" 
                            className="w-full md:w-80" 
                            value={passwords.current}
                            onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        />
                        <Input 
                            placeholder="New Password" 
                            type="password" 
                            className="w-full md:w-80" 
                            value={passwords.password}
                            onChange={(e) => setPasswords(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <Button 
    className="h-11 w-full md:w-48 flex items-center justify-center space-x-2"
    onClick={handleChangePassword}
    disabled={changingPassword}
>
    {changingPassword ? (
        <>
            <LoaderCircle className="animate-spin duration-200 h-5 w-5" />
        </>
    ) : (
        'Change Password'
    )}
</Button> 
                    </section>
                </div>
                <div className="flex flex-col space-y-1 w-full">
                    <h1 className="flex items-center font-bold text-lg">
                        <Share className="mr-1 text-pink-700" />
                        Accounts
                    </h1>
                    <section className="flex flex-col md:flex-row gap-2">
                        <button disabled className="px-4 py-3 bg-blurple disabled:cursor-not-allowed disabled:bg-blurple/[80%] flex items-center justify-center space-x-3 transition-all duration-200 w-full md:w-36 h-12 rounded-lg shadow-md hover:bg-dark-blurple">
                            <Discord className="w-6 h-6" />
                            <span className="text-white font-semibold">Discord</span>
                        </button>
                        <button disabled className="px-4 py-3 bg-spotify disabled:cursor-not-allowed disabled:bg-spotify/[80%] flex items-center justify-center space-x-3 transition-all duration-200 w-full md:w-36 h-12 rounded-lg shadow-md hover:bg-dark-spotify">
                            <Spotify className="w-6 h-6" />
                            <span className="text-white font-semibold">Spotify</span>
                        </button>
                    </section>
                </div>
                <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-lg">
        <Gem className="mr-1 text-pink-700" />
        Redeem Premium
    </h1>
    <section className="flex flex-row space-x-2">
        <Input 
            placeholder="Enter your key" 
            className="w-80" 
            value={key.key}
            onChange={(e) => setKey({ key: e.target.value })}
        />
        <Button 
            className="h-11" 
            onClick={handleRedeemPremium} 
            disabled={updating}
        >
            {updating ? (
                <LoaderCircle className="animate-spin duration-200 h-5 w-5" />
            ) : (
                'Redeem'
            )}
        </Button>
    </section>
</div>
            </main>
            <AnimatePresence>
                {message && (
                    <motion.div
                        className="fixed bottom-8 left-0 right-0 flex justify-center items-center px-4 py-3 rounded-lg shadow-lg"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Alert 
                            className={`border-2 max-w-sm w-auto ${
                                success ? 'border-green-600 bg-green-700' : 'border-red-600 bg-red-700'
                            }`}
                        >
                            {success ? (
                                <Check className="h-4 w-4 text-green-200" />
                            ) : (
                                <CircleX className="h-4 w-4 text-red-200" />
                            )}
                            <AlertTitle>{success ? "Success" : "Error"}</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}