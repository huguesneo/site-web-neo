'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Section from '../components/Section';
import Button from '../components/Button';
import { ArrowLeft, Clock, Calendar, Share2, Facebook, Twitter, Linkedin, Loader2 } from 'lucide-react';
import {
  fetchGHLBlogs,
  fetchGHLBlogPostById,
  fetchGHLBlogPostBySlug,
  stripHtml,
  formatDateFR,
  estimateReadTime,
  GHLBlogPost,
} from '../services/ghlBlogApi';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop';

interface PostDisplay {
  title: string;
  content: string;
  category: string;
  author: string;
  authorImage: string;
  authorRole: string;
  date: string;
  readTime: string;
  image: string;
}

function mapToDisplay(post: GHLBlogPost): PostDisplay {
  return {
    title: post.title,
    content: post.rawHTML ?? post.description ?? '',
    category: post.categories?.[0]?.label ?? 'Santé',
    author: post.author ?? 'Équipe NEO',
    authorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop',
    authorRole: 'Expert NEO Performance',
    date: post.publishedAt ? formatDateFR(post.publishedAt) : '',
    readTime: post.readTime
      ? `${post.readTime} min`
      : (post.rawHTML ? estimateReadTime(post.rawHTML) : '5 min'),
    image: post.featuredImage ?? DEFAULT_IMAGE,
  };
}

const BlogPostPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<PostDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setIsLoading(true);

        // blogId and ghlId are passed as URL search params from Blog.tsx
        const blogId = searchParams?.get('blogId');
        const ghlId = searchParams?.get('ghlId');

        let raw: GHLBlogPost | null = null;

        if (blogId && ghlId) {
          // Direct lookup by ID (fastest path)
          raw = await fetchGHLBlogPostById(blogId, ghlId);
        }

        if (!raw) {
          // Fallback: fetch all blogs, then search by slug/id
          const blogs = await fetchGHLBlogs();
          for (const blog of blogs) {
            raw = await fetchGHLBlogPostBySlug(blog.id, id);
            if (raw) break;
          }
        }

        if (raw) setPost(mapToDisplay(raw));
      } catch (err) {
        console.error('GHL BlogPost error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Loader2 size={48} className="text-neo animate-spin mb-4" />
        <p className="text-gray-500">Chargement de l'article…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
        <Button onClick={() => router.push('/blog')}>Retour au blog</Button>
      </div>
    );
  }

  return (
    <article className="pt-24 min-h-screen bg-white">
      {/* Header */}
      <div className="container mx-auto px-4 max-w-4xl mb-12">
        <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-neo mb-8 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Retour aux articles
        </Link>

        <div className="mb-6 flex gap-3">
          <span className="bg-neo/10 text-neo px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {post.category}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center justify-between border-y border-gray-100 py-6">
          <div className="flex items-center gap-4">
            <img src={post.authorImage} alt={post.author} className="w-12 h-12 rounded-full object-cover shadow-sm" loading="lazy" />
            <div>
              <p className="font-bold text-gray-900 text-sm">{post.author}</p>
              <p className="text-xs text-gray-500">{post.authorRole}</p>
            </div>
          </div>
          <div className="flex flex-col items-end text-xs text-gray-500 gap-1">
            {post.date && <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>}
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime} de lecture</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="container mx-auto px-4 max-w-5xl mb-16">
        <div className="aspect-[21/9] rounded-3xl overflow-hidden shadow-xl">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-3xl">
        <div
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-a:text-neo prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-ul:list-disc prose-ul:pl-5
            prose-li:marker:text-neo"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-bold text-gray-900 flex items-center gap-2">
            <Share2 size={18} /> Partager cet article
          </p>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-colors">
              <Facebook size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-400 hover:text-white transition-colors">
              <Twitter size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-700 hover:text-white transition-colors">
              <Linkedin size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Section background="light" className="mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Besoin d'aller plus loin ?</h2>
          <p className="text-gray-600 mb-8">
            Cet article vous a parlé ? Discutons de votre situation personnelle lors d'une consultation gratuite de 30 minutes.
          </p>
          <Button to="/consultation" variant="primary">Réserver ma consultation</Button>
        </div>
      </Section>
    </article>
  );
};

export default BlogPostPage;
