'use client';

import { useState } from 'react';
import RencontreLanding from './RencontreLanding';
import CarteQuestionnaireB from './CarteQuestionnaireB';

/** Version B : les boutons mènent au questionnaire, puis au calendrier une fois terminé. */
export default function RencontreB() {
  const [fini, setFini] = useState(false);
  return (
    <RencontreLanding
      version="B"
      cta={fini ? 'Choisir ma plage' : 'Répondre aux 4 questions'}
      carte={<CarteQuestionnaireB onFini={() => setFini(true)} />}
    />
  );
}
