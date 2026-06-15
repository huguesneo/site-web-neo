import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { urlForImage } from '@/sanity/lib/image';

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const url = urlForImage(value).width(1200).fit('max').url();
      return (
        <img
          src={url}
          alt={value.alt || ''}
          loading="lazy"
          className="rounded-2xl my-8 w-full"
        />
      );
    },
  },
  marks: {
    link: ({ value, children }) => {
      const href = value?.href || '#';
      const external = href.startsWith('http');
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      );
    },
  },
};

export default function PortableBody({ value }: { value: unknown }) {
  return <PortableText value={value as never} components={components} />;
}
