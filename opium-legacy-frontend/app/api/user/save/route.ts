import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/user";
import { ZodError } from "zod";

const userProfileSchema = z.object({
    bio: z.string().min(0, "Bio is required").max(250, "Bio cannot exceed 250 characters").optional(),
    autoplaymessage: z.string().min(0, "Autoplay Message is required").max(100, "Message cannot exceed 100 characters").optional(),
    layout: z.enum(['Default', 'Calico'], { 
        errorMap: () => ({ message: "Invalid layout selection" }) 
    }),
    font: z.enum(['Sora', 'Chillax'], { 
        errorMap: () => ({ message: "Invalid font selection" }) 
    }),
    bg_color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid background color"),
    box_color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid box color"),
    text_color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid text color"),
    border_color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid border color"),
    border_width: z.number().min(0).max(10, "Border width must be between 0 and 10"),
    background_blur: z.number().min(0).max(100, "Background Blur width must be between 0 and 100"),
    autoplayfix: z.boolean(),
    opacity: z.number().min(0).max(1, "Opacity must be between 0 and 1"),
    blur: z.number().min(0).max(100, "Blur must be between 0 and 100"),
    width: z.number().min(400).max(1500, "Width must be between 400 and 1500"),
    effects: z.object({
        glow: z.boolean(),
        tilt: z.boolean(),
        pfp_dec: z.string(),
        background_dec: z.string()
    })
});

function createErrorResponse(message: string, status: number = 400) {
    return new NextResponse(
        JSON.stringify({ 
            success: false, 
            message,
            errors: status === 400 ? userProfileSchema.safeParse({}).error?.errors : undefined
        }),
        { 
            status, 
            headers: { 'Content-Type': 'application/json' } 
        }
    );
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return createErrorResponse("You must be signed in to access this endpoint", 401);
        }

        await dbConnect();

        const body = await req.json();

        const validationResult = userProfileSchema.safeParse(body);
        if (!validationResult.success) {
            const errors = validationResult.error.errors.map(err => err.message);
            return createErrorResponse(`${errors.join(', ')}`, 400);
        }

        const user = await UserModel.findById(session.id);
        if (!user) {
            return createErrorResponse("User not found", 404);
        }

        const updateFields = {
            bio: body.bio,
            user_layout: body.layout,
            opacity: body.opacity,
            autoplaymessage: body.autoplaymessage,
            blur: body.blur,
            font: body.font,
            width: body.width,
            bg_color: body.bg_color,
            box_color: body.box_color,
            text_color: body.text_color,
            border_color: body.border_color,
            border_width: body.border_width,
            autoplayfix: body.autoplayfix,
             background_blur: body.background_blur,
            effects: body.effects
        };

        Object.assign(user, updateFields);
        await user.save();

        return new NextResponse(
            JSON.stringify({ 
                success: true, 
                message: "Profile updated successfully!",
                updatedFields: Object.keys(updateFields)
            }),
            { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    } catch (error) {
        console.error('Profile update error:', error);

        if (error instanceof ZodError) {
            return createErrorResponse("", 400);
        }

        if (error instanceof Error) {
            return createErrorResponse(`: ${error.message}`, 500);
        }

        return createErrorResponse("", 500);
    }
}