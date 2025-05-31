import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { selected, inputText, authToken } = await req.json();
    if(authToken != (process.env.AUTH_TOKEN ?? '12345')) {
      return NextResponse.json(
        { error: "Invalid auth token" },
        { status: 401 }
      );
    }
    const payload = {
        "presenter_id": selected?.data?.presenter_id,
        "script": {
            "type": "text",
            "subtitles": "false",
            "provider": {
                "type": "microsoft",
                "voice_id": selected?.data?.gender == 'male' ? 'en-US-AndrewMultilingualNeural' : 'en-GB-AbbiNeural'
            },
            "input": inputText,
            "ssml": "false"
        },
        "config": {
            "result_format": "mp4"
        },
        "presenter_config": {
            "crop": {
                "type": "wide"
            }
        }
    };
    const videoResponse = await axios.post(`${process.env.DID_API_URL}/clips`, payload, {
        auth: {
            username: process.env.DID_USERNAME ?? '',
            password: process.env.DID_PASSWORD ?? ''
        }
    });
    console.log(videoResponse.data);
    return NextResponse.json({ videoResponse: videoResponse.data });
}


export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const clip_id = searchParams.get('clip_id');

    const clip = await axios.get(`${process.env.DID_API_URL}/clips/${clip_id}`, {
        auth: {
            username: process.env.DID_USERNAME ?? '',
            password: process.env.DID_PASSWORD ?? ''
        }
    });

    return NextResponse.json({clip:clip.data})
}