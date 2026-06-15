import { groq } from 'next-sanity';

// Liste des articles publiés (page /blog)
export const postsQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage,
    "category": category->title,
    "author": author->name,
    "authorRole": author->role
  }
`;

// Un article complet par slug (page /blog/[slug])
export const postQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    seoTitle,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage,
    body,
    "category": category->title,
    "author": author->{name, role, image, bio}
  }
`;

// Tous les slugs (pour générer les pages statiques)
export const postSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)]{ "slug": slug.current }
`;
