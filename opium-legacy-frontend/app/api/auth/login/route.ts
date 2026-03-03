import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserModel, { User } from "@/lib/models/user";
import { setSessionCookie, encrypt } from "@/lib/auth";
import bcryptjs from "bcryptjs";

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const { identifier, password, token } = body;

        if (!identifier || !password || !token) {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid input' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY!,
                response: token,
                remoteip: req.headers.get('x-forwarded-for') || ''
            })
        });
        const turnstileResult = await turnstileResponse.json();
        if (!turnstileResult.success) {
            return new NextResponse(
                JSON.stringify({ 
                    success: false, 
                    error: 'Captcha verification failed' 
                }),
                { 
                    status: 403,
                    headers: { 'Content-Type': 'application/json' } 
                }
            );
        }

        const user: User | null = await UserModel.findOne({ email: identifier });
        if (!user || !(await bcryptjs.compare(password, user.password))) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "Invalid email or password" }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!user.emailVerified) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "Please verify your email address before signing in" }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); 
        const session = await encrypt({ user: { id: user.id }, expires });
        setSessionCookie(session, expires);
        
        return new NextResponse(
            JSON.stringify({
                success: true,
                message: 'User signed in successfully',
                token: session
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new NextResponse('Something went wrong', { status: 500 });
    }
}
