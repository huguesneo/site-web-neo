const GHL_BASE = 'https://services.leadconnectorhq.com';
const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID as string;
const apiKey = process.env.NEXT_PUBLIC_GHL_API_KEY as string;

const headers = {
  Authorization: `Bearer ${apiKey}`,
  Version: '2021-07-28',
  'Content-Type': 'application/json',
};

export interface GHLBlog {
  id: string;
  name: string;
  description?: string;
}

export interface GHLBlogPost {
  id: string;
  title: string;
  url: string;          // slug
  description?: string; // excerpt
  rawHTML?: string;     // full HTML content
  featuredImage?: string;
  imageAltText?: string;
  categories?: Array<{ id: string; label: string }>;
  tags?: string[];
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  readTime?: number;
  status?: string;
}

// ─── Get list of blogs for this location ──────────────────────────────────────
export async function fetchGHLBlogs(): Promise<GHLBlog[]> {
  const url = `${GHL_BASE}/blogs/?locationId=${locationId}&limit=10&offset=0`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GHL blogs list: ${res.status}`);
  const data = await res.json();
  // Response shape: { blogs: [...], total: N }
  return data.blogs ?? data ?? [];
}

// ─── Get posts for a specific blog ────────────────────────────────────────────
export async function fetchGHLBlogPosts(blogId: string, limit = 20, offset = 0): Promise<{ posts: GHLBlogPost[]; total: number }> {
  const url = `${GHL_BASE}/blogs/${blogId}/posts?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GHL blog posts: ${res.status}`);
  const data = await res.json();
  return {
    posts: data.posts ?? data.data ?? data ?? [],
    total: data.total ?? data.count ?? 0,
  };
}

// ─── Get single post by slug ───────────────────────────────────────────────────
export async function fetchGHLBlogPostBySlug(blogId: string, slug: string): Promise<GHLBlogPost | null> {
  // GHL doesn't have a slug lookup endpoint — fetch all and filter
  const { posts } = await fetchGHLBlogPosts(blogId, 100, 0);
  return posts.find((p) => p.url === slug || p.id === slug) ?? null;
}

// ─── Get single post by ID ─────────────────────────────────────────────────────
export async function fetchGHLBlogPostById(blogId: string, postId: string): Promise<GHLBlogPost | null> {
  const url = `${GHL_BASE}/blogs/${blogId}/posts/${postId}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.post ?? data ?? null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

/** Format a date string to French Canadian format */
export function formatDateFR(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Estimate read time from HTML content */
export function estimateReadTime(html: string): string {
  const words = stripHtml(html).split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}
