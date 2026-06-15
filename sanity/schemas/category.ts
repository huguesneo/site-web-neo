import { defineField, defineType } from 'sanity';

export const category = defineType({
  name: 'category',
  title: 'Catégorie',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nom',
      type: 'string',
      description: 'Ex : Métabolisme, Hormones, Digestion, Cortisol',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identifiant (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
});
