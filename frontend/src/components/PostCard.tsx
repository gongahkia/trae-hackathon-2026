"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PostCardProps {
  post: Post;
  platform: "reddit" | "twitter";
}

const postTypeConfig = {
  question: { label: "Question", emoji: "❓", color: "bg-blue-100 text-blue-800" },
  creator: { label: "Creator", emoji: "🎙", color: "bg-purple-100 text-purple-800" },
  rant: { label: "Rant", emoji: "🔥", color: "bg-red-100 text-red-800" },
  listicle: { label: "Listicle", emoji: "📋", color: "bg-green-100 text-green-800" },
};

export function PostCard({ post, platform }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);

  const { likedPostIds, toggleLike, savedPosts, addSavedPost, removeSavedPost, hidePost } =
    useSessionStore();

  const isLiked = likedPostIds.includes(post.id);
  const isSaved = savedPosts.some((p) => p.id === post.id);
  const typeConfig = postTypeConfig[post.post_type];

  const handleLike = () => {
    toggleLike(post.id);
  };

  const handleSave = () => {
    if (isSaved) {
      removeSavedPost(post.id);
    } else {
      addSavedPost(post);
    }
  };

  const handleHide = (reason: "already_know" | "not_relevant" | "too_basic" | "too_advanced") => {
    hidePost(post.id, reason);
    setShowHideDialog(false);
  };

  const formatUpvotes = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (platform === "reddit") {
    return (
      <Card className="mb-4 border-gray-200">
        <div className="flex">
          <div className="w-10 flex flex-col items-center p-3 bg-gray-50 rounded-l-lg">
            <button
              onClick={handleLike}
              className={`p-1 rounded hover:bg-gray-200 ${isLiked ? "text-orange-500" : "text-gray-500"}`}
            >
              <ArrowUp size={20} />
            </button>
            <span className="text-sm font-medium">{formatUpvotes(post.upvotes)}</span>
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
                <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  <MessageCircle size={18} />
                  <span>{post.comments.length} comments</span>
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1 ${isSaved ? "text-blue-500" : "text-gray-500 hover:text-gray-700"}`}
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
              {post.citations.length > 0 && (
                <div className="mt-3 text-xs text-gray-400">
                  {post.citations.map((cit, i) => (
                    <div key={i}>{cit}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-0 border-b pb-4">
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
              className={`flex items-center gap-1 ${isLiked ? "text-red-500" : "text-gray-500"}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-sm">{formatUpvotes(post.upvotes)}</span>
            </button>
            <button className="flex items-center gap-1 text-gray-500">
              <MessageCircle size={18} />
              <span className="text-sm">{post.comments.length}</span>
            </button>
            <button
              onClick={handleSave}
              className={`${isSaved ? "text-blue-500" : "text-gray-500"}`}
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
        {post.citations.length > 0 && (
          <div className="mt-3 text-xs text-gray-400">
            {post.citations.map((cit, i) => (
              <div key={i}>{cit}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
