import { describe, expect, it } from "vitest";
import type { CommunityPost } from "@/stores/appStore";
import { getCommunityHotIssues, sortCommunityPostsByHotness } from "./community-hot-issues";

function post(overrides: Partial<CommunityPost>): CommunityPost {
  return {
    id: 1,
    author: "테스터",
    location: "지리산",
    date: "2026-05-25",
    content: "테스트 게시글",
    likes: 0,
    comments: 0,
    avatar: null,
    isLiked: false,
    commentList: [],
    ...overrides,
  };
}

describe("community hot issues", () => {
  it("ranks posts by likes and comments, then likes, then latest id", () => {
    const posts = [
      post({ id: 1, content: "old", likes: 3, comments: 0 }),
      post({ id: 2, content: "commented", likes: 1, comments: 4 }),
      post({ id: 3, content: "liked", likes: 5, comments: 0 }),
      post({ id: 4, content: "latest tie", likes: 3, comments: 0 }),
    ];

    expect(sortCommunityPostsByHotness(posts).map((item) => item.id)).toEqual([3, 2, 4, 1]);
  });

  it("limits the home hot issue list without mutating source posts", () => {
    const posts = [post({ id: 1, likes: 1 }), post({ id: 2, likes: 2 }), post({ id: 3, likes: 3 })];

    expect(getCommunityHotIssues(posts, 2).map((item) => item.id)).toEqual([3, 2]);
    expect(posts.map((item) => item.id)).toEqual([1, 2, 3]);
  });
});
