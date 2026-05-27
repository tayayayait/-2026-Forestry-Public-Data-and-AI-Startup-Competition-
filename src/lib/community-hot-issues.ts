import type { CommunityPost } from "@/stores/appStore";

function hotIssueScore(post: CommunityPost): number {
  return post.likes + post.comments;
}

export function sortCommunityPostsByHotness(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort((left, right) => {
    const scoreDelta = hotIssueScore(right) - hotIssueScore(left);
    if (scoreDelta !== 0) return scoreDelta;

    const likeDelta = right.likes - left.likes;
    if (likeDelta !== 0) return likeDelta;

    return right.id - left.id;
  });
}

export function getCommunityHotIssues(posts: CommunityPost[], limit = 3): CommunityPost[] {
  return sortCommunityPostsByHotness(posts).slice(0, limit);
}
