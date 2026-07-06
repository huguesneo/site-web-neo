'use client';
import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/Button';
import AccountDashboard from '../components/AccountDashboard';
import { supabase } from '../services/supabaseClient';

type Mode = 'login' | 'signup' | 'set-password';

const Account: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');

  // Session / utilisateur connecté
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Champs de formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // États d'interface
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Détecte si on arrive via un lien d'invitation ou de réinitialisation
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const params = new URLSearchParams(hash.replace('#', '?'));
    const linkType = params.get('type'); // 'invite' ou 'recovery'
    if (linkType === 'invite' || linkType === 'recovery') {
      setMode('set-password');
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      // Pré-remplit le courriel si disponible depuis la session du lien
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
      }
      setCheckingSession(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // PASSWORD_RECOVERY = lien "mot de passe oublié", SIGNED_IN via invite = même chose
      if (event === 'PASSWORD_RECOVERY') {
        setMode('set-password');
        if (session?.user?.email) setEmail(session.user.email);
        setUser(null); // ne pas afficher le dashboard avant que le mdp soit créé
        setCheckingSession(false);
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    // Réinitialise le formulaire pour repartir propre.
    setPassword('');
    setConfirmPassword('');
    setSuccess(null);
    setNotice(null);
    setError(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setSuccess(null);
  };

  const validate = (): string | null => {
    if (!email.trim()) return 'Veuillez entrer votre courriel.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Le courriel ne semble pas valide.';
    if (!password) return 'Veuillez entrer un mot de passe.';
    if (mode === 'signup' || mode === 'set-password') {
      if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
      if (!confirmPassword) return 'Veuillez confirmer votre mot de passe.';
      if (password !== confirmPassword) return 'Les deux mots de passe ne correspondent pas.';
    }
    return null;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSuccess(null);

    if (!password) { setError('Veuillez entrer un mot de passe.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les deux mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('Mot de passe créé ! Tu es maintenant connecté.');
        // Récupère la session fraîche pour afficher le dashboard
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
        // Nettoie le hash de l'URL sans recharger la page
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch {
      setError('Une erreur est survenue. Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError('Courriel ou mot de passe incorrect.');
        } else {
          setSuccess('Connexion réussie. Bienvenue !');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          // Supabase renvoie un utilisateur sans "identities" quand le
          // courriel existe déjà : on bascule vers la connexion.
          setMode('login');
          setNotice(
            'Tu as déjà un compte. Utilise le même mot de passe que l’application Neo Performance.'
          );
        } else {
          setSuccess(
            'Compte créé ! Vérifie ta boîte courriel pour confirmer ton adresse, puis connecte-toi.'
          );
        }
      }
    } catch {
      setError('Une erreur est survenue. Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setNotice(null);
    setSuccess(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Entre d’abord ton courriel, puis clique sur « Mot de passe oublié ».');
      return;
    }

    setLoading(true);
    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/espace-client` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setNotice(
          'Si un compte existe avec ce courriel, un lien de réinitialisation vient d’être envoyé.'
        );
      }
    } catch {
      setError('Une erreur est survenue. Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  // Tant qu'on vérifie la session, on évite de faire clignoter le formulaire.
  if (checkingSession) {
    return (
      <section className="min-h-[60vh] bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-neo" />
      </section>
    );
  }

  // Connecté → tableau de bord.
  if (user) {
    return <AccountDashboard user={user} onSignOut={handleSignOut} signingOut={signingOut} />;
  }

  // Mode création de mot de passe via lien d'invitation
  if (mode === 'set-password') {
    return (
      <>
        <div className="bg-gray-50 pt-32 pb-16 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Bienvenue !</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Crée ton mot de passe pour accéder à ton espace client.
            </p>
          </div>
        </div>

        <div className="bg-white py-16 px-4">
          <div className="container mx-auto max-w-md">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 md:p-8">
              <div className="flex gap-2 items-start text-sm text-gray-600 bg-neo-50/60 rounded-xl p-3 mb-6">
                <CheckCircle2 size={18} className="text-neo shrink-0 mt-0.5" />
                <span>
                  Ce mot de passe fonctionnera aussi sur{' '}
                  <strong>l'application NEO Performance</strong>.
                </span>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-4" noValidate>
                {/* Courriel en lecture seule */}
                <div>
                  <label htmlFor="email-invite" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Courriel
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email-invite"
                      type="email"
                      value={email}
                      readOnly
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label htmlFor="password-invite" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Choisir un mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password-invite"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 8 caractères"
                      className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neo focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}
                <div>
                  <label htmlFor="confirm-invite" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirm-invite"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez votre mot de passe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neo focus:border-transparent transition"
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1.5 text-xs text-red-500">Les deux mots de passe ne correspondent pas.</p>
                  )}
                </div>

                {error && (
                  <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 rounded-xl p-3">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex gap-2 items-start text-sm text-green-700 bg-green-50 rounded-xl p-3">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />
                    <span>{success}</span>
                  </div>
                )}

                <Button type="submit" fullWidth disabled={loading} className="mt-2">
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Créer mon mot de passe
                      <ArrowRight size={18} />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero (même style que les autres pages : bande grise puis blanc) */}
      <div className="bg-gray-50 pt-32 pb-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Espace client</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Accédez à vos commandes et à votre suivi NEO Performance.
          </p>
        </div>
      </div>

      <div className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-md">
          {/* Carte */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 md:p-8">
          {/* Onglets */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-full mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2.5 text-sm font-semibold rounded-full transition-all ${
                mode === 'login' ? 'bg-white text-neo shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2.5 text-sm font-semibold rounded-full transition-all ${
                mode === 'signup' ? 'bg-white text-neo shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* Astuce comptes partagés avec l'application */}
          {mode === 'login' && (
            <div className="flex gap-2 items-start text-xs text-gray-500 bg-neo-50/60 rounded-xl p-3 mb-5">
              <CheckCircle2 size={16} className="text-neo shrink-0 mt-0.5" />
              <span>
                Vous utilisez déjà l'application&nbsp;Neo&nbsp;Performance&nbsp;? Connectez-vous avec
                le <strong>même courriel et le même mot de passe</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Courriel */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Courriel
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neo focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs font-medium text-neo hover:text-neo-600"
                    onClick={handleResetPassword}
                  >
                    Mot de passe oublié&nbsp;?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Au moins 8 caractères' : '••••••••'}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neo focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmation du mot de passe (création de compte seulement) */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez votre mot de passe"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neo focus:border-transparent transition"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Les deux mots de passe ne correspondent pas.
                  </p>
                )}
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 rounded-xl p-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Message d'information */}
            {notice && (
              <div className="flex gap-2 items-start text-sm text-neo-900 bg-neo-50 rounded-xl p-3">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-neo" />
                <span>{notice}</span>
              </div>
            )}

            {/* Message de succès */}
            {success && (
              <div className="flex gap-2 items-start text-sm text-green-700 bg-green-50 rounded-xl p-3">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="mt-2">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-2">
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Bascule bas de carte */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                Pas encore de compte&nbsp;?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-neo hover:text-neo-600"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Vous avez déjà un compte&nbsp;?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-neo hover:text-neo-600"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de
            confidentialité.
          </p>
        </div>
      </div>
    </>
  );
};

export default Account;
