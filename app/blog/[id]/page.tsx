import { Suspense } from 'react';
import BlogPostPage from '@/views/BlogPost';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BlogPostPage />
    </Suspense>
  );
}
