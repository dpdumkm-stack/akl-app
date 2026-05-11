import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: "SIGNAL OK - SERVER IS RESPONDING",
        timestamp: new Date().toISOString()
    });
}
