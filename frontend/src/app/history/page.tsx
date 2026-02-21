"use client";

import Link from "next/link";
import { Plus, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session";

export default function HistoryPage() {
  const { history } = useSessionStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
            <h1 className="font-bold text-xl">History</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Plus size={18} />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-6">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              No history yet
            </h2>
            <p className="text-gray-500 mb-4">
              Your generated feeds will appear here
            </p>
            <Link href="/">
              <Button>Create your first feed</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session) => (
              <Link key={session.sessionId} href={`/feed/${session.sessionId}`}>
                <div className="bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm">
                      <MessageSquare className={`w-4 h-4 ${session.platform === "reddit" ? "text-orange-500" : "text-blue-500"}`} />
                      <span className="font-medium capitalize">{session.platform}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {truncateText(session.sourceText)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {session.posts.length} posts
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
