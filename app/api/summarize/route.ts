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

    const comments: string[] = commentsData.items?.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    ) || [];

    let topComments = [];
    let anecdotes = [];
    let summary = "No data.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a health comment analyst. 
Return ONLY valid JSON (no markdown, no code blocks):
{
  "topComments": [{"text": "...", "sentiment": 5}],
  "anecdotes": [{"story": "...", "stars": 5}],
  "summary": "..."
}
`,
          },
          {
            role: "user",
            content: `Comments:\n${comments
              .map((c: string, i: number) => `[${i + 1}] ${c}`)
              .join("\n")}`,
          },
        ],
      });

      let raw = completion.choices[0]?.message?.content?.trim() || "";

      // REMOVE MARKDOWN CODE BLOCKS
      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

      if (raw) {
        const parsed = JSON.parse(raw);
        topComments = (parsed.topComments || []).slice(0, 20).sort((a: any, b: any) => b.sentiment - a.sentiment);
        anecdotes = parsed.anecdotes || [];
        summary = parsed.summary || summary;
      }
    } catch (aiError) {
      console.error("OpenAI failed:", aiError);
    }

    const highValueCount = comments.filter((c: string) =>
      /med|pill|dose|stop|reduce|mom|dad|grand|healed|fixed|tea|juice|diet/i.test(c)
    ).length;

    const highValueRatio = totalComments > 0 ? ((highValueCount / totalComments) * 100).toFixed(1) : "0";

    // Deduplicate: Remove anecdotes from topComments to avoid overlap
    const anecdoteTexts = anecdotes.map((a: any) => a.story.toLowerCase());
    const uniqueTopComments = topComments.filter((c: any) => !anecdoteTexts.includes(c.text.toLowerCase()));

    return Response.json({
      video: { title },
      stats: {
        totalViews: views,
        totalComments,
        highValueCount,
        highValueRatio: `${highValueRatio}%`,
      },
      topComments: uniqueTopComments,
      anecdotes,
      summary,
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
