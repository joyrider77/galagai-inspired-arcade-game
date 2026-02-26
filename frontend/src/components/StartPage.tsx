import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

type Language = 'de' | 'en';
type Difficulty = 'einfach' | 'mittel' | 'schwer';

interface StartPageProps {
  onStartGame: () => void;
  language: Language;
  difficulty: Difficulty;
  isMuted: boolean;
  onToggleMute: () => void;
  onChangeLanguage: (lang: Language) => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  isGameInitializing: boolean;
}

const translations = {
  de: {
    title: 'GALAGAI',
    currentDifficulty: 'Aktuelle Schwierigkeit',
    einfach: 'Einfach',
    mittel: 'Mittel',
    schwer: 'Schwer',
    soundOn: 'Ton an',
    soundOff: 'Stumm',
    attribution: 'durch j_marques',
    loggedInAs: 'Angemeldet als',
    logout: 'Abmelden',
    loggingOut: 'Abmelden...',
  },
  en: {
    title: 'GALAGAI',
    currentDifficulty: 'Current Difficulty',
    einfach: 'Easy',
    mittel: 'Medium',
    schwer: 'Hard',
    soundOn: 'Sound On',
    soundOff: 'Muted',
    attribution: 'by j_marques',
    loggedInAs: 'Logged in as',
    logout: 'Logout',
    loggingOut: 'Logging out...',
  }
};

