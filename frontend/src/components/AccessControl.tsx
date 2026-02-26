import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';

type Language = 'de' | 'en';

interface AccessControlProps {
  children: React.ReactNode;
  language?: Language;
}

const translations = {
  de: {
    title: 'Registrierung erforderlich',
    message: 'Diese Funktion ist nur für registrierte Spieler verfügbar.',
    loginButton: 'Jetzt anmelden',
    backButton: 'Zurück zum Menü',
    loading: 'Lade...',
    checkingAuth: 'Überprüfe Authentifizierung...',
  },
  en: {
    title: 'Registration Required',
    message: 'This feature is only available for registered players.',
    loginButton: 'Login Now',
    backButton: 'Back to Menu',
    loading: 'Loading...',
    checkingAuth: 'Checking authentication...',
  },
};

export const AccessControl: React.FC<AccessControlProps> = ({ children, language = 'de' }) => {
  const navigate = useNavigate();
  const { identity, login, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const t = translations[language];

  // Show loading state while checking authentication
  if (isInitializing || profileLoading || !isFetched) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="text-2xl text-cyan-400 mb-4">{t.checkingAuth}</div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has a profile
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const hasProfile = !!userProfile;

  // If not authenticated or no profile, show access denied screen
  if (!isAuthenticated || !hasProfile) {
    return (
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-red-500">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold text-red-400 mb-4">{t.title}</h1>
              <p className="text-gray-300 text-lg mb-6">{t.message}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={login}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button shadow-lg"
              >
                {t.loginButton}
              </button>
              <button
                onClick={() => navigate({ to: '/' })}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button shadow-lg"
              >
                {t.backButton}
              </button>
            </div>
          </div>

          <footer className="mt-8 text-center text-gray-300 text-sm px-4 bg-black/50 backdrop-blur-sm rounded-lg py-2">
            <div>
              © 2025. Built with ❤️ using{' '}
              <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
                caffeine.ai
              </a>
            </div>
            <div className="mt-1">{language === 'de' ? 'durch j_marques' : 'by j_marques'}</div>
          </footer>
        </div>
      </div>
    );
  }

  // User is authenticated and has profile, render children
  return <>{children}</>;
};
