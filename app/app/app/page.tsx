"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    setLoading(true);
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">YouTube Comment Gold Digger</h1>
      <div className="flex gap-4 mb-8">
        <Input
          placeholder="Paste YouTube link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={summarize} disabled={loading}>
          {loading ? "Digging..." : "Summarize"}
        </Button>
      </div>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{result.video?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(result, null, 2)}</pre> {/* Replace with stats grid */}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
