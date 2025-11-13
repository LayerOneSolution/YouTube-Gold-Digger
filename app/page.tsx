// app/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-foreground">YouTube Comment Gold Digger</h1>
      <p className="text-muted-foreground mb-8">Find the 1% of comments that actually matter</p>

      <div className="flex gap-4 mb-12">
        <Input
          placeholder="Paste YouTube link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={summarize} disabled={loading || !url}>
          {loading ? "Digging..." : "Summarize"}
        </Button>
      </div>

      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-8">
          {/* Video Title + Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{result.video?.title || "Untitled Video"}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary">{result.stats?.totalViews || "N/A"} views</Badge>
                <Badge variant="secondary">{result.stats?.totalComments || 0} comments</Badge>
                <Badge>{result.stats?.highValueCount || 0} high-value</Badge>
                <Badge variant="outline">{result.stats?.highValueRatio || "0%"} signal</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{result.summary}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Top High-Value Comments */}
          {result.topComments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.topComments.slice(0, 5).map((c: any, i: number) => (
                    <div key={i} className="border-l-4 border-primary pl-4 py-2">
                      <p className="text-sm text-muted-foreground">@{c.author}</p>
                      <p className="text-foreground">{c.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
