// Toutes les requêtes GHL passent par /api/ghl/blog (route serveur).
// La clé API GHL_API_KEY reste côté serveur et n'est jamais exposée au navigateur.

export interface GHLBlog {
  id: string;
  name: string;
  description?: string;
}

export interface GHLBlogPost {
  id: string;
  title: string;
  url: string;
  description?: string;
  rawHTML?: string;
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

export async function fetchGHLBlogs(): Promise<GHLBlog[]> {
  const res = await fetch('/api/ghl/blog?action=blogs');
  if (!res.ok) throw new Error(`GHL blogs: ${res.status}`);
  const data = await res.json();
  return data.blogs ?? [];
}

export async function fetchGHLBlogPosts(blogId: string, limit = 20, offset = 0): Promise<{ posts: GHLBlogPost[]; total: number }> {
  const res = await fetch(`/api/ghl/blog?action=posts&blogId=${encodeURIComponent(blogId)}&limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`GHL blog posts: ${res.status}`);
  return res.json();
}

export async function fetchGHLBlogPostBySlug(blogId: string, slug: string): Promise<GHLBlogPost | null> {
  const { posts } = await fetchGHLBlogPosts(blogId, 100, 0);
  return posts.find((p) => p.url === slug || p.id === slug) ?? null;
}

export async function fetchGHLBlogPostById(blogId: string, postId: string): Promise<GHLBlogPost | null> {
  const res = await fetch(`/api/ghl/blog?action=post&blogId=${encodeURIComponent(blogId)}&postId=${encodeURIComponent(postId)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.post ?? null;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export function formatDateFR(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function estimateReadTime(html: string): string {
  const words = stripHtml(html).split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}
