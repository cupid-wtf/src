import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/user";
import { z } from "zod";

export async function GET() {
    const session = await getSession();
    await dbConnect();
    
    if (!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to access this endpoint" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    try {
        const findusr = await UserModel.findOne(
            { _id: session.id },
            { password: 0 }
        );
        
        if (!findusr) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "User not found" }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        return new NextResponse(
            JSON.stringify({ success: true, user: findusr }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "Something went wrong", error: error }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

const schema = z.object({
    url: z.string().min(1).max(60).optional(),
    username: z.string().min(0).max(60).optional(),
});

export async function PATCH(req: Request) {
    await dbConnect();
    const session = await getSession();

    if (!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to access this endpoint." }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const body = await req.json();
        const validation = schema.safeParse(body);

        if (!validation.success) {
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    message: "Invalid input data.",
                    errors: validation.error.errors,
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { url, username } = validation.data;
        const currentUser = await UserModel.findById(session.id).select("url username");

        if (!currentUser) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "User not found." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // URL check (keeping this logic as it was)
        if (url && url !== currentUser.url) {
            const normalizedUrl = url.toLowerCase(); 
            const existingUser = await UserModel.findOne({
                url: normalizedUrl,
                _id: { $ne: session.id },
            });

            if (existingUser) {
                return new NextResponse(
                    JSON.stringify({ success: false, message: "URL is already taken." }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        const updatedData: Record<string, unknown> = {};
        if (url) updatedData.url = url.toLowerCase(); 
        if (username) updatedData.username = username;  // No check for duplicate username

        const updatedUser = await UserModel.findByIdAndUpdate(
            session.id,
            { $set: updatedData },
            { new: true, select: "-password" }
        );

        if (!updatedUser) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "Failed to update user." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        return new NextResponse(
            JSON.stringify({
                success: true,
                message: "User updated successfully.",
                user: updatedUser,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return new NextResponse(
            JSON.stringify({ success: false, message: "An error occurred during the update." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
