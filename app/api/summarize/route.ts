// app/api/summarize/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY || !process.env.OPENAI_API_KEY) {
  throw new Error("Missing API keys in .env.local");
}

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return Response.json({ error: "Invalid URL" }, { status: 400 });
  const videoId = match[1];

  try {
    // 1. Get video + comments
    const [videoRes, commentsRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`
      ),
      fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${API_KEY}`
      ),
    ]);

    const [videoData, commentsData] = await Promise.all([
      videoRes.json(),
      commentsRes.json(),
    ]);

    if (!videoData.items?.[0]) {
      return Response.json({ error: "Video not found" }, { status: 404 });
    }

    const video = videoData.items[0];
    const title = video.snippet.title;
    const views = parseInt(video.statistics.viewCount).toLocaleString();
    const totalComments = parseInt(video.statistics.commentCount);

    const comments = commentsData.items?.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    ) || [];

    // 2. AI: Extract health anecdotes
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a health anecdote miner. Extract ONLY real personal stories where:
- Someone (or family member) reduced/stopped medication
- A natural remedy/diet/drink led to improvement
- Include: who, what remedy, what outcome
Rate each 1–5 stars based on clarity and impact.
Return JSON only.`,
        },
        {
          role: "user",
          content: `Comments:\n${comments.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`,
        },
      ],
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || "{}");

    // 3. Count high-value (basic)
    const highValueCount = comments.filter((c: string) =>
      /med|pill|dose|stop|reduce|mom|dad|grand|healed|fixed|tea|juice|diet/i.test(c)
    ).length;

    const highValueRatio = totalComments > 0 ? ((highValueCount / totalComments) * 100).toFixed(1) : "0";

    return Response.json({
      video: { title },
      stats: {
        totalViews: views,
        totalComments,
        highValueCount,
        highValueRatio: `${highValueRatio}%`,
      },
      anecdotes: aiResult.anecdotes || [],
      summary: aiResult.summary || "No strong anecdotes found.",
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return Response.json({ error: "AI processing failed" }, { status: 500 });
  }
}