const StartPage: React.FC<StartPageProps> = ({
  onStartGame,
  language,
  difficulty,
  isMuted,
  onToggleMute,
  onChangeLanguage,
  onChangeDifficulty,
  isGameInitializing
}) => {
  const navigate = useNavigate();
  const t = translations[language];
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasNewAchievements, setHasNewAchievements] = useState(false);
  
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const userName = userProfile?.name;

  // Check for new achievements on mount and when returning to start page
  useEffect(() => {
    const checkNewAchievements = () => {
      try {
        const newAchievementsFlag = localStorage.getItem('galagai_new_achievements');
        setHasNewAchievements(newAchievementsFlag === 'true');
      } catch (error) {
        console.error('Error checking new achievements:', error);
      }
    };

    checkNewAchievements();

    // Check periodically in case the flag is set from another component
    const interval = setInterval(checkNewAchievements, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await clear();
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [clear, queryClient]);

  const handleLanguageSelect = useCallback((lang: Language) => {
    onChangeLanguage(lang);
    setShowLanguageMenu(false);
  }, [onChangeLanguage]);

  const handleDifficultySelect = useCallback((diff: Difficulty) => {
    onChangeDifficulty(diff);
    setShowDifficultyMenu(false);
  }, [onChangeDifficulty]);

  const handleAchievementsClick = useCallback(() => {
    // Clear the new achievements flag when user visits achievements page
    try {
      localStorage.removeItem('galagai_new_achievements');
      setHasNewAchievements(false);
    } catch (error) {
      console.error('Error clearing new achievements flag:', error);
    }
    navigate({ to: '/achievements' });
  }, [navigate]);

  const handleStartGame = useCallback(() => {
    // Clear the new achievements flag when starting a new game
    try {
      localStorage.removeItem('galagai_new_achievements');
      setHasNewAchievements(false);
    } catch (error) {
      console.error('Error clearing new achievements flag:', error);
    }
    onStartGame();
  }, [onStartGame]);

  const getDifficultyDisplay = () => {
    switch (difficulty) {
      case 'einfach':
        return `🟢 ${t.einfach}`;
      case 'mittel':
        return `🟡 ${t.mittel}`;
      case 'schwer':
        return `🔴 ${t.schwer}`;
    }
  };

  if (showLanguageMenu) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8 tracking-wider glow">{t.title}</h1>
          <div className="space-y-4">
            <button
              onClick={() => handleLanguageSelect('de')}
              className={`w-full ${language === 'de' ? 'bg-cyan-600/90' : 'bg-gray-600/80'} hover:bg-cyan-500/90 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button flex items-center justify-center`}
            >
              <span className="text-2xl mr-2">🇩🇪</span>
              Deutsch
            </button>
            <button
              onClick={() => handleLanguageSelect('en')}
              className={`w-full ${language === 'en' ? 'bg-cyan-600/90' : 'bg-gray-600/80'} hover:bg-cyan-500/90 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button flex items-center justify-center`}
            >
              <span className="text-2xl mr-2">🇺🇸</span>
              English
            </button>
            <button
              onClick={() => setShowLanguageMenu(false)}
              className="w-full bg-gray-600/80 hover:bg-gray-500/80 text-white font-bold py-2 px-4 rounded-lg transition-colors arcade-button"
            >
              {language === 'de' ? 'Zurück' : 'Back'}
            </button>
          </div>
        </div>
        <footer className="absolute bottom-4 text-center text-gray-300 text-sm px-4 bg-black/50 backdrop-blur-sm rounded-lg py-2">
          <div>© 2025. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
              caffeine.ai
            </a>
          </div>
          <div className="mt-1">{t.attribution}</div>
        </footer>
      </div>
    );
  }

  if (showDifficultyMenu) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8 tracking-wider glow">{t.title}</h1>
          <div className="space-y-4">
            <button
              onClick={() => handleDifficultySelect('einfach')}
              className={`w-full ${difficulty === 'einfach' ? 'bg-green-600/90' : 'bg-gray-600/80'} hover:bg-green-500/90 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button flex items-center justify-center`}
            >
              <span className="text-2xl mr-2">🟢</span>
              {t.einfach}
            </button>
            <button
              onClick={() => handleDifficultySelect('mittel')}
              className={`w-full ${difficulty === 'mittel' ? 'bg-yellow-600/90' : 'bg-gray-600/80'} hover:bg-yellow-500/90 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button flex items-center justify-center`}
            >
              <span className="text-2xl mr-2">🟡</span>
              {t.mittel}
            </button>
            <button
              onClick={() => handleDifficultySelect('schwer')}
              className={`w-full ${difficulty === 'schwer' ? 'bg-red-600/90' : 'bg-gray-600/80'} hover:bg-red-500/90 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button flex items-center justify-center`}
            >
              <span className="text-2xl mr-2">🔴</span>
              {t.schwer}
            </button>
            <button
              onClick={() => setShowDifficultyMenu(false)}
              className="w-full bg-gray-600/80 hover:bg-gray-500/80 text-white font-bold py-2 px-4 rounded-lg transition-colors arcade-button"
            >
              {language === 'de' ? 'Zurück' : 'Back'}
            </button>
          </div>
        </div>
        <footer className="absolute bottom-4 text-center text-gray-300 text-sm px-4 bg-black/50 backdrop-blur-sm rounded-lg py-2">
          <div>© 2025. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
              caffeine.ai
            </a>
          </div>
          <div className="mt-1">{t.attribution}</div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 pb-20">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-cyan-400 mb-6 tracking-wider glow drop-shadow-lg">{t.title}</h1>
        
        {/* User info and logout section - only shown when authenticated */}
        {isAuthenticated && userName && (
          <div className="mb-4 p-3 bg-gradient-to-r from-cyan-900/70 to-blue-900/70 backdrop-blur-sm rounded-lg shadow-lg border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 text-sm font-semibold">{t.loggedInAs}:</span>
                <span className="text-white font-bold text-base">{userName}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600/80 hover:bg-red-500/90 disabled:bg-gray-600/50 text-white font-bold py-1 px-3 rounded text-sm transition-colors arcade-button"
              >
                {isLoggingOut ? t.loggingOut : t.logout}
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-6 p-3 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-lg">
          <p className="text-xs text-gray-300 mb-1">{t.currentDifficulty}:</p>
          <p className="text-base font-bold text-yellow-400">{getDifficultyDisplay()}</p>
        </div>
        
        {/* Compact icon-based tile grid with semi-transparent backgrounds */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Play tile */}
          <button
            onClick={handleStartGame}
            disabled={isGameInitializing}
            className={`${isGameInitializing ? 'bg-gray-800/70' : 'bg-black/60 hover:bg-gray-900/70'} backdrop-blur-sm border-2 border-cyan-400 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg`}
            title={language === 'de' ? 'Spiel starten' : 'Start Game'}
          >
            <img src="/assets/generated/play-icon.dim_64x64.png" alt="Play" className="w-12 h-12 mb-1" />
            <span className="text-xs text-cyan-400">{language === 'de' ? 'Spielen' : 'Play'}</span>
          </button>

          {/* Leaderboard tile */}
          <button
            onClick={() => navigate({ to: '/leaderboard' })}
            disabled={isGameInitializing}
            className="bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 border-yellow-400 disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg"
            title={language === 'de' ? 'Bestenliste' : 'Leaderboard'}
          >
            <img src="/assets/generated/trophy-icon.dim_64x64.png" alt="Trophy" className="w-12 h-12 mb-1" />
            <span className="text-xs text-yellow-400">{language === 'de' ? 'Rangliste' : 'Scores'}</span>
          </button>

          {/* Features tile */}
          <button
            onClick={() => navigate({ to: '/features' })}
            disabled={isGameInitializing}
            className="bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 border-blue-400 disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg"
            title={language === 'de' ? 'Features' : 'Features'}
          >
            <img src="/assets/generated/info-icon.dim_64x64.png" alt="Info" className="w-12 h-12 mb-1" />
            <span className="text-xs text-blue-400">{language === 'de' ? 'Info' : 'Info'}</span>
          </button>

          {/* Achievements tile with animation */}
          <button
            onClick={handleAchievementsClick}
            disabled={isGameInitializing}
            className={`bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 border-pink-400 disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg relative ${hasNewAchievements ? 'achievement-pulse' : ''}`}
            title={language === 'de' ? 'Erfolge' : 'Achievements'}
          >
            {hasNewAchievements && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-ping" />
            )}
            {hasNewAchievements && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full" />
            )}
            <img src="/assets/generated/achievement-badge-icon.dim_64x64.png" alt="Achievements" className="w-12 h-12 mb-1" />
            <span className="text-xs text-pink-400">{language === 'de' ? 'Erfolge' : 'Achieve'}</span>
          </button>

          {/* Designs tile */}
          <button
            onClick={() => navigate({ to: '/designs' })}
            disabled={isGameInitializing}
            className="bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 border-purple-400 disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg"
            title={language === 'de' ? 'Designs' : 'Designs'}
          >
            <span className="text-3xl mb-1">🚀</span>
            <span className="text-xs text-purple-400">{language === 'de' ? 'Hangar' : 'Hangar'}</span>
          </button>

          {/* Difficulty tile */}
          <button
            onClick={() => setShowDifficultyMenu(true)}
            disabled={isGameInitializing}
            className="bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 border-orange-400 disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg"
            title={language === 'de' ? 'Schwierigkeit' : 'Difficulty'}
          >
            <img src="/assets/generated/settings-icon.dim_64x64.png" alt="Settings" className="w-12 h-12 mb-1" />
            <span className="text-xs text-orange-400">{language === 'de' ? 'Level' : 'Level'}</span>
          </button>

          {/* Language tile */}
          <button
            onClick={() => setShowLanguageMenu(true)}
            disabled={isGameInitializing}
            className="bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 border-teal-400 disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg"
            title={language === 'de' ? 'Sprache' : 'Language'}
          >
            <img src="/assets/generated/globe-icon.dim_64x64.png" alt="Language" className="w-12 h-12 mb-1" />
            <span className="text-xs text-teal-400">{language === 'de' ? 'DE' : 'EN'}</span>
          </button>

          {/* Sound tile */}
          <button
            onClick={onToggleMute}
            disabled={isGameInitializing}
            className={`bg-black/60 hover:bg-gray-900/70 backdrop-blur-sm border-2 ${isMuted ? 'border-red-400' : 'border-green-400'} disabled:bg-gray-800/70 disabled:border-gray-600 text-white font-bold p-4 rounded-lg transition-colors arcade-button flex flex-col items-center justify-center aspect-square shadow-lg`}
            title={isMuted ? (language === 'de' ? 'Stumm' : 'Muted') : (language === 'de' ? 'Ton an' : 'Sound On')}
          >
            <span className="text-3xl mb-1">{isMuted ? '🔇' : '🔊'}</span>
            <span className={`text-xs ${isMuted ? 'text-red-400' : 'text-green-400'}`}>{isMuted ? (language === 'de' ? 'Aus' : 'Off') : (language === 'de' ? 'An' : 'On')}</span>
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-200 space-y-1 bg-black/50 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p>{language === 'de' ? '← → Pfeiltasten oder Touch-Buttons zum Bewegen' : '← → Arrow keys or touch buttons to move'}</p>
          <p>{language === 'de' ? 'Leertaste oder Feuer-Button zum Schießen' : 'Spacebar or Fire button to shoot'}</p>
        </div>
      </div>
      
      <footer className="absolute bottom-4 text-center text-gray-300 text-sm px-4 bg-black/50 backdrop-blur-sm rounded-lg py-2">
        <div>© 2025. Built with ❤️ using{' '}
          <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
            caffeine.ai
          </a>
        </div>
        <div className="mt-1">{t.attribution}</div>
      </footer>
    </div>
  );
};

export default StartPage;
