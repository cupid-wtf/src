/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/Acordian";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import { Button, LinkButton } from "@/components/button";
import { Input } from "@/components/input";
import Avatar from "@/components/UploadAvatar";
import Background from "@/components/UploadBg";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AlignCenter, Blend, BookText, Box, BoxIcon, BringToFront, Brush, Check, CircleX, Droplet, FolderOpen, Frame, Gem, Layout, LetterText, LoaderCircle, MagnetIcon, Monitor, Mouse, MousePointer, MousePointer2, Music, Palette, Play, PlayCircle, SaveAll, Sparkles, Star, TextCursor, Type, User, Wrench } from "lucide-react";
import Banner from "@/components/Uploadbanner";
import { Switch } from "@/components/Switch";

interface UserData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    url: string;
    avatar: string | null;
    banner: string | null;
    background: {
        url: string;
        type: 'video' | 'image';
    } | null;
  effects: {
    glow: boolean;
    tilt: boolean;
    pfp_dec: string;
    background_dec: string
  };
    bg_color: string;
    background_blur: number;
    border_width: number;
    box_color: string;
    border_color: string;
    text_color: string;
    bio: string;
    width: number
    layout: string;
    opacity: number;
    blur: number;
    font: string;
    autoplaymessage: string;
    autoplayfix: boolean;
}

