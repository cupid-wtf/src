import mongoose, { Document, Schema } from 'mongoose';

export interface User extends Document {
  username: string;
  url: string;
  uid: number;
  admin: boolean;
  api_key: string;
  email: string;
  premium: boolean;
  blacklisted: {
    status: boolean;
    reason: string;
  };
  invite_creds: number;
  config: {
    box_color: string;
    width: number;
    bg_color: string;
    background_blur: number;
    border_color: string;
    border_width: number;
    border_style: string;
    text_color: string;
    avatar?: string | null;
    socials?: { 
      platform: string; 
      url: string; 
    }[];
    banner?: string | null;
    bio?: string | null;
    invites: number;
    font?: string;
    effects: {
      decoration: string;
      glow: boolean;
      tilt: boolean;
      pfp_decor: string;
      background_decor: string;
    };
    background?: { 
      url: string;
      type: string;
    };
    opacity: number;
    blur: number;
    presence: boolean;
    user_layout: 'Default' | 'Calico';
    autoplayfix: boolean; 
    audio?: {
      url: string;
      name: string;
      cover: string;
    } | null;
    autoplaymessage: string;
    user_badges: {
      _id: string;
      name: string;
      enabled: boolean;
    }[];
    custom_badges: {
      _id: string;
      name: string;
      icon: string;
      enabled: boolean;
    }[];
  };
  discord: {
    id: string | null;
    invite: string | null;
    url: string | null;
    enabled: boolean;
  };
  views: {
    date: string;
    views: number;
  }[];
  password: string;
  verified: boolean;
  emailVerified: boolean;
  emailVerificationtoken: string | null;
  passwordResetToken: string | null;
  raw_storage: string | null; 
  sessionid: string | null; 
  lastautowipe_date: Date | null;
  registrationDate: Date;
  lastLoginDate: Date | null; 
  host: {
    key: string;
    domain: string;
  };
  ips: string[];
}

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, lowercase: true },
    url: { type: String, required: true, lowercase: true },
    uid: { type: Number },
    api_key: { type: String, default: "" },
    premium: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
    email: { type: String, required: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationtoken: { type: String },
    passwordResetToken: { type: String },
    registrationDate: { type: Date, default: Date.now },
    invite_creds: {type: Number, default: 0 },
    lastLoginDate: { type: Date, default: null },
    blacklisted: {
      status: { type: Boolean, default: false },
      reason: { type: String, default: '' },
    },
    config: {
      box_color: { type: String, default: '#000000' },
      width: { type: Number, default: 600 },
      bg_color: { type: String, default: '#000000' },
      text_color: { type: String, default: '#ffffff' },
      background_blur: { type: Number, default: 0 },
      blur: { type: Number, default: 0 },
      border_color: { type: String, default: '#000000' },
      border_width: { type: Number, default: 0 },
      border_style: { type: String, default: 'solid' },
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
        decoration: { type: String, default: '' },
        glow: { type: Boolean, default: false },
        pfp_decor: { type: String, default: '' },
        background_decor: { type: String, default: '' },
        tilt: { type: Boolean, default: false },
      },
      autoplayfix: { type: Boolean, default: false },
      autoplaymessage: { type: String, default: '' },
      audio: { 
          url: { type: String, default: null },
          name: { type: String, default: null },
          cover: { type: String, default: null },
      },
      background: { 
        url: { type: String, default: null },
        type: { type: String, default: null },
      },
      opacity: { type: Number, default: 0.25 },
      presence: { type: Boolean, default: false },
      user_layout: { 
        type: String, 
        default: 'Default' 
      },
      user_badges: [
        {
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
    host: {
        domain: { type: String, default: "opium.bio" },
        key: { type: String },
      },
    discord: {
      id: { type: String, default: null },
      invite: { type: String, default: null },
      url: { type: String, default: null },
      enabled: { type: Boolean, default: false },
    },
    views: [{
      date: { type: Date, default: null },
      views: { type: String, default: null}
    }],
    sessionid: { type: String, default: null },
    raw_storage: { type: String, default: null }, 
    ips: [{ type: String }],
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model<User>('User', userSchema);

export default UserModel;
