'use client';
import { Music, UploadIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AudioProps {
    initialAudio: string | null;
}

export default function Audio({ initialAudio }: AudioProps) {
    const [audio, setAudio] = useState<string | null>(initialAudio);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAudio(initialAudio);
    }, [initialAudio]);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/user/add/music', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setAudio(data.musicURL);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to upload music' }));
                setError(errorData.message || 'Failed to upload music');
            }
        } catch {
            setError('An error occurred during file upload');
        } finally {
            setLoading(false);
        }
    };

    const removeAvatar = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/user/add/avatar', {
                method: 'DELETE',
            });

            if (response.ok) {
                setAudio(null);
            } else {
                setError('Failed to remove avatar');
            }
        } catch {
            setError('An error occurred while removing avatar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex flex-col space-y-2">
                <p className="font-bold text-xl">Music</p>
                <div className={`relative grid h-[200px] w-[300px] place-content-center overflow-hidden rounded-lg border-2 ${error ? 'border-red-500' : 'border-zinc-900 hover:border-pink-700'} transition-colors delay-75 duration-200`}>
                    {audio ? (
                        <>
                          <Music />
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    removeAvatar();
                                }}
                                className="absolute top-2 right-2 text-pink-700 z-10 bg-zinc-950 p-1 rounded-lg border-2 border-zinc-900 transition-colors duration-200 hover:border-pink-700"
                                disabled={loading}
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <label className="flex items-center justify-center flex-col space-y-1.5 h-full w-full cursor-pointer">
                            <UploadIcon className={error ? 'text-red-500' : ''} />
                            <p className={`text-sm ${error ? 'text-red-500' : ''}`}>
                                {error || 'Click to Upload'}
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={uploadAvatar}
                                disabled={loading}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}