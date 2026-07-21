import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Page « lien en bio » (neoperformance.ca/lien) — remplace Linktree.
 *
 * Document unique (singleton) : l'ordre des éléments dans la liste = l'ordre
 * affiché sur la page. Glisser-déposer pour réordonner. Deux types d'éléments :
 *  - Titre de section (ex : « Réserve ta consultation gratuite 👇 »)
 *  - Lien (standard ou vedette, avec sous-texte et photo optionnels)
 */
export const linkPage = defineType({
  name: 'linkPage',
  title: 'Page Liens (Instagram)',
  type: 'document',
  fields: [
    defineField({
      name: 'tagline',
      title: 'Phrase sous le @neoperformance',
      type: 'string',
      description: 'Ex : 👉🏼 +10 000 vies transformées. Et si c\'était ton tour?',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Lien Instagram',
      type: 'url',
      initialValue: 'https://www.instagram.com/neoperformance/',
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Lien Facebook',
      type: 'url',
      initialValue: 'https://www.facebook.com/neoperformance1',
    }),
    defineField({
      name: 'tiktokUrl',
      title: 'Lien TikTok',
      type: 'url',
    }),
    defineField({
      name: 'items',
      title: 'Liens et sections',
      type: 'array',
      description:
        'Glisse-dépose pour changer l\'ordre. Le premier de la liste apparaît en haut de la page.',
      of: [
        defineArrayMember({
          name: 'lienSection',
          title: 'Titre de section',
          type: 'object',
          fields: [
            defineField({
              name: 'heading',
              title: 'Titre',
              type: 'string',
              description: 'Ex : Réserve ta consultation gratuite 👇',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { heading: 'heading' },
            prepare({ heading }) {
              return { title: `— ${heading ?? 'Titre de section'} —` };
            },
          },
        }),
        defineArrayMember({
          name: 'lienLink',
          title: 'Lien',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Titre du lien',
              type: 'string',
              description: 'Ex : Consultation gratuite',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'subtitle',
              title: 'Sous-texte (optionnel)',
              type: 'string',
              description: 'Petite ligne sous le titre. Ex : Transforme ton métabolisme en 30 jours',
            }),
            defineField({
              name: 'emoji',
              title: 'Emoji (optionnel)',
              type: 'string',
              description: 'Un seul emoji affiché devant le titre. Ex : 📆, 💪, 🔥',
              validation: (rule) => rule.max(8),
            }),
            defineField({
              name: 'url',
              title: 'URL de destination',
              type: 'url',
              validation: (rule) =>
                rule.required().uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
            }),
            defineField({
              name: 'featured',
              title: '⭐ Mettre en vedette',
              type: 'boolean',
              description:
                'Grande carte sombre avec photo et bouton d\'action (comme le Défi NEO 10K). Idéalement un seul lien vedette à la fois.',
              initialValue: false,
            }),
            defineField({
              name: 'image',
              title: 'Photo (optionnelle)',
              type: 'image',
              options: { hotspot: true },
              description:
                'En vedette : grande image en haut de la carte. En lien standard : petite vignette ronde à la place de l\'emoji.',
            }),
            defineField({
              name: 'ctaLabel',
              title: 'Texte du bouton (vedette seulement)',
              type: 'string',
              description: 'Ex : Je participe →  (par défaut : « Découvrir → »)',
              hidden: ({ parent }) => !parent?.featured,
            }),
            defineField({
              name: 'enabled',
              title: 'Visible sur la page',
              type: 'boolean',
              description: 'Désactive pour cacher le lien sans le supprimer.',
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              label: 'label',
              subtitle: 'subtitle',
              emoji: 'emoji',
              featured: 'featured',
              enabled: 'enabled',
              media: 'image',
            },
            prepare({ label, subtitle, emoji, featured, enabled, media }) {
              const flags = [
                featured ? '⭐ Vedette' : null,
                enabled === false ? '🚫 Masqué' : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return {
                title: `${emoji ? `${emoji} ` : ''}${label ?? 'Lien'}`,
                subtitle: [flags, subtitle].filter(Boolean).join(' — '),
                media,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: '🔗 Page Liens (Instagram)' };
    },
  },
});
