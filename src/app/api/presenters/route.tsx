import axios from "axios";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    const presenters = await axios.get(`${process.env.DID_API_URL}/clips/presenters`, {
        auth: {
            username: process.env.DID_USERNAME ?? '',
            password: process.env.DID_PASSWORD ?? ''
        }
    });
    return NextResponse.json({ presenters: presenters.data.presenters ?? [] });
}