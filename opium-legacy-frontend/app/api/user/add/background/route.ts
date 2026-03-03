import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { v4 } from 'uuid';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/s3';
import dbConnect from "@/lib/db";
import UserModel from "@/lib/models/user";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
    const session = await getSession();
    await dbConnect();
    
    if (!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to access this endpoint" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "File is required" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    if (file.size > MAX_FILE_SIZE) {
        return new NextResponse(
            JSON.stringify({ success: false, message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    const id = `${v4()}`;
    const key = `backgrounds/${id}`;
    
    try {
        const filebuf = await file.arrayBuffer();
        const fileBuffer = Buffer.from(filebuf);
        
        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key, 
            Body: fileBuffer,
            ContentType: file.type,
        }));
    
        const backgroundUrl = `https://r2.opium.bio/${key}`;
        const fileCategory = file.type.startsWith('video/') ? 'video' : 'image';
    
        const updatedUser = await UserModel.findByIdAndUpdate(session.id, {
            background: { url: backgroundUrl, type: fileCategory }
        }, { new: true, runValidators: true });
        
        return new NextResponse(
            JSON.stringify({ 
                success: true, 
                message: "Background uploaded successfully", 
                background: updatedUser.background 
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    
    } catch (error) {
        console.error('Background upload error:', error);
        return new NextResponse(
            JSON.stringify({ 
                success: false, 
                message: "Background upload failed", 
                error: error instanceof Error ? error.message : String(error) 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

export async function DELETE() {
    const session = await getSession();
    await dbConnect();
    
    if (!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to access this endpoint" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const user = await UserModel.findById(session.id);
        
        if (!user || !user.background) {
            return new NextResponse(
                JSON.stringify({ success: false, message: "No background found to delete" }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const backgroundUrl = user.background.url;
        const fileKey = `backgrounds/${backgroundUrl.split('/').pop()}`;
        await r2.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
        }));
        await UserModel.findByIdAndUpdate(session.id, { background: { url: "", type: "" } });

        return new NextResponse(
            JSON.stringify({ success: true, message: "Background deleted successfully" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Background deletion error:', error);
        return new NextResponse(
            JSON.stringify({ 
                success: false, 
                message: "Error deleting background", 
                error: error instanceof Error ? error.message : String(error) 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}