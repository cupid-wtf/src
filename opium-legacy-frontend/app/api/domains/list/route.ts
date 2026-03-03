import { NextResponse } from "next/server";
import DomainModel from "@/lib/models/domain";
import dbConnect from "@/lib/db";
export async function GET() {
    await dbConnect();
    const urls = await DomainModel.find();
    const domains = {
        success: true, domains: [
            urls
        ]
    }
    return new NextResponse(
        JSON.stringify(domains),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}