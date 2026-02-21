import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Post } from "@/lib/types";

interface DislikedReason {
  postId: string;
  reason: "already_know" | "not_relevant" | "too_basic" | "too_advanced";
}

interface SessionData {
  sessionId: string;
  sourceText: string;
  platform: string;
  posts: Post[];
  createdAt: string;
}

interface SessionStore {
  sessionId: string | null;
  sourceText: string;
  platform: "reddit" | "twitter";
  posts: Post[];
  savedPosts: Post[];
  hiddenPostIds: string[];
  likedPostIds: string[];
  dislikedReasons: DislikedReason[];
  history: SessionData[];
  geminiApiKey: string;
  minimaxApiKey: string;
  highlightedPostIds: string[];

  setSession: (sessionId: string, sourceText: string, platform: "reddit" | "twitter", posts: Post[]) => void;
  addSavedPost: (post: Post) => void;
  removeSavedPost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  hidePost: (postId: string, reason: DislikedReason["reason"]) => void;
  addToHistory: (sessionData: SessionData) => void;
  setGeminiApiKey: (key: string) => void;
  setMinimaxApiKey: (key: string) => void;
  setHighlightedPosts: (ids: string[]) => void;
  clearHighlights: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      sourceText: "",
      platform: "reddit",
      posts: [],
      savedPosts: [],
      hiddenPostIds: [],
      likedPostIds: [],
      dislikedReasons: [],
      history: [],
      geminiApiKey: "",
      minimaxApiKey: "",
      highlightedPostIds: [],

      setSession: (sessionId, sourceText, platform, posts) =>
        set({ sessionId, sourceText, platform, posts }),

      addSavedPost: (post) =>
        set((state) => ({
          savedPosts: [...state.savedPosts, post],
        })),

      removeSavedPost: (postId) =>
        set((state) => ({
          savedPosts: state.savedPosts.filter((p) => p.id !== postId),
        })),

      toggleLike: (postId) =>
        set((state) => ({
          likedPostIds: state.likedPostIds.includes(postId)
            ? state.likedPostIds.filter((id) => id !== postId)
            : [...state.likedPostIds, postId],
        })),

      hidePost: (postId, reason) =>
        set((state) => ({
          hiddenPostIds: [...state.hiddenPostIds, postId],
          dislikedReasons: [
            ...state.dislikedReasons,
            { postId, reason },
          ],
        })),

      addToHistory: (sessionData) =>
        set((state) => ({
          history: [
            sessionData,
            ...state.history.filter((h) => h.sessionId !== sessionData.sessionId),
          ].slice(0, 50),
        })),

      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setMinimaxApiKey: (key) => set({ minimaxApiKey: key }),
      setHighlightedPosts: (ids) => set({ highlightedPostIds: ids }),
      clearHighlights: () => set({ highlightedPostIds: [] }),

      reset: () =>
        set({
          sessionId: null,
          sourceText: "",
          platform: "reddit",
          posts: [],
        }),
    }),
    {
      name: "Learned-storage",
      partialize: (state) => ({
        savedPosts: state.savedPosts,
        hiddenPostIds: state.hiddenPostIds,
        likedPostIds: state.likedPostIds,
        dislikedReasons: state.dislikedReasons,
        history: state.history,
        geminiApiKey: state.geminiApiKey,
        minimaxApiKey: state.minimaxApiKey,
      }),
    }
  )
);
