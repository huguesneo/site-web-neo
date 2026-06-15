'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Section from '../components/Section';
import { ArrowRight, Clock, User } from 'lucide-react';

export interface DisplayPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
}

const Blog: React.FC<{ posts: DisplayPost[] }> = ({ posts }) => {
  const [activeCategory, setActiveCategory] = useState('Tout');

  const categories = ['Tout', ...Array.from(new Set(posts.map((p) => p.category))).filter(Boolean)];

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
            Articles scientifiques et conseils pratiques pour optimiser votre métabolisme et votre santé hormonale.
          </p>
        </div>
      </div>

      <Section className="pt-8 min-h-screen">
        {/* Categories */}
        {categories.length > 1 && (
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
        )}

        {/* Posts grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 flex flex-col h-full"
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
                  {post.date && <span className="flex items-center gap-1"><Clock size={12} /> {post.date}</span>}
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

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">Aucun article pour le moment. Rendez-vous sur <span className="font-bold">/studio</span> pour publier le premier !</p>
          </div>
        )}
      </Section>
    </>
  );
};

export default Blog;
