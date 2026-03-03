/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as i from "./icons/icons";
import * as customs from "./icons/CustomBadge"
import './Profile.css';
import ToolTip from './Toolip';

interface UserBadge {
  name: string;
  enabled: boolean;
}

interface CustomBadge {
  name: string;
  enabled: boolean;
}

interface User {
  username: string;
  uid: number;
  box_color: string;
  bg_color: string;
  background_blur: number;
  border_color: string;
  border_style: string;
  text_color: string;
  avatar?: string | null;
  socials?: {
    platform: string;
    url: string;
  }[];
  banner?: string | null;
  bio?: string | null;
  font?: string;
  effects: {
    glow: boolean;
  };
  autoplayfix: boolean;
  autoplaymessage: string;
  discord?: {
    id: string;
    url: string;
  };
  background?: {
    url: string;
    type: string;
  };
  opacity: number;
  blur: number;
  width: number;
  border_width: number;
  user_layout: 'Default' | 'Calico';
  verified: boolean;
  user_badges?: UserBadge[];
  custom_badges?: CustomBadge[];
}

const badgeIconMap = {
  'Server Booster': i.ServerBooster,
  'Bug Hunter': i.BugHunter,
  'Developer': i.Developer,
  'Verified': i.Verified,
  'Calamity': i.Calamity,
  'Premium': i.Premium,
  'Owner': i.Owner
};

const custombadgeIconMap = {
  'Cart': customs.Nxyy_Cart
};

export default function UserProfileClient({ user }: { user: User }) {
  const [isProfileVisible, setIsProfileVisible] = useState(!user.autoplayfix);
  const videoRef = useRef<HTMLVideoElement>(null);

  const convertHexToRgba = (hex: string, opacity: number) => {
    const hexWithoutHash = hex.replace('#', '');
    const bigint = parseInt(hexWithoutHash, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const bgColorWithOpacity = convertHexToRgba(user?.box_color, user?.opacity);
  const activeBadges = [
    ...(user.user_badges
      ?.filter(badge => badge.enabled && badgeIconMap[badge.name as keyof typeof badgeIconMap])
      .map(badge => ({
        name: badge.name,
        Icon: badgeIconMap[badge.name as keyof typeof badgeIconMap],
      })) || []),
    ...(user.custom_badges
      ?.filter(badge => badge.enabled && custombadgeIconMap[badge.name as keyof typeof custombadgeIconMap])
      .map(badge => ({
        name: badge.name,
        Icon: custombadgeIconMap[badge.name as keyof typeof custombadgeIconMap],
      })) || []),
  ];
  

  useEffect(() => {
    if (videoRef.current) {
      if (isProfileVisible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isProfileVisible]);

  return (
    <main
      style={{
        backgroundColor: user.background?.url ? '#09090b' : user.bg_color,
        fontFamily: user.font,
      }}
      className="min-h-screen mx-auto px-4 sm:px-6 flex flex-col items-center justify-center w-full relative overflow-hidden"
    >
      <>
        {user.background && user.background.type === 'image' && (
          <div
            className="absolute inset-0 z-[80] bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${user.background.url})`,
              filter: `blur(${user.blur}px)`,
              transform: 'scale(1.025)',
              width: '100%',
              height: '100%',
            }}
          ></div>
        )}
        
        {user.autoplayfix && !isProfileVisible && (
          <div
            onClick={() => setIsProfileVisible(true)}
            className="absolute z-[9999] bg-black/50 font-bold text-xl md:text-2xl flex justify-center items-center cursor-pointer h-full w-full"
            style={{
              backdropFilter: `blur(${user.blur}px)`,
            }}
          >
            {user.autoplaymessage}
          </div>
        )}

        {user.background && user.background.type === 'video' && (
          <video
            ref={videoRef}
            src={user.background.url}
            style={{
              filter: `blur(${user.background_blur}px)`,
            }}
            autoPlay={isProfileVisible} // Video autoplay based on profile visibility
            playsInline
            draggable
            loop
            muted
            disablePictureInPicture
            controlsList="nofullscreen"
            className="absolute object-cover h-full w-full"
          />
        )}

        {isProfileVisible && (
          <motion.div
          style={{
            backgroundColor: bgColorWithOpacity,
            backdropFilter: `blur(${user.blur}px)`,
            color: user.text_color,
            width: '100%',
            border: `${user.border_color}`,
            borderWidth: `${user.border_width}`,
            borderStyle: `solid`,
            maxWidth: `${user.width}px`,
            fontFamily: user.font,
          }}
          className="z-[500] rounded-3xl flex flex-col items-center"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 50 }}
          >
            {user.banner && (
              <div 
              style={{
                borderBottom: `${user.border_color} ${user.border_width}px ${user.border_style}`,
              }}
              className="w-full h-[110px] rounded-t-3xl object-cover overflow-hidden">
                <img
                  src={user.banner}
                  alt=""
                  className="inset-0 h-full w-full object-cover"
                />
              </div>
            )}

            <div className="p-6 rounded-3xl items-center justify-center flex flex-col w-full">
              {user.avatar && (
                <div
                style={{
                border: `${user.border_color} ${user.border_width}px ${user.border_style}`,
                }}
                  className={`relative grid h-[80px] w-[80px] rounded-full overflow-hidden ${user.banner ? '-mt-12' : ''}`}
                >
                  <img
                    src={user.avatar}
                    alt=""
                    className="rounded-full inset-0 h-full w-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
              )}
              <div className="w-full items-center justify-center flex flex-col">
                <ToolTip tooltip={`UID: ${user.uid}`}>
                <h1
                  style={{
                    textShadow: user.effects?.glow
                      ? `0 0 5px ${user.text_color}, 0 0 16.5px ${user.text_color}, 0 0 0px ${user.text_color}`
                      : 'none',
                  }}
                  className="text-2xl font-semibold text-center break-words select-none"
                >
                  {user.username}
                </h1>
              </ToolTip>
              {activeBadges && activeBadges.length > 0 && (
  <div className="flex justify-center space-x-1 flex-wrap">
    {activeBadges.map(({ name, Icon }, index) => (
      <ToolTip key={index} tooltip={name}>
        <div className="flex flex-col">
          <Icon
            height={17}
            width={17}
            style={{
              filter: user.effects?.glow
                ? `0 0 5px ${user.text_color}, 0 0 16.5px ${user.text_color}, 0 0 0px ${user.text_color}`
                : 'none',
              fill: user.text_color,
            }}
          />
        </div>
      </ToolTip>
    ))}
  </div>
)}
              </div>
              <p
                style={{
                  textShadow: user.effects?.glow
                      ? `0 0 2px ${user.text_color}, 0 0 10px ${user.text_color}, 0 0 10px ${user.text_color}`
                    : 'none',
                }}
                className="mt-3 text-lg font-bold break-words text-center whitespace-pre-wrap w-full"
              >
                {user.bio}
              </p>
            </div>
          </motion.div>
        )}
      </>
    </main>
  );
}
