import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GHL_BASE = 'https://services.leadconnectorhq.com';

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };
}

// GET /api/ghl/blog?action=blogs
// GET /api/ghl/blog?action=posts&blogId=X&limit=20&offset=0
// GET /api/ghl/blog?action=post&blogId=X&postId=Y
export async function GET(req: NextRequest) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) {
    return NextResponse.json({ error: 'Variables GHL manquantes côté serveur.' }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action');

  if (action === 'blogs') {
    const url = `${GHL_BASE}/blogs/?locationId=${locationId}&limit=10&offset=0`;
    const res = await fetch(url, { headers: ghlHeaders() });
    if (!res.ok) return NextResponse.json({ error: `GHL blogs: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json({ blogs: data.blogs ?? data ?? [] });
  }

  if (action === 'posts') {
    const blogId = searchParams.get('blogId');
    const limit = searchParams.get('limit') ?? '20';
    const offset = searchParams.get('offset') ?? '0';
    if (!blogId) return NextResponse.json({ error: 'blogId requis' }, { status: 400 });
    const url = `${GHL_BASE}/blogs/${blogId}/posts?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: ghlHeaders() });
    if (!res.ok) return NextResponse.json({ error: `GHL posts: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json({
      posts: data.posts ?? data.data ?? data ?? [],
      total: data.total ?? data.count ?? 0,
    });
  }

  if (action === 'post') {
    const blogId = searchParams.get('blogId');
    const postId = searchParams.get('postId');
    if (!blogId || !postId) return NextResponse.json({ error: 'blogId et postId requis' }, { status: 400 });
    const url = `${GHL_BASE}/blogs/${blogId}/posts/${postId}`;
    const res = await fetch(url, { headers: ghlHeaders() });
    if (!res.ok) return NextResponse.json({ post: null }, { status: 200 });
    const data = await res.json();
    return NextResponse.json({ post: data.post ?? data ?? null });
  }

  return NextResponse.json({ error: 'action invalide' }, { status: 400 });
}
