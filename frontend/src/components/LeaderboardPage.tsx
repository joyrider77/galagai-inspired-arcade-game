import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetTopScores } from '../hooks/useQueries';

type Language = 'de' | 'en';

const translations = {
  de: {
    title: 'Top 50 Bestenliste',
    backToMenu: 'Zurück zum Hauptmenü',
    rank: 'Rang',
    player: 'Spieler',
    points: 'Punkte',
    difficulty: 'Schwierigkeit',
    stage: 'Stage',
    loading: 'Lade Bestenliste...',
    noScores: 'Noch keine Einträge in der Bestenliste',
    refreshLeaderboard: 'Bestenliste aktualisieren',
    refreshing: 'Aktualisiere...',
    einfach: 'Einfach',
    mittel: 'Mittel',
    schwer: 'Schwer',
    attribution: 'durch j_marques',
  },
  en: {
    title: 'Top 50 High Scores',
    backToMenu: 'Back to Main Menu',
    rank: 'Rank',
    player: 'Player',
    points: 'Points',
    difficulty: 'Difficulty',
    stage: 'Stage',
    loading: 'Loading leaderboard...',
    noScores: 'No scores yet',
    refreshLeaderboard: 'Refresh Leaderboard',
    refreshing: 'Refreshing...',
    einfach: 'Easy',
    mittel: 'Medium',
    schwer: 'Hard',
    attribution: 'by j_marques',
  }
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  const topScoresQuery = useGetTopScores(50);
  const t = translations[language];

  const translateDifficulty = useCallback((difficultyKey: string): string => {
    switch (difficultyKey) {
      case 'einfach':
        return t.einfach;
      case 'mittel':
        return t.mittel;
      case 'schwer':
        return t.schwer;
      default:
        return difficultyKey;
    }
  }, [t]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 pb-24">
      <div className="text-center max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 tracking-wider glow drop-shadow-lg">{t.title}</h1>
        
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 mb-6 max-h-96 overflow-y-auto shadow-2xl">
          {topScoresQuery.isLoading ? (
            <p className="text-gray-300">{t.loading}</p>
          ) : topScoresQuery.data && topScoresQuery.data.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-600 font-bold text-cyan-400 text-xs sm:text-sm">
                <span className="w-8 sm:w-12">{t.rank}</span>
                <span className="flex-1 text-center">{t.player}</span>
                <span className="w-16 sm:w-20 text-center">{t.points}</span>
                <span className="w-16 sm:w-20 text-center">{t.difficulty}</span>
                <span className="w-12 sm:w-16 text-center">{t.stage}</span>
              </div>
              {topScoresQuery.data.map(([name, entry], index) => (
                <div key={`${name}-${entry.timestamp}`} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0 text-xs sm:text-sm">
                  <span className="text-yellow-400 font-bold w-8 sm:w-12">{index + 1}.</span>
                  <span className="text-cyan-400 flex-1 text-center truncate px-1" title={name}>{name}</span>
                  <span className="text-yellow-400 font-bold w-16 sm:w-20 text-center">{entry.score.toString()}</span>
                  <span className="text-orange-400 w-16 sm:w-20 text-center text-xs">
                    {translateDifficulty(entry.difficulty)}
                  </span>
                  <span className="text-green-400 w-12 sm:w-16 text-center">
                    {entry.level.toString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300">{t.noScores}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-cyan-600/90 hover:bg-cyan-500/90 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button shadow-lg"
          >
            {t.backToMenu}
          </button>
          <button
            onClick={() => topScoresQuery.refetch()}
            className="w-full bg-blue-600/90 hover:bg-blue-500/90 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-lg transition-colors arcade-button shadow-lg"
            disabled={topScoresQuery.isFetching}
          >
            {topScoresQuery.isFetching ? t.refreshing : t.refreshLeaderboard}
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
};

export default LeaderboardPage;

