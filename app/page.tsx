// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Copy, Star, TrendingUp } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const summarize = async () => {
    setLoading(true);
    setResult(null);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Anecdote Gold Digger
          </h1>
          <p className="text-muted-foreground text-lg">
            Find real stories of natural healing from YouTube comments
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch w-full">
          <Input
            placeholder="Paste YouTube link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              setUrl(text);
            }}
            className="flex-1 min-w-0 text-base font-mono bg-gray-900 text-white placeholder:text-gray-400 border-gray-700"
            disabled={loading}
            style={{ wordBreak: "break-all" }}
          />
          <Button
            onClick={summarize}
            disabled={loading || !url}
            className="w-full sm:w-auto"
          >
            {loading ? "Digging..." : "Find Anecdotes"}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl break-words">
                  {result.video?.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{result.stats?.totalViews} views</Badge>
                  <Badge variant="secondary">{result.stats?.totalComments} comments</Badge>
                  <Badge>{result.stats?.highValueCount} potential</Badge>
                  <Badge variant="outline">{result.stats?.highValueRatio} signal</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="my-4" />

                {/* TOP 20 COMMENTS */}
                {result.topComments?.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Top 20 Most Positive Comments
                    </h3>
                    <div className="space-y-3">
                      {result.topComments.map((c: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3 bg-muted/30 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">#{i + 1}</span>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, s) => (
                                <div
                                  key={s}
                                  className={`w-4 h-4 rounded-full ${
                                    s < c.sentiment ? "bg-green-500" : "bg-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              Sentiment: {c.sentiment}/5
                            </span>
                          </div>
                          <p className="text-foreground/90 leading-relaxed">{c.text}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 text-xs"
                            onClick={() => copyToClipboard(c.text)}
                          >
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* ANECDOTES */}
                {result.anecdotes?.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Top Anecdotes</h3>
                    {result.anecdotes.map((a: any, i: number) => (
                      <div key={i} className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(a.stars)].map((_, s) => (
                            <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">Score: {a.stars}/5</span>
                        </div>
                        <p className="text-sm leading-relaxed">{a.story}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-8"
                          onClick={() => copyToClipboard(a.story)}
                        >
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No strong anecdotes found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}