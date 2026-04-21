'use client';
import React from 'react';
import Link from 'next/link';
import { LOGO_URL, NAV_LINKS } from '../constants';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="space-y-6">
            <img src={LOGO_URL} alt="NEO Performance" className="h-10 w-auto brightness-0 invert" />
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Clinique d'optimisation métabolique. Nous redéfinissons la santé métabolique par une approche scientifique et humaine.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/neoperformance/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neo transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://www.facebook.com/neoperformance1" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neo transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Navigation</h4>
            <ul className="space-y-4">
              {NAV_LINKS.map(link => (
                <li key={link.path}>
                  <Link href={link.path} className="text-gray-400 hover:text-neo transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/consultation" className="text-neo hover:text-white transition-colors text-sm font-semibold">
                  Consultation Gratuite
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">Nous Joindre</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 text-neo shrink-0" />
                <span>7005 boul taschereau<br/>Brossard, QC, J4Z 1A7</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-neo shrink-0" />
                <span>+1 (450) 486-4006</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-neo shrink-0" />
                <span>info@neoperformance.com</span>
              </li>
            </ul>
          </div>

          {/* Legal / Hours */}
          <div>
            <h4 className="text-lg font-bold mb-6">Heures d'ouverture</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex justify-between"><span>Lundi - Vendred</span> <span>8h00 - 17h00</span></li>
              <li className="flex justify-between"><span>Samedi</span> <span>Fermé</span></li>
              <li className="flex justify-between"><span>Dimanche</span> <span>Fermé</span></li>
            </ul>
            <div className="mt-8 pt-8 border-t border-gray-800 text-xs text-gray-500">
              <p>Reçus d'assurance disponibles.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} NEO Performance. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/confidentialite" className="hover:text-white">Politique de confidentialité</Link>
            <Link href="/termes" className="hover:text-white">Termes et conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
