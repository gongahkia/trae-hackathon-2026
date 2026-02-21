"use client";

import { useRef, useState } from "react";
import { Post } from "@/lib/types";
import { useSessionStore } from "@/store/session";
import {
  ArrowUp,
  Heart,
  Bookmark,
  MessageCircle,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface PostCardProps {
  post: Post;
  platform: "reddit" | "twitter";
  condensed?: boolean;
  highlighted?: boolean;
}

const postTypeConfig = {
  question: { label: "Question", emoji: "❓", color: "bg-blue-100 text-blue-800" },
  creator: { label: "Creator", emoji: "🎙", color: "bg-purple-100 text-purple-800" },
  rant: { label: "Rant", emoji: "🔥", color: "bg-red-100 text-red-800" },
  listicle: { label: "Listicle", emoji: "📋", color: "bg-green-100 text-green-800" },
};

export function PostCard({ post, platform, condensed = false, highlighted = false }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef(0);

  const { likedPostIds, toggleLike, savedPosts, addSavedPost, removeSavedPost, hidePost } =
    useSessionStore();

  const isLiked = likedPostIds.includes(post.id);
  const isSaved = savedPosts.some((p) => p.id === post.id);
  const [localUpvotes, setLocalUpvotes] = useState(() => post.upvotes + (isLiked ? 1 : 0));
  const typeConfig = postTypeConfig[post.post_type] ?? { label: post.post_type, emoji: "📝", color: "bg-gray-100 text-gray-800" };
  const { toast } = useToast();

  const handleLike = () => {
    setLocalUpvotes((prev) => Math.max(0, prev + (isLiked ? -1 : 1)));
    toggleLike(post.id);
  };

  const handleSave = () => {
    if (isSaved) {
      removeSavedPost(post.id);
    } else {
      addSavedPost(post);
      toast({ title: "Post saved ✓" });
    }
  };

  const handleHide = (reason: "already_know" | "not_relevant" | "too_basic" | "too_advanced") => {
    setShowHideDialog(false);
    setIsHiding(true);
    toast({ title: "Post hidden" });
    setTimeout(() => hidePost(post.id, reason), 250);
  };

  const formatUpvotes = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatCitation = (citation: string) => {
    const raw = citation.replace(/^Source:\s*/i, "").trim();
    const match = raw.match(/https?:\/\/[^\s)]+/);
    const href = match ? match[0] : `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
    return { label: `Source: ${raw}`, href };
  };

  const renderCitations = (citations: string[]) => {
    if (citations.length === 0) return null;
    return (
      <div className="mt-3 flex flex-col gap-1 text-xs text-gray-400">
        {citations.map((cit, i) => {
          const { label, href } = formatCitation(cit);
          return (
            <a
              key={`${label}-${i}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-gray-500"
            >
              {label}
            </a>
          );
        })}
      </div>
    );
  };

  const renderCommentCitations = (citations: string[]) => {
    if (citations.length === 0) return null;
    return (
      <div className="mt-2 flex flex-col gap-1 text-xs text-gray-400">
        {citations.map((cit, i) => {
          const { label, href } = formatCitation(cit);
          return (
            <a
              key={`${label}-${i}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-gray-500"
            >
              {label}
            </a>
          );
        })}
      </div>
    );
  };

  const renderComments = () => {
    if (post.comments.length === 0) {
      return <p className="text-sm text-gray-500">No comments yet.</p>;
    }

    if (post.post_type === "question") {
      return (
        <div className="flex flex-col gap-4">
          {post.comments.map((comment, index) => (
            <div
              key={comment.id}
              className={index === 0 ? "rounded-lg border border-gray-200 bg-gray-50 p-3" : "pl-4 border-l border-gray-200"}
            >
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-gray-700">{comment.author_handle}</span>
                <span>↑ {comment.upvotes}</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-blue-600">
                {index === 0 ? "Context" : `Step ${index + 1}`}
              </div>
              <p className="text-sm text-gray-700 mt-2">{comment.body}</p>
              {renderCommentCitations(comment.citations)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {post.comments.map((comment) => (
          <div key={comment.id} className="border-b pb-3 last:border-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{comment.author_handle}</span>
              <span className="text-xs text-gray-400">↑ {comment.upvotes}</span>
            </div>
            <p className="text-sm text-gray-700">{comment.body}</p>
            {renderCommentCitations(comment.citations)}
          </div>
        ))}
      </div>
    );
  };

  const commentsSheet = (
    <Sheet open={showComments} onOpenChange={setShowComments}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[85vh] overflow-hidden"
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0]?.clientY ?? null;
          touchDeltaY.current = 0;
        }}
        onTouchMove={(event) => {
          if (touchStartY.current === null) return;
          touchDeltaY.current = event.touches[0].clientY - touchStartY.current;
        }}
        onTouchEnd={() => {
          if (touchDeltaY.current > 80) {
            setShowComments(false);
          }
          touchStartY.current = null;
          touchDeltaY.current = 0;
        }}
      >
        <div className="px-4 pt-4 pb-3 border-b">
          <SheetHeader>
            <SheetTitle>
              {post.comments.length} Comment{post.comments.length !== 1 ? "s" : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-2 h-1 w-12 rounded-full bg-gray-200 mx-auto" />
        </div>
        <div className="px-4 pb-6 pt-4 max-h-[70vh] overflow-y-auto">
          {renderComments()}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (condensed) {
    return (
      <Card className="mb-3 border-gray-200 sm:rounded-lg rounded-none">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-gray-900">{post.title}</h3>
          {renderCitations(post.citations)}
        </CardContent>
      </Card>
    );
  }

  if (platform === "reddit") {
    return (
      <Card className={`mb-4 border-gray-200 transition-opacity duration-300 ${isHiding ? "opacity-0" : "opacity-100"} ${highlighted ? "ring-2 ring-blue-500" : ""} sm:rounded-lg rounded-none`}>
        <div className="flex">
          <div className="w-10 flex flex-col items-center p-3 bg-gray-50 rounded-l-lg">
            <button
              onClick={handleLike}
              className={`p-1 rounded hover:bg-gray-200 transition-transform ${isLiked ? "text-orange-500 scale-110" : "text-gray-500"}`}
            >
              <ArrowUp size={20} />
            </button>
            <span className="text-sm font-medium">{formatUpvotes(localUpvotes)}</span>
          </div>
          <div className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{post.author_handle}</span>
                <span>·</span>
                <span>{post.timestamp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                  {typeConfig.emoji} {typeConfig.label}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
              <p className={`text-gray-600 ${!expanded ? "line-clamp-3" : ""}`}>{post.body}</p>
              {post.body.length > 150 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-blue-500 text-sm mt-1 flex items-center gap-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp size={14} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Read more
                    </>
                  )}
                </button>
              )}
              <div className="flex items-center gap-4 mt-3">
                <button onClick={() => setShowComments(true)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                  <span className="relative">
                    <MessageCircle size={18} />
                    {post.comments.length > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[18px] rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] text-white">
                        {post.comments.length}
                      </span>
                    )}
                  </span>
                  <span>{post.comments.length} comments</span>
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1 transition-transform ${isSaved ? "text-blue-500 scale-110" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                </button>
                <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
                  <DialogTrigger asChild>
                    <button className="text-gray-500 hover:text-gray-700">
                      <X size={18} />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Why don&apos;t you want to see this?</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-2">
                      {(["already_know", "not_relevant", "too_basic", "too_advanced"] as const).map(
                        (reason) => (
                          <Button
                            key={reason}
                            variant="outline"
                            onClick={() => handleHide(reason)}
                          >
                            {reason.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Button>
                        )
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {renderCitations(post.citations)}
            </CardContent>
          </div>
        </div>
        {commentsSheet}
      </Card>
    );
  }

  return (
    <Card className={`mb-4 border-0 border-b pb-4 transition-opacity duration-300 ${isHiding ? "opacity-0" : "opacity-100"} ${highlighted ? "ring-2 ring-blue-500" : ""} sm:rounded-lg rounded-none`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <div className="font-semibold">{post.author_handle}</div>
            <div className="text-xs text-gray-500">{post.timestamp}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.color}`}>
            {typeConfig.emoji} {typeConfig.label}
          </span>
        </div>
        <h3 className="font-semibold mb-2">{post.title}</h3>
        <p className={`text-gray-600 ${!expanded ? "line-clamp-3" : ""}`}>{post.body}</p>
        {post.body.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-500 text-sm mt-1 flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Read more
              </>
            )}
          </button>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-transform ${isLiked ? "text-red-500 scale-110" : "text-gray-500"}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-sm">{formatUpvotes(localUpvotes)}</span>
            </button>
            <button onClick={() => setShowComments(true)} className="flex items-center gap-2 text-gray-500">
              <span className="relative">
                <MessageCircle size={18} />
                {post.comments.length > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] text-white">
                    {post.comments.length}
                  </span>
                )}
              </span>
              <span className="text-sm">{post.comments.length}</span>
            </button>
            <button
              onClick={handleSave}
              className={`transition-transform ${isSaved ? "text-blue-500 scale-110" : "text-gray-500"}`}
            >
              <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
          <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
            <DialogTrigger asChild>
              <button className="text-gray-500">
                <MoreHorizontal size={18} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hide this post?</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 mt-2">
                {(["already_know", "not_relevant", "too_basic", "too_advanced"] as const).map(
                  (reason) => (
                    <Button
                      key={reason}
                      variant="outline"
                      onClick={() => handleHide(reason)}
                    >
                      {reason.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Button>
                  )
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {renderCitations(post.citations)}
      </CardContent>
      {commentsSheet}
    </Card>
  );
}
