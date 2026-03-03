'use client';
import { UploadIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BackgroundProps {
    initialBackground: {
        url: string;
        type: 'video' | 'image';
    } | null;
}

export default function Background({ initialBackground }: BackgroundProps) {
    const [background, setBackground] = useState<{ url: string; type: 'video' | 'image' } | null>(initialBackground);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setBackground(initialBackground);
    }, [initialBackground]);

    const uploadBackground = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/user/add/background', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setBackground(data.background);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to upload background' }));
                setError(errorData.message || 'Failed to upload background');
            }
        } catch {
            setError('An error occurred during file upload');
        } finally {
            setLoading(false);
        }
    };

    const removeBackground = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/user/add/background', {
                method: 'DELETE',
            });

            if (response.ok) {
                setBackground(null);
            } else {
                setError('Failed to remove background');
            }
        } catch {
            setError('An error occurred while removing background');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex flex-col space-y-2">
                <p className="font-bold text-xl">Background</p>
                <div className={`relative grid h-[200px] w-[300px] place-content-center overflow-hidden rounded-lg border-2 ${error ? 'border-red-500' : 'border-zinc-900 hover:border-pink-700'} transition-colors delay-75 duration-200`}>
                    {background && background.url ? (
                        <>
                            {background.type === 'video' ? (
                                <video
                                    src={background.url}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <Image
                                    src={background.url}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    alt="Background"
                                    priority={true}
                                    loading="eager"
                                    fetchPriority="high"
                                    width={500}
                                    height={500}
                                />
                            )}
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    removeBackground();
                                }}
                                className="absolute top-2 right-2 text-pink-700 z-10 bg-zinc-950 p-1 rounded-lg border-2 border-zinc-900 transition-colors duration-200 hover:border-pink-700"
                                disabled={loading}
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <label className="flex items-center justify-center flex-col space-y-1.5 h-full w-full cursor-pointer">
                            <UploadIcon className={error ? 'text-red-500' : 'text-sm'} />
                            <p className={`text-sm ${error ? 'text-red-500' : ''}`}>
                                {error || 'Click to Upload'}
                            </p>
                            <input
                                type="file"
                                accept="image/*, video/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={uploadBackground}
                                disabled={loading}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}