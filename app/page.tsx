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
    <main className="min-h-screen bg-background py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            YouTube Comment Gold Digger
          </h1>
          <p className="text-muted-foreground">
            Find the 1% of comments that actually matter
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <Input
            placeholder="Paste YouTube link here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 min-w-0 text-base"
            disabled={loading}
            style={{ wordBreak: "break-all" }}
          />
          <Button
            onClick={summarize}
            disabled={loading || !url}
            className="sm:w-auto w-full"
          >
            {loading ? "Digging..." : "Summarize"}
          </Button>
        </div>

        {loading && (
          <Card>
            <CardHeader><Skeleton className="h-8 w-96" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        )}

        {result && !loading && (
          <div className="space-y-8">
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
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {result.summary || "No summary available."}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}