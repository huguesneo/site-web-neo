'use client';
import React, { useState } from 'react';
import Section from '../components/Section';
import TeamCard from '../components/TeamCard';
import Button from '../components/Button';
import { TEAM_MEMBERS } from '../constants';
import { TeamMember } from '../types';
import { X, Check } from 'lucide-react';

const Team: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Rencontre nos experts</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Une équipe multidisciplinaire unie par une mission commune : optimiser ta santé métabolique.
          </p>
        </div>
      </div>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {TEAM_MEMBERS.map(member => (
            <TeamCard 
              key={member.id} 
              member={member} 
              onClick={setSelectedMember} 
            />
          ))}
        </div>
      </Section>

      {/* TEAM MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedMember(null)}
          ></div>
          
          <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in flex flex-col md:flex-row overflow-hidden">
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image Side */}
            <div className="md:w-2/5 h-64 md:h-auto relative">
              <img 
                src={selectedMember.image} 
                alt={selectedMember.name} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Content Side */}
            <div className="md:w-3/5 p-8 md:p-12">
              <span className="inline-block px-3 py-1 rounded-full bg-neo/10 text-neo font-semibold text-sm mb-4">
                {selectedMember.role}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedMember.name}</h2>
              <p className="text-gray-500 font-medium mb-6">{selectedMember.specialty}</p>
              
              <div className="prose prose-sm text-gray-600 mb-8">
                <p>{selectedMember.bio}</p>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Forces & Expertises</h3>
                <ul className="space-y-2">
                  {selectedMember.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-neo/20 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-neo" />
                      </div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <Button to="/consultation" fullWidth>
                Prendre rendez-vous avec l'équipe
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Team;