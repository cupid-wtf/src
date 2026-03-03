import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/user";
import KeyModel from "@/lib/models/keys";

const schema = z.object({
    key: z.string(),
});

export async function PATCH(req: Request) {
    const session = await getSession();
    await dbConnect();

    if (!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to redeem a key." }),
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

        const isKeyValid = await KeyModel.findOne({ key: body.key });

        if (!isKeyValid) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "The code you entered is incorrect or already redeemed." }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        await KeyModel.deleteOne({ key: body.key });
        user.premium = true; 
        await user.save();

        const premiumBadge = user.user_badges.find((badge: { name: string; }) => badge.name === "Premium");

        if (!premiumBadge) {
            user.user_badges.push({
                name: "Premium", enabled: true });
            await user.save();
        }

        return new NextResponse(
            JSON.stringify({ success: true, message: "Key redeemed successfully. You have received the premium badge!" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Error while redeeming key:", error);
        return new NextResponse(
            JSON.stringify({ success: false, message: "An unexpected error occurred. Please try again later." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
