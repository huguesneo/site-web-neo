'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemas';
import { apiVersion, dataset, projectId } from './sanity/env';

export default defineConfig({
  name: 'neo-performance-blog',
  title: 'Blog NEO Performance',
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({
      // « Page Liens » est un singleton : une seule entrée, document à ID fixe,
      // pas de liste où on pourrait en créer un deuxième par erreur.
      structure: (S) =>
        S.list()
          .title('Contenu')
          .items([
            S.listItem()
              .title('🔗 Page Liens (Instagram)')
              .id('linkPage')
              .child(
                S.document().schemaType('linkPage').documentId('linkPage'),
              ),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== 'linkPage',
            ),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
