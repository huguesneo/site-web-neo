'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Section from '../components/Section';
import { ArrowRight, Clock, User, Loader2, AlertCircle } from 'lucide-react';
import { fetchGHLBlogs, fetchGHLBlogPosts, stripHtml, formatDateFR, estimateReadTime, GHLBlogPost } from '../services/ghlBlogApi';

interface DisplayPost {
  id: string;        // used in URL (/blog/:id) — prefer slug, fallback to id
  ghlId: string;     // real GHL post id (for fetching full content)
  blogId: string;    // parent blog id
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop';

function mapPost(post: GHLBlogPost, blogId: string): DisplayPost {
  return {
    id: post.url || post.id,
    ghlId: post.id,
    blogId,
    title: post.title,
    excerpt: post.description
      ? stripHtml(post.description).substring(0, 140) + '…'
      : (post.rawHTML ? stripHtml(post.rawHTML).substring(0, 140) + '…' : ''),
    category: post.categories?.[0]?.label ?? 'Santé',
    author: post.author ?? 'Équipe NEO',
    date: post.publishedAt ? formatDateFR(post.publishedAt) : '',
    readTime: post.readTime ? `${post.readTime} min` : (post.rawHTML ? estimateReadTime(post.rawHTML) : '5 min'),
    image: post.featuredImage ?? DEFAULT_IMAGE,
  };
}

const Blog: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [categories, setCategories] = useState<string[]>(['Tout']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError('');

        // 1. Get blog list for this location
        const blogs = await fetchGHLBlogs();
        if (!blogs.length) {
          setPosts([]);
          return;
        }

        // 2. Fetch posts from all blogs (usually just one)
        const allPosts: DisplayPost[] = [];
        for (const blog of blogs) {
          const { posts: raw } = await fetchGHLBlogPosts(blog.id, 50);
          const published = raw.filter((p) => !p.status || p.status === 'PUBLISHED');
          allPosts.push(...published.map((p) => mapPost(p, blog.id)));
        }

        // 3. Build dynamic category list
        const cats = ['Tout', ...Array.from(new Set(allPosts.map((p) => p.category))).filter(Boolean)];
        setCategories(cats);
        setPosts(allPosts);
      } catch (err) {
        console.error('GHL Blog error:', err);
        setError('Impossible de charger les articles pour le moment.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const filtered = activeCategory === 'Tout'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-20 text-center">
        <div className="container mx-auto px-4">
          <span className="text-neo font-bold uppercase tracking-wider text-sm mb-2 block animate-fade-in-up">Le Journal NEO</span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up [animation-delay:100ms]">Comprendre son corps</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up [animation-delay:200ms]">
            Articles scientifiques et conseils pratiques synchronisés directement depuis notre base de connaissances.
          </p>
        </div>
      </div>

      <Section className="pt-8 min-h-screen">
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-16">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-neo text-white shadow-lg shadow-neo/30 scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={48} className="text-neo animate-spin" />
            <p className="text-gray-500 font-medium">Chargement des derniers articles…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle size={40} className="text-gray-300" />
            <p className="text-gray-500">{error}</p>
          </div>
        )}

        {/* Posts grid */}
        {!isLoading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((post, idx) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}?blogId=${post.blogId}&ghlId=${post.ghlId}`}
                className={`group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 flex flex-col h-full animate-fade-in-up [animation-delay:${idx * 100}ms]`}
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-neo shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-neo transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-grow">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center text-neo font-bold text-sm mt-auto group-hover:translate-x-2 transition-transform">
                    Lire l'article <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">Aucun article trouvé dans cette catégorie pour le moment.</p>
          </div>
        )}
      </Section>
    </>
  );
};

export default Blog;
