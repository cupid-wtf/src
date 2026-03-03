import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; 
import UserModel from "@/lib/models/user"; 
import { z } from "zod";

const schema = z.object({
    token: z.string(),
});

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const response = schema.safeParse(body);
        
        if (!response.success) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Invalid input',
                    issues: response.error.issues,
                }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const { token } = response.data;

        const user = await UserModel.findOne({
            emailVerificationtoken: token,
            emailVerified: false
        }).select('emailVerificationtoken emailVerified');

        if (!user) {
            return new NextResponse(
                JSON.stringify({ 
                    error: 'Invalid or expired verification token',
                }),
                { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        user.emailVerified = true;
        user.emailVerificationtoken = null;
        await user.save();

        return new NextResponse(
            JSON.stringify({ 
                message: 'Email verified successfully',
                verified: true 
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        return new NextResponse(
            JSON.stringify({ 
                error: 'Something went wrong',
                details: error instanceof Error ? error.message : 'Unknown error'
            }), 
            { status: 500 }
        );
    }
}
