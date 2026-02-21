"use client";

import { useRef, useState } from "react";
import { Post } from "@/lib/types";
import { useSessionStore } from "@/store/session";
import {
  Heart,
  Bookmark,
  MessageCircle,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Repeat2,
  Share,
  Reply,
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
  poll: { label: "Poll", emoji: "📊", color: "bg-amber-100 text-amber-800" },
};

// deterministic color from string
const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-emerald-500", "bg-sky-500",
];
function avatarColor(handle: string) {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function avatarInitial(handle: string) {
  const stripped = handle.replace(/^[@u/]+/, "");
  return (stripped[0] ?? "?").toUpperCase();
}

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

  const formatCount = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
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
            <a key={`${label}-${i}`} href={href} target="_blank" rel="noreferrer"
              className="underline underline-offset-2 hover:text-gray-500">
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
            <a key={`${label}-${i}`} href={href} target="_blank" rel="noreferrer"
              className="underline underline-offset-2 hover:text-gray-500">
              {label}
            </a>
          );
        })}
      </div>
    );
  };

  const renderListicleBody = (body: string) => {
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    const isListItem = (l: string) => /^(\d+[\.\)]|[-•*])\s/.test(l);
    if (!lines.some(isListItem)) return <p className="text-sm text-gray-600">{body}</p>;
    return (
      <ol className="text-sm text-gray-600 space-y-1.5 list-none pl-0">
        {lines.map((line, i) => {
          const stripped = line.replace(/^(\d+[\.\)]|[-•*])\s+/, "");
          const num = line.match(/^(\d+)/)?.[1];
          return (
            <li key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: "var(--accent)", color: "#fff" }}>
                {num ?? "•"}
              </span>
              <span>{stripped}</span>
            </li>
          );
        })}
      </ol>
    );
  };

  const renderPollBody = (body: string) => {
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    const optionLines = lines.filter((l) => /^([A-D][\)\.]|[•\-])\s/.test(l));
    const preamble = lines.filter((l) => !/^([A-D][\)\.]|[•\-])\s/.test(l)).join(" ");
    return (
      <div className="space-y-2">
        {preamble && <p className="text-sm text-gray-600">{preamble}</p>}
        {optionLines.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {optionLines.map((opt, i) => (
              <div key={i} className="px-3 py-2 rounded-lg border text-sm font-medium cursor-default select-none" style={{ borderColor: "var(--accent)", color: "var(--foreground)" }}>
                {opt}
              </div>
            ))}
          </div>
        )}
        {optionLines.length === 0 && <p className="text-sm text-gray-600">{body}</p>}
      </div>
    );
  };

  const renderComments = () => {
    if (post.comments.length === 0) return <p className="text-sm text-gray-500">No comments yet.</p>;
    if (post.post_type === "question") {
      return (
        <div className="flex flex-col gap-4">
          {post.comments.map((comment, index) => (
            <div key={comment.id}
              className={index === 0 ? "rounded-lg border border-gray-200 bg-gray-50 p-3" : "pl-4 border-l border-gray-200"}>
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
      <SheetContent side="bottom" className="p-0 max-h-[85vh] overflow-hidden"
        onTouchStart={(e) => { touchStartY.current = e.touches[0]?.clientY ?? null; touchDeltaY.current = 0; }}
        onTouchMove={(e) => { if (touchStartY.current === null) return; touchDeltaY.current = e.touches[0].clientY - touchStartY.current; }}
        onTouchEnd={() => { if (touchDeltaY.current > 80) setShowComments(false); touchStartY.current = null; touchDeltaY.current = 0; }}
      >
        <div className="px-4 pt-4 pb-3 border-b">
          <SheetHeader>
            <SheetTitle>{post.comments.length} Comment{post.comments.length !== 1 ? "s" : ""}</SheetTitle>
          </SheetHeader>
          <div className="mt-2 h-1 w-12 rounded-full bg-gray-200 mx-auto" />
        </div>
        <div className="px-4 pb-6 pt-4 max-h-[70vh] overflow-y-auto">{renderComments()}</div>
      </SheetContent>
    </Sheet>
  );

  const hideDialog = (trigger: React.ReactNode, title: string) => (
    <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          {(["already_know", "not_relevant", "too_basic", "too_advanced"] as const).map((reason) => (
            <Button key={reason} variant="outline" onClick={() => handleHide(reason)}>
              {reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
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

  // ── Reddit ──────────────────────────────────────────────────────────────────
  if (platform === "reddit") {
    return (
      <Card className={`mb-4 border-gray-200 transition-opacity duration-300 ${isHiding ? "opacity-0" : "opacity-100"} ${highlighted ? "ring-2 ring-blue-500" : ""} sm:rounded-lg rounded-none`}>
        <CardHeader className="pb-1 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
            <span className="font-semibold text-gray-800">r/Learn</span>
            <span>·</span>
            <span>Posted by {post.author_handle}</span>
            <span>·</span>
            <span>{post.timestamp}</span>
          </div>
          <span className={`mt-1 self-start text-xs px-2 py-0.5 rounded-full ${typeConfig.color}`}>
            {typeConfig.emoji} {typeConfig.label}
          </span>
        </CardHeader>
        <CardContent className="pt-1">
          <h3 className="font-semibold text-base mb-1.5 leading-snug">{post.title}</h3>
          <p className={`text-sm text-gray-600 ${!expanded ? "line-clamp-3" : ""}`}>{post.body}</p>
          {post.body.length > 150 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-blue-500 text-xs mt-1 flex items-center gap-1">
              {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
            </button>
          )}
          <div className="flex items-center gap-1 mt-3 text-gray-500 text-xs -ml-1">
            <button onClick={handleLike}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors ${isLiked ? "text-red-500" : ""}`}>
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              <span>{formatCount(localUpvotes)}</span>
            </button>
            <button onClick={() => setShowComments(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors">
              <MessageCircle size={16} />
              <span>{post.comments.length} Comments</span>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors">
              <Share size={16} />
              <span>Share</span>
            </button>
            <button onClick={handleSave}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors ${isSaved ? "text-blue-500" : ""}`}>
              <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
              <span>Save</span>
            </button>
            {hideDialog(
              <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors">
                <X size={16} /><span>Hide</span>
              </button>,
              "Why don't you want to see this?"
            )}
          </div>
          {renderCitations(post.citations)}
        </CardContent>
        {commentsSheet}
      </Card>
    );
  }

  // ── Twitter / X ─────────────────────────────────────────────────────────────
  const handle = post.author_handle; // e.g. @CamelCase
  const displayName = handle.replace(/^@/, "");
  const initColor = avatarColor(handle);
  const initial = avatarInitial(handle);
  const retweetCount = Math.max(1, Math.floor(localUpvotes * 0.28));

  return (
    <Card className={`mb-0 border-0 border-b rounded-none transition-opacity duration-300 ${isHiding ? "opacity-0" : "opacity-100"} ${highlighted ? "ring-2 ring-blue-500" : ""}`}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start gap-3">
          {/* avatar */}
          <div className={`w-10 h-10 rounded-full ${initColor} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-bold">{initial}</span>
          </div>
          {/* name row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-sm text-gray-900">{displayName}</span>
              <span className="text-gray-500 text-sm">{handle}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-500 text-sm">{post.timestamp}</span>
            </div>
          </div>
          {/* more menu */}
          {hideDialog(
            <button className="text-gray-400 hover:text-gray-600 ml-auto"><MoreHorizontal size={18} /></button>,
            "Hide this post?"
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2 pl-[3.25rem]"> {/* align with name, past avatar */}
        {/* post type badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.color} mb-2 inline-block`}>
          {typeConfig.emoji} {typeConfig.label}
        </span>
        {/* tweet body — title as bold hook, then body */}
        <p className={`text-sm text-gray-900 ${!expanded ? "line-clamp-4" : ""}`}>
          <span className="font-semibold">{post.title}{" "}</span>
          <span className="text-gray-700">{post.body}</span>
        </p>
        {(post.title.length + post.body.length) > 200 && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-blue-500 text-xs mt-1 flex items-center gap-1">
            {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show more</>}
          </button>
        )}
        {renderCitations(post.citations)}
        {/* action row */}
        <div className="flex items-center justify-between mt-3 text-gray-400 max-w-[280px]">
          <button onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
            <span className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors"><Reply size={17} /></span>
            <span className="text-xs">{post.comments.length}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
            <span className="p-1.5 rounded-full group-hover:bg-green-50 transition-colors"><Repeat2 size={17} /></span>
            <span className="text-xs">{formatCount(retweetCount)}</span>
          </button>
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors group ${isLiked ? "text-red-500" : "hover:text-red-500"}`}>
            <span className="p-1.5 rounded-full group-hover:bg-red-50 transition-colors">
              <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
            </span>
            <span className="text-xs">{formatCount(localUpvotes)}</span>
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 transition-colors group ${isSaved ? "text-blue-500" : "hover:text-blue-500"}`}>
            <span className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
              <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
            </span>
          </button>
          <button className="hover:text-blue-500 transition-colors group">
            <span className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors inline-block"><Share size={17} /></span>
          </button>
        </div>
      </CardContent>
      {commentsSheet}
    </Card>
  );
}
