import { NextRequest, NextResponse } from "next/server";

async function getVideoComments(videoId: string) {
  // Simplified: Use real YouTube API key
  const key = process.env.YOUTUBE_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${key}`
  );
  const data = await res.json();
  // Parse comments... (full code from earlier blueprint)
  return { comments: [], total: 0 }; // Placeholder — expand with earlier TS
}

async function isHighValue(comment: string): Promise<boolean> {
  // Full filter logic from earlier
  return Math.random() > 0.5; // Placeholder
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const videoId = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
  if (!videoId) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

  const { comments } = await getVideoComments(videoId);
  const highValue = (await Promise.all(comments.map(c => isHighValue(c.text)))).filter(Boolean);
  // Summary prompt to OpenAI... (full from earlier)

  return NextResponse.json({ summary: "High-value insights here", highValueCount: highValue.length });
}
