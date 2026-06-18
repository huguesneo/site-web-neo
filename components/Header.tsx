'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { LOGO_URL, NAV_LINKS } from '../constants';
import Button from './Button';
import { useCart } from '../contexts/CartContext';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  // Pages dont le hero (haut de page) est foncé : le texte du menu doit y être
  // clair tant qu'on n'a pas scrollé (sinon illisible sur fond sombre).
  const DARK_HERO_ROUTES = ['/approche', '/contact'];
  const onDarkHero = DARK_HERO_ROUTES.includes(pathname);
  // Vrai quand le header est transparent par-dessus un hero foncé.
  const lightText = onDarkHero && !isScrolled && !isMobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? 'bg-white shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo — priority déclenche fetchpriority="high" + preload (LCP element) */}
        <Link href="/" className="relative z-50">
          <Image src={LOGO_URL} alt="NEO Performance" width={48} height={48} priority className="h-10 md:h-12 w-auto object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-sm font-medium transition-colors hover:text-neo ${
                pathname === link.path ? 'text-neo' : lightText ? 'text-white' : 'text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/panier" aria-label="Voir mon panier" className={`relative p-2 hover:text-neo transition-colors ${lightText ? 'text-white' : 'text-gray-700'}`}>
            <ShoppingCart size={22} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-neo text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
                {count}
              </span>
            )}
          </Link>
          <Button to="/consultation" variant="primary" className="shadow-lg shadow-neo/20">
            Prendre rendez-vous
          </Button>
        </div>

        {/* Mobile Cart */}
        <Link href="/panier" aria-label="Voir mon panier" className={`lg:hidden relative z-50 p-2 hover:text-neo transition-colors mr-1 ${lightText ? 'text-white' : 'text-gray-800'}`}>
          <ShoppingCart size={22} />
          {count > 0 && (
            <span className="absolute top-0 right-0 bg-neo text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] px-1 flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>

        {/* Mobile Toggle */}
        <button
          className={`lg:hidden relative z-50 p-2 focus:outline-none hover:text-neo transition-colors ${lightText ? 'text-white' : 'text-gray-800'}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-white z-40 flex flex-col pt-24 pb-10 px-6 overflow-y-auto transition-transform duration-300 lg:hidden h-[100dvh] ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <nav className="flex flex-col items-center gap-6 w-full mb-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-xl font-medium w-full text-center py-3 border-b border-gray-100 ${
                  pathname === link.path ? 'text-neo' : 'text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto w-full max-w-sm mx-auto space-y-4 pb-8">
            <Button to="/consultation" fullWidth className="shadow-xl">
              Prendre rendez-vous
            </Button>
            <p className="text-center text-xs text-gray-400">
              Consultation gratuite de 45 minutes
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
