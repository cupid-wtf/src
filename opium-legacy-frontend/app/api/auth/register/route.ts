import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import dbConnect from "@/lib/db";
import { z } from "zod";
import crypto from 'crypto';
import UserModel from "@/lib/models/user";
import { sendEmail } from "@/lib/mailgun";

const schema = z.object({
    username: z.string()
        .min(1)
        .max(60)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .transform((username) => username.toLowerCase()), // Transform to lowercase
    url: z.string()
        .min(1)
        .max(60)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .transform((url) => url.toLowerCase()), // Transform to lowercase
    email: z.string().email(),
    password: z.string().min(1).max(255),
    token: z.string(),
});


const nextUid = async () => {
    const lastUser = await UserModel.findOne({}, { uid: 1 }).sort({ uid: -1 });
    return lastUser ? lastUser.uid + 1 : 0;
};

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const response = schema.safeParse(body);

        if (!response.success) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid input", issues: response.error.issues }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { email, url, username, password } = response.data;
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) {
            return new NextResponse(
                JSON.stringify({ error: "Email is already registered" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const existingUrl = await UserModel.findOne({ url });
        if (existingUrl) {
            return new NextResponse(
                JSON.stringify({ error: "URL is already in use" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY!,
                response: response.data.token,
                remoteip: req.headers.get('x-forwarded-for') || ''
            })
        });

        const turnstileResult = await turnstileResponse.json();

        if (!turnstileResult.success) {
            return new NextResponse(
                JSON.stringify({ success: false, error: 'Captcha verification failed' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const salt = await bcryptjs.genSalt(15);
        const hashedPassword = await bcryptjs.hash(password, salt);
        const hash = crypto.randomBytes(32).toString('hex');
        const uid = await nextUid();

        await UserModel.create({
            username: username.toLowerCase(),
            url: url.toLowerCase(),
            email: email,
            password: hashedPassword,
            emailVerificationtoken: hash,
            uid: uid,
        });

        const verifyurl = `https://opium.bio/verify/${hash}`;
        await sendEmail({
            to: email,
            subject: "Please Verify Your Email Address",
            text: `Hello ${username.toLowerCase()},\n\nThank you for registering with opium.bio. Please verify your email address to complete your registration.`,
            html: `<div style="font-family: Arial, sans-serif; color: #ededed; max-width: 600px; margin: auto; background-color: #000000; padding: 12px; border: 2px solid #db2777; border-radius: 10px;">
                <h2 style="color: #ededed;">Welcome to opium.bio, ${username.toLowerCase()}!</h2>
                <p>Thank you for registering with <a href="https://opium.bio" style="color: #db2777; text-decoration: none;">opium.bio</a>. Please verify your email address to complete your registration.</p>
                <p>Simply click the button below to get started:</p>
                <a href=${verifyurl} style="display: inline-block; background-color: #be185d; color: #fff; padding: 12px 24px; border-radius: 5px; border: 2px solid #db2777; text-decoration: none; font-weight: bold; font-size: 16px; margin: 10px 0;">
                    Verify Your Email
                </a>
                <p style="font-size: 14px; color: #71717a;">If you didn’t sign up for this account, you can safely ignore this email.</p>
            </div>`,
        });

        return new NextResponse(
            JSON.stringify({ success: true, message: "User registered successfully", uid: uid }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch {
        return new NextResponse("Something went wrong", { status: 500 });
    }
}
