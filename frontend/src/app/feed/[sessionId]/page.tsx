"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, Bookmark, Plus, Loader2, Clock } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session";
import { api } from "@/lib/api";

export default function FeedPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { sessionId: storeSessionId, posts, platform, hiddenPostIds, setSession } =
    useSessionStore();

  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      if (!storeSessionId || storeSessionId !== sessionId) {
        try {
          const session = await api.getSession(sessionId);
          setSession(
            session.session_id,
            session.source_text,
            session.platform as "reddit" | "twitter",
            session.generated_posts
          );
        } catch (err) {
          console.error("Failed to load session:", err);
          router.push("/");
        }
      }
    };

    loadSession();
  }, [sessionId, storeSessionId, setSession, router]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!sessionId) return;
      try {
        const response = await api.generateRecommendations(sessionId);
        setRecommendations(response.recommendations);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [sessionId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const visiblePosts = posts.filter((post) => !hiddenPostIds.includes(post.id));

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExploreRecommendation = (prompt: string) => {
    router.push(`/?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-[600px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-xl">
            {platform === "reddit" ? "r/Learn" : "@Feed"}
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/history">
              <Button variant="ghost" size="sm">
                <Clock size={18} />
              </Button>
            </Link>
            <Link href="/saved">
              <Button variant="ghost" size="sm">
                <Bookmark size={18} />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Plus size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-6">
        {visiblePosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts to show</p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} platform={platform} />
          ))
        )}

        {visiblePosts.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="font-semibold text-lg mb-4">Explore more topics</h2>
            {loadingRecs ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading recommendations...
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => handleExploreRecommendation(rec)}
                    className="flex-shrink-0 px-4 py-2 bg-white border rounded-full text-sm hover:bg-gray-50 transition-colors"
                  >
                    {rec}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </main>
    </div>
  );
}
