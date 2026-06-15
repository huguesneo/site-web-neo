import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Auteur',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identifiant (slug)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Rôle / Titre',
      type: 'string',
      description: 'Ex : Naturopathe Fondateur',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bio',
      title: 'Biographie courte',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
});
