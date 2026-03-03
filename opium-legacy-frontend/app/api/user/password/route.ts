import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/user";
import bcryptjs from "bcryptjs";

const schema = z.object({
    current: z.string().min(6, { message: "Current password must be at least 6 characters long" }).max(255, { message: "Current password is too long" }),
    password: z.string().min(6, { message: "New password must be at least 6 characters long" }).max(255, { message: "New password is too long" }),
});

export async function PATCH(req: Request) {
    const session = await getSession();
    await dbConnect();

    if (!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to update your password." }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const body = await req.json();
        const validationResult = schema.safeParse(body);

        if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(err => err.message);
            return new NextResponse(
                JSON.stringify({ success: false, message: "Validation failed", errors: errorMessages }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const user = await UserModel.findById(session.id);

        if (!user) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "User not found." }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const isPasswordValid = await bcryptjs.compare(body.current, user.password);
        if (!isPasswordValid) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "The current password you entered is incorrect." }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const hashedPassword = await bcryptjs.hash(body.password, 10);
        user.password = hashedPassword;
        await user.save();

        return new NextResponse(
            JSON.stringify({ success: true, message: "Password updated successfully!" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Error while updating password:", error);
        return new NextResponse(
            JSON.stringify({ success: false, message: "An unexpected error occurred. Please try again later." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
