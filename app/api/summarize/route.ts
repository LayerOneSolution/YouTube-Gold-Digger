// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";

// === Types ===
interface YouTubeComment {
  text: string;
  author: string;
  likes: number;
  publishedAt: string;
}

interface VideoInfo {
  title: string;
  views: string;
}

interface APIResponse {
  video?: VideoInfo;
  comments: YouTubeComment[];
  totalComments: number;
}

// === Helper: Fetch Comments ===
async function getVideoComments(videoId: string): Promise<APIResponse> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY missing");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${key}`
  );
  const data = await res.json();

  if (data.error) throw new Error(data.error.message);

  const comments: YouTubeComment[] = (data.items || []).map((item: any) => {
    const snippet = item.snippet.topLevelComment.snippet;
    return {
      text: snippet.textDisplay || "",
      author: snippet.authorDisplayName || "Anonymous",
      likes: snippet.likeCount || 0,
      publishedAt: snippet.publishedAt || "",
    };
  });

  // Mock video info (replace with video API call if needed)
  const videoInfo: VideoInfo = {
    title: "Sample Video",
    views: "1.2M",
  };

  return {
    video: videoInfo,
    comments,
    totalComments: comments.length,
  };
}

// === High-Value Filter (Simple Version) ===
function isHighValue(comment: string): boolean {
  const spam = ["great", "nice", "first", "fire", "wow", "amazing", "super"];
  const lower = comment.toLowerCase();
  if (comment.length < 30) return false;
  if (spam.some((word) => lower.includes(word)) && comment.length < 100) return false;
  return true;
}

// === POST Handler ===
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const videoId = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!videoId) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

    const { video, comments, totalComments } = await getVideoComments(videoId);
    const highValue = comments.filter((c) => isHighValue(c.text));

    // Mock summary (replace with OpenAI later)
    const summary = `Found ${highValue.length} high-value comments out of ${totalComments}.`;

    return NextResponse.json({
      video,
      stats: {
        totalViews: video?.views || "N/A",
        totalComments,
        highValueCount: highValue.length,
        highValueRatio: totalComments > 0 ? `${((highValue.length / totalComments) * 100).toFixed(1)}%` : "0%",
      },
      summary,
      topComments: highValue.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
