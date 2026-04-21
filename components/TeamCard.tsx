'use client';
import React from 'react';
import { TeamMember } from '../types';
import { Plus, ArrowUpRight } from 'lucide-react';

interface TeamCardProps {
  member: TeamMember;
  onClick: (member: TeamMember) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ member, onClick }) => {
  return (
    <div 
      onClick={() => onClick(member)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100"
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter group-hover:brightness-110"
          loading="lazy"
        />
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Action Button appearing on hover */}
        <div className="absolute bottom-4 right-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-100">
          <div className="bg-neo text-white rounded-full p-3 shadow-lg hover:bg-neo-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <div className="p-6 relative">
        {/* Animated colored bar */}
        <div className="absolute top-0 left-0 w-0 h-1 bg-neo group-hover:w-full transition-all duration-500 ease-in-out"></div>
        
        <p className="text-neo font-bold text-xs tracking-wider uppercase mb-2">{member.role}</p>
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-neo transition-colors">{member.name}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{member.specialty}</p>
      </div>
    </div>
  );
};

export default TeamCard;