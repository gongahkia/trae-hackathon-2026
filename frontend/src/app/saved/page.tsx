"use client";

import Link from "next/link";
import { Bookmark, Plus, ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session";

export default function SavedPage() {
  const { savedPosts, history } = useSessionStore();

  const groupedPosts = savedPosts.reduce((acc, post) => {
    const session = history.find((h) => h.posts.some((p) => p.id === post.id));
    const sessionId = session?.sessionId || "unknown";
    if (!acc[sessionId]) {
      acc[sessionId] = {
        sessionId,
        sourceText: session?.sourceText || "Unknown source",
        posts: [],
      };
    }
    acc[sessionId].posts.push(post);
    return acc;
  }, {} as Record<string, { sessionId: string; sourceText: string; posts: typeof savedPosts }>);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-[600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="font-bold text-xl">Saved Posts</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Plus size={18} />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-6">
        {savedPosts.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Save posts to revisit key insights
            </h2>
            <p className="text-gray-500">
              Posts you save will appear here
            </p>
          </div>
        ) : (
          Object.values(groupedPosts).map((group) => (
            <div key={group.sessionId} className="mb-8">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-700">
                  {group.sourceText}
                </h2>
                <p className="text-xs text-gray-400">
                  {group.posts.length} saved post{group.posts.length !== 1 ? "s" : ""}
                </p>
              </div>
              {group.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  platform={post.platform as "reddit" | "twitter"}
                  condensed
                />
              ))}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
