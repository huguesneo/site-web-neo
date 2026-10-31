import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Page « lien en bio » (neoperformance.ca/lien) — remplace Linktree.
 *
 * Document unique (singleton) : l'ordre des éléments dans la liste = l'ordre
 * affiché sur la page. Glisser-déposer pour réordonner. Deux types d'éléments :
 *  - Titre de section (ex : « Gratuit pour commencer »)
 *  - Lien : style (standard / principal / sombre), sous-titre, icône et photo
 *    optionnels, largeur pleine ou demie, ou lien discret en pied de page.
 */

const LIEN_ICONS = [
  { title: 'Calendrier', value: 'calendar' },
  { title: 'Livre', value: 'book' },
  { title: 'Graphique', value: 'chart' },
  { title: 'Groupe', value: 'group' },
  { title: 'Vidéo', value: 'video' },
  { title: 'Étoile', value: 'star' },
  { title: 'Article', value: 'article' },
  { title: 'Étincelle', value: 'sparkles' },
];

const STYLE_TITLES: Record<string, string> = {
  standard: 'Standard',
  principal: 'Principal',
  sombre: 'Sombre',
};
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
              description: 'Ex : Gratuit pour commencer. Affiché en petites majuscules espacées.',
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
              name: 'style',
              title: 'Style du bouton',
              type: 'string',
              description:
                'Standard : carte blanche. Principal : fond teal, plus grand, pour le lien à pousser (photo non requise). Sombre : fond foncé, texte clair.',
              options: {
                list: [
                  { title: 'Standard (carte blanche)', value: 'standard' },
                  { title: 'Principal (fond teal, plus grand)', value: 'principal' },
                  { title: 'Sombre (fond foncé)', value: 'sombre' },
                ],
                layout: 'radio',
              },
              initialValue: 'standard',
              hidden: ({ parent }) => Boolean(parent?.featured),
            }),
            defineField({
              name: 'icon',
              title: 'Icône (optionnelle)',
              type: 'string',
              description: 'Petite icône linéaire affichée devant le titre.',
              options: { list: LIEN_ICONS },
              hidden: ({ parent }) => Boolean(parent?.featured),
            }),
            defineField({
              name: 'width',
              title: 'Largeur',
              type: 'string',
              description:
                'Deux liens « Demie » consécutifs s\'affichent côte à côte (l\'un sous l\'autre sur très petit écran). Un « Demie » seul reste pleine largeur.',
              options: {
                list: [
                  { title: 'Pleine largeur', value: 'full' },
                  { title: 'Demie (2 par rangée)', value: 'half' },
                ],
                layout: 'radio',
              },
              initialValue: 'full',
              hidden: ({ parent }) => Boolean(parent?.featured) || Boolean(parent?.footer),
            }),
            defineField({
              name: 'footer',
              title: 'Lien de pied de page',
              type: 'boolean',
              description:
                'Petit texte souligné tout en bas de la page, discret (ex : « Rejoins notre équipe »). L\'ordre dans la liste est respecté entre les liens de pied de page.',
              initialValue: false,
              hidden: ({ parent }) => Boolean(parent?.featured),
            }),
            defineField({
              name: 'emoji',
              title: 'Emoji (ancien, optionnel)',
              type: 'string',
              description:
                'Ancien réglage, gardé pour les liens existants. Préfère l\'icône ci-dessus : elle remplace l\'emoji si les deux sont remplis.',
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
              title: '⭐ Mettre en vedette (ancien style)',
              type: 'boolean',
              description:
                'Ancienne grande carte avec photo et bouton d\'action (comme le Défi NEO 10K). Pour un nouveau bouton en avant, utilise plutôt le style « Principal » (photo non requise).',
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
              style: 'style',
              width: 'width',
              footer: 'footer',
              enabled: 'enabled',
              media: 'image',
            },
            prepare({ label, subtitle, emoji, featured, style, width, footer, enabled, media }) {
              const flags = [
                featured ? '⭐ Vedette' : null,
                !featured && style && style !== 'standard' ? STYLE_TITLES[style] : null,
                !featured && width === 'half' ? '½ Demie' : null,
                !featured && footer ? 'Pied de page' : null,
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
