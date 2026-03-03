import mongoose, { Document, Schema } from 'mongoose';

export interface User extends Document {
  username: string;
  url: string;
  uid: number;
  alias?: string | null;
  email: string;
  premium: boolean;
  box_color: string;
  width: number;
  bg_color: string;
  background_blur: number;
  border_color: string;
  border_width: number;
  border_style: string;
  text_color: string;
  admin: boolean;
  avatar?: string | null;
  socials?: { 
    platform: string; 
    url: string; 
  }[];
  banner?: string | null;
  bio?: string | null;
  font?: string;
  effects: {
    decoration: string;
    glow: boolean;
    tilt: boolean;
    pfp_dec: string;
    background_dec: string
  };
  autoplayfix: boolean; 
  audio?: {
    url: string;
    name: string;
    cover: string;
  }
  autoplaymessage: string;
  discord?: {
    id: string;
    invite: string;
    url: string;
  };
  background?: { 
    url: string;
    type: string;
  };
  opacity: number;
  blur: number;
  user_layout: 'Default' | 'Calico';
  password: string;
  verified: boolean;
  emailVerified: boolean;
  emailVerificationtoken: string;
  createdAt: Date;
  user_badges: {
    name: string;
    enabled: boolean;
  }[];
  custom_badges: {
    name: string;
    icon: string;
    enabled: boolean;
  }[];
}

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, lowercase: true },
    url: { type: String, required: true, lowercase: true },
    uid: { type: Number, default: 1 },
    premium: { type: Boolean, default: false },
    email: { type: String, required: true },
    box_color: { type: String, default: '#000000' },
    background_blur: { type: Number, default: 0 },
    border_color: { type: String, default: '#000000' },
    border_width: { type: Number, default: 0 },
    border_style: { type: String, default: 'solid' },
    bg_color: { type: String, default: '#000000' },
    text_color: { type: String, default: '#ffffff' },
    admin: { type: Boolean, default: false },
    avatar: { type: String, default: null },
    socials: [
      {
        platform: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    banner: { type: String, default: null },
    bio: { type: String, default: null },
    font: { type: String, default: 'Sora' },
    effects: { 
      type: {
        glow: { type: Boolean, default: false },
        pfp_dec: { type: String, default: '' },
        background_dec: { type: String, default: '' },
        tilt: { type: Boolean, default: false },
      },
      default: () => ({ glow: false, decoration: '' })
    },
    autoplayfix: { type: Boolean, default: false },
    autoplaymessage: { type: String, default: '' },
    discord: {
      id: { type: String, default: null },
      invite: { type: String, default: null },
      url: { type: String, default: null },
    },
    background: { 
      url: { type: String, default: null }, 
      type: { type: String, default: null }, 
    },
    opacity: { type: Number, default: 0.25 },
    width: { type: Number, required: true, default: 600 },
    blur: { type: Number, default: 20 },
    user_layout: { 
      type: String, 
      enum: ['Default', 'Calico'], 
      default: 'Default' 
    },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationtoken: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    user_badges: [
      {
        _id: false,
        name: { type: String, required: true },
        enabled: { type: Boolean, default: false },
      },
    ],
    custom_badges: [
      {
        name: { type: String, required: true },
        icon: { type: String, default: '' },
        enabled: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model<User>('User', userSchema);

export default UserModel;