import { NextResponse } from "next/server";
import { logout, getSession } from "@/lib/auth";
export async function POST() {
   const session = await getSession();
    if(!session) {
        return new NextResponse(
            JSON.stringify({ success: false, message: "You must be signed in to access this endpoint" }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    try {
      await logout();  
        return new NextResponse(
            JSON.stringify({
                success: true,
                message: 'User signed out successfully',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error(error); 
        return new NextResponse('Something went wrong', { status: 500 });
    }
}