export default function Profile() {
    const [success, setSuccess] = useState<boolean>(false);
    const [message, setMessage] = useState<string>();
    const [user, setuser] = useState<UserData>({
      url: '',
      avatar: '',
      background: null,
      background_blur: 0,
      bio: '',
      layout: 'Default',
      opacity: 1,
      blur: 1,
      font: 'Sora',
      autoplaymessage: '',
      banner: '',
      width: 400,
      bg_color: '#000000',
      box_color: '#000000',
      text_color: '#ffffff',
      border_color: '#000000',
      border_width: 0,
      autoplayfix: false,
      effects: {
        glow: false,
        tilt: false,
        pfp_dec: '',
        background_dec: '',
      },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/user/me');
                const data = await response.json();
                setuser({
                  url: data.user.url || '',
                  avatar: data.user.avatar || '',
                  background: data.user.background || null,
                  bio: data.user.bio || '',
                  layout: data.user.user_layout || 'Default',
                  opacity: data.user.opacity ?? 1,
                  blur: data.user.blur ?? 1,
                  font: data.user.font || 'Sora',
                  autoplaymessage: data.user.autoplaymessage || '',
                  banner: data.user.banner || '',
                  autoplayfix: data.user.autoplayfix || false,
                  width: data.user.width ?? 400,
                  bg_color: data.user.bg_color || '#000000',
                  background_blur: data.user.background.blur || 0,
                  box_color: data.user.box_color || '#000000',
                  text_color: data.user.text_color || '#ffffff',
                  border_color: data.user.border_color || '#000000',
                  border_width: data.user.border_width || 0,
                  effects: {
                    glow: data.user.effects?.glow || false,
                    tilt: data.user.effects?.tilt || false,
                    pfp_dec: data.user.effects?.pfp_dec || '',
                    background_dec: data.user.effects?.background_dec || '',
                  },                  
                });
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSaveChanges = async () => {
        try {
            const response = await fetch('/api/user/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bio: user.bio,
                    layout: user.layout,
                    opacity: user.opacity,
                    blur: user.blur,
                    font: user.font,
                    autoplaymessage: user.autoplaymessage,  
                    width: user.width,
                    bg_color: user.bg_color,
                    box_color: user.box_color,
                    text_color: user.text_color,
                    border_color: user.border_color,
                    border_width: user.border_width,
                    autoplayfix: user.autoplayfix,
                    background_blur: user.background_blur,
                  effects: {
                    glow: user.effects?.glow,
                    tilt: user.effects?.tilt,
                    pfp_dec: user.effects?.pfp_dec,
                    background_dec: user.effects?.background_dec,
                  },                  
                }),
            });
            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.message || 'Failed to save changes');  
            }
            const data = await response.json();
            setSuccess(true);
            setMessage(data.message);
            setTimeout(() => {
                setMessage('');
            }, 5000);
        } catch (error: any) {
            setSuccess(false);
            setMessage(error.message);
            setTimeout(() => {
                setMessage('');
            }, 5000);
        }
};   
    if (loading) {
        return <div className="min-h-screen  flex items-center justify-center">
            <LoaderCircle className="animate-spin duration-200 h-24 w-24" />
        </div>; 
    }

    return (
        <>
        <main className="p-4 md:p-8 flex flex-col space-y-4 max-w-full">
            <section className="flex flex-col items-start space-y-4 w-full">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="assets">
                        <AccordionTrigger>
                            <h1 className="flex items-center font-bold text-xl md:text-2xl">
                                <FolderOpen className="mr-2" />
                                Assets
                            </h1>
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-wrap flex-col md:flex-row gap-4">
                            <Avatar 
                                initialAvatar={user.avatar} 
                            />
                            <Background 
                                initialBackground={user.background}
                            />
                            <Banner initialbanner={user.banner} />
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex flex-col space-y-2">
                <p className="font-bold text-xl">Music</p>
                <div className="relative grid h-[200px] w-[300px] place-content-center overflow-hidden rounded-lg border-2 border-zinc-900 hover:border-pink-700 transition-colors delay-75 duration-200">
                        <label className="flex items-center justify-center flex-col space-y-1.5 h-full w-full">
                          <Gem />
                          <h1 className="text-nowrap text-xs">Upgrade to Premium to unlock this feature.</h1>
                  </label>
            </div>
            </div>
        </div>
                        </AccordionContent>
                    </AccordionItem>
                    </Accordion>
                    <Accordion type="single" collapsible className="w-full">
  <AccordionItem value="general">
    <AccordionTrigger>
      <h1 className="flex items-center font-bold text-xl md:text-2xl">
        <Wrench className="mr-2" />
        General
      </h1>
    </AccordionTrigger>
    <AccordionContent className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-2">
    <div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <Type className="mr-1 text-pink-700" />
    Description
  </h1>
  <Input
    className="w-full"
    value={user.bio}
    onChange={(e) => setuser((prev) => ({ ...prev, bio: e.target.value }))}
  />
</div>
<div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <Layout className="mr-1 text-pink-700" />
    Layout
  </h1>
  <select
    className="bg-transparent border-zinc-900 border text-white px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-pink-600"
    value={user.layout}
    disabled
    onChange={(e) => setuser((prev) => ({ ...prev, layout: e.target.value }))}
  >
    <option className="bg-background" value="Default">
      Default
    </option>
    <option className="bg-background" value="Calico">
      Calico
    </option>
  </select>
</div>
<div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <LetterText className="mr-1 text-pink-700" />
    Font
  </h1>
  <select
    className="bg-transparent border-zinc-900 border text-white px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-pink-600"
    value={user.font}
    onChange={(e) => setuser((prev) => ({ ...prev, font: e.target.value }))}
  >
    <option className="bg-background" value="Sora">
      Sora
    </option>
    <option className="bg-background" value="Chillax">
      Chillax
    </option>
  </select>
</div>
<div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <PlayCircle className="mr-1 text-pink-700" />
    Autoplay Message
  </h1>
  <Input
    className="w-full"
    value={user.autoplaymessage}
    onChange={(e) => setuser((prev) => ({ ...prev, autoplaymessage: e.target.value }))}
  />
</div>
<div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <Sparkles className="mr-1 text-pink-700" />
    Decoration
  </h1>
  <select
    className="bg-transparent border-zinc-900 border text-white px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-pink-600"
    disabled
  >
    <option className="bg-background" value="Sora">
      None
    </option>
  </select>
</div>
<div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <Blend className="mr-1 text-pink-700" />
    Opacity
  </h1>
  <div className="flex w-full">
    <input 
      type="range"
      min="0"
      max="1"
      step="0.1"
      className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-2 py-2.5 rounded-l-lg w-full duration-200 ease-in-out"
      value={user.opacity}
      onChange={(e) => setuser((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))}
    />
    <p className="h-10 bg-transparent bg-zinc-900 border-zinc-900 border-2 w-8 p-4 text-center flex items-center justify-center rounded-r-lg select-none">
      {user.opacity}
    </p>
  </div>
</div>
<div className="flex flex-col space-y-1 w-full">
  <h1 className="flex items-center font-bold text-sm">
    <Droplet className="mr-1 text-pink-700" />
    Blur
  </h1>
  <div className="flex w-full">
    <input 
      type="range"
      min="0"
      max="100"
      className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-2 py-2.5 rounded-l-lg w-full duration-200 ease-in-out"
      step="1" 
      value={user.blur} 
      onChange={(e) => setuser((prev) => ({ ...prev, blur: parseFloat(e.target.value) }))}
    />
    <p className="h-10 bg-transparent bg-zinc-900 border-zinc-900 border-2 w-8 p-4 text-center flex items-center justify-center rounded-r-lg select-none">
      {user.blur}
    </p>
  </div>
</div>

                 </AccordionContent>
                </AccordionItem>
                </Accordion>
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="general">
    <AccordionTrigger>
      <h1 className="flex items-center font-bold text-xl md:text-2xl">
        <Palette className="mr-2" />
       Customization 
      </h1>
    </AccordionTrigger>
    <AccordionContent className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-2">
      <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <Box className="mr-1 text-pink-700" />
      Width
    </h1>
    <div className="flex w-full">
      <input 
        type="range"
        min="400"
        max="1500"
        step="1"
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-2 py-2.5 rounded-l-lg w-full duration-200 ease-in-out"
        value={user.width}
        onChange={(e) => setuser((prev) => ({ ...prev, width: parseFloat(e.target.value) }))}
      />
      <p className="h-10 bg-transparent bg-zinc-900 border-zinc-900 border-2 w-8 p-4 text-center flex items-center justify-center rounded-r-lg select-none">
        {user.width}
      </p>
    </div>
  </div>
  <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <Droplet className="mr-1 text-pink-700" />
      Background Blur
    </h1>
    <div className="flex w-full">
      <input  
        type="range"
        min="0"
        max="100"
        step="1"
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-2 py-2.5 rounded-l-lg w-full duration-200 ease-in-out"
        value={user.background_blur}
        onChange={(e) => setuser({ ...user, background_blur: Number(e.target.value) })}
      />
      <p className="h-10 bg-transparent bg-zinc-900 border-zinc-900 border-2 w-8 p-4 text-center flex items-center justify-center rounded-r-lg select-none">
        {user.background_blur}
      </p>
    </div>
  </div>
  <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <Box className="mr-1 text-pink-700" />
      Border Width
    </h1>
    <div className="flex w-full">
      <input 
        type="range"
        min="0"
        max="5"
        step="1"
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-2 py-2.5 rounded-l-lg w-full duration-200 ease-in-out"
        value={user.border_width}
        onChange={(e) => setuser({ ...user, border_width: Number(e.target.value) })}
      />
      <p className="h-10 bg-transparent bg-zinc-900 border-zinc-900 border-2 w-8 p-4 text-center flex items-center justify-center rounded-r-lg select-none">
        {user.border_width}
      </p>
    </div>
  </div>
  <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <Monitor className="mr-1 text-pink-700" />
      Background Color
    </h1>
    <div className="flex w-full">
      <input 
        type="color"
        value={user.bg_color}
        onChange={(e) => setuser((prev) => ({ ...prev, bg_color: e.target.value }))}
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-1.5 h-10 rounded-lg w-full duration-200 ease-in-out"
      />
    </div>
  </div>
  <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <BoxIcon className="mr-1 text-pink-700" />
      Box Color
    </h1>
    <div className="flex w-full">
      <input 
        type="color"
        value={user.box_color}
        onChange={(e) => setuser((prev) => ({ ...prev, box_color: e.target.value }))}
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-1.5 h-10 rounded-lg w-full duration-200 ease-in-out"
      />
    </div>
  </div>
  <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <Brush className="mr-1 text-pink-700" />
      Text Color
    </h1>
    <div className="flex w-full">
      <input 
        type="color"
        value={user.text_color}
        onChange={(e) => setuser((prev) => ({ ...prev, text_color: e.target.value }))}
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-1.5 h-10 rounded-lg w-full duration-200 ease-in-out"
      />
    </div>
  </div>
  <div className="flex flex-col space-y-1 w-full">
    <h1 className="flex items-center font-bold text-sm">
      <BringToFront className="mr-1 text-pink-700" />
      Border Color
    </h1>
    <div className="flex w-full">
      <input 
        type="color"
        value={user.border_color}
        onChange={(e) => setuser((prev) => ({ ...prev, border_color: e.target.value }))}
        className="bg-transparent border-zinc-900 border-2 accent-pink-700 px-1.5 h-10 rounded-lg w-full duration-200 ease-in-out"
      />
    </div>
</div>
                 </AccordionContent>
                </AccordionItem>
                </Accordion>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="general">
                        <AccordionTrigger>
                            <h1 className="flex items-center font-bold text-xl md:text-2xl">
                                <Star className="mr-2" />
                                Effects 
                            </h1>
                        </AccordionTrigger>
    <AccordionContent className="flex flex-col md:flex-row gap-1 md:gap-10">
                          <div className="flex flex-col space-y-1">
                           <h1 className="flex items-center font-bold text-sm">
                           <MousePointer2 className="mr-1 text-pink-700" />
                         Tilt 
                         </h1>
                           <div className="flex">
                           <Switch 
                           disabled
                          checked={user.effects.tilt}
                           onCheckedChange={(checked) =>
                              setuser((prev) => ({
                                ...prev,
                                effects: {
                                  ...prev.effects,
                                  tilt: checked,
                                },
                              }))
                               }                 
                            />
                              </div>
                                </div>
                          <div className="flex flex-col space-y-1">
                           <h1 className="flex items-center font-bold text-sm">
                      <Box className="mr-1 text-pink-700" />
                          Glow
                         </h1>
                           <div className="flex w-full">
                           <Switch 
                          checked={user.effects.glow}
                           onCheckedChange={(checked) =>
                              setuser((prev) => ({
                                ...prev,
                                effects: {
                                  ...prev.effects,
                                  glow: checked,
                                },
                              }))
                               }                 
                            />
                              </div>
                                </div>
                          <div className="flex flex-col space-y-1">
                           <h1 className="flex items-center font-bold text-sm">
                      <Play className="mr-1 text-pink-700" />
                          Autoplay Fix
                         </h1>
                           <div className="flex w-full">
                           <Switch 
                          checked={user.autoplayfix}
                           onCheckedChange={(checked) =>
                              setuser((prev) => ({
                                ...prev,
                                autoplayfix: checked
                              }))
                               }                 
                            />
                              </div>
                                </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div className="space-y-4 md:space-x-4 w-full">
                <Button className="w-full md:w-48" onClick={handleSaveChanges}>
                    <SaveAll className="mr-2" /> Save Changes
                </Button>
                <LinkButton href={`/${user.url}`} target='_blank' className="w-full md:w-48 border-2 border-zinc-900 hover:border-white hover:bg-white hover:text-black">
                    <User className="mr-2" /> My Profile
                </LinkButton>
                </div>
            </section>
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