'use client';
import React from 'react';
import Quiz from '../components/Quiz';

const QuizPage: React.FC = () => {
  return (
    <div className="relative pt-20 min-h-screen bg-gradient-to-b from-neo-50/40 via-[#F8FAFC] to-white overflow-hidden">
      {/* Décor d'ambiance — cohérent avec le reste du site */}
      <div className="pointer-events-none absolute top-24 -left-24 w-80 h-80 bg-neo/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-24 w-80 h-80 bg-yellow-400/5 rounded-full blur-3xl" />
      <div className="relative z-10">
        <Quiz />
      </div>
    </div>
  );
};

export default QuizPage;
