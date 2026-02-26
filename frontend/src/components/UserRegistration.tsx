import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useRegisterUser } from '../hooks/useQueries';

type Language = 'de' | 'en';

interface UserRegistrationProps {
  language?: Language;
  onRegistrationComplete?: () => void;
}

const translations = {
  de: {
    title: 'Willkommen bei GALAGAI!',
    subtitle: 'Bitte gib deinen Spielernamen ein',
    nameLabel: 'Spielername',
    namePlaceholder: 'Dein Name',
    registerButton: 'Registrieren',
    registering: 'Registriere...',
    errorInvalidName: 'Dieser Name ist nicht erlaubt. Bitte wähle einen anderen Namen.',
    errorGeneral: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
    nameRequired: 'Bitte gib einen Namen ein.',
    nameTooShort: 'Der Name muss mindestens 2 Zeichen lang sein.',
    nameTooLong: 'Der Name darf maximal 20 Zeichen lang sein.',
    attribution: 'durch j_marques',
  },
  en: {
    title: 'Welcome to GALAGAI!',
    subtitle: 'Please enter your player name',
    nameLabel: 'Player Name',
    namePlaceholder: 'Your Name',
    registerButton: 'Register',
    registering: 'Registering...',
    errorInvalidName: 'This name is not allowed. Please choose a different name.',
    errorGeneral: 'Registration failed. Please try again.',
    nameRequired: 'Please enter a name.',
    nameTooShort: 'Name must be at least 2 characters long.',
    nameTooLong: 'Name must be at most 20 characters long.',
    attribution: 'by j_marques',
  },
};

export const UserRegistration: React.FC<UserRegistrationProps> = ({ 
  language = 'de',
  onRegistrationComplete 
}) => {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const registerMutation = useRegisterUser();
  
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const t = translations[language];

  // If user already has a profile, redirect or call completion callback
  useEffect(() => {
    if (userProfile && !profileLoading) {
      if (onRegistrationComplete) {
        onRegistrationComplete();
      } else {
        navigate({ to: '/' });
      }
    }
  }, [userProfile, profileLoading, navigate, onRegistrationComplete]);

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return t.nameRequired;
    }
    if (name.trim().length < 2) {
      return t.nameTooShort;
    }
    if (name.trim().length > 20) {
      return t.nameTooLong;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    const validation = validateName(playerName);
    if (validation) {
      setValidationError(validation);
      return;
    }

    try {
      await registerMutation.mutateAsync(playerName.trim());
      
      // Registration successful
      if (onRegistrationComplete) {
        onRegistrationComplete();
      } else {
        navigate({ to: '/' });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('inappropriate') || err.message?.includes('not allowed')) {
        setError(t.errorInvalidName);
      } else {
        setError(t.errorGeneral);
      }
    }
  };

  if (profileLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-cyan-500">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">{t.title}</h1>
            <p className="text-gray-300 text-lg">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                {t.nameLabel}
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setValidationError('');
                  setError('');
                }}
                placeholder={t.namePlaceholder}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                disabled={registerMutation.isPending}
                maxLength={20}
                autoFocus
              />
              {validationError && (
                <p className="mt-2 text-sm text-yellow-400">{validationError}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending || !playerName.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button shadow-lg"
            >
              {registerMutation.isPending ? t.registering : t.registerButton}
            </button>
          </form>
        </div>

        <footer className="mt-8 text-center text-gray-300 text-sm px-4 bg-black/50 backdrop-blur-sm rounded-lg py-2">
          <div>
            © 2025. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
              caffeine.ai
            </a>
          </div>
          <div className="mt-1">{t.attribution}</div>
        </footer>
      </div>
    </div>
  );
};
