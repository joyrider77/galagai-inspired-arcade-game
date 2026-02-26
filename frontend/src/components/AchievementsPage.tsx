import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAchievements, useGetCallerUserProfile } from '../hooks/useQueries';
import { AccessControl } from './AccessControl';

type Language = 'de' | 'en';

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  timestamp?: bigint;
  progress: bigint;
  target: bigint;
  category: string;
  rarity: string;
}

const achievementTranslations = {
  de: {
    fast_hunter: { name: 'Schneller Jäger', description: 'Besiege 15 Gegner in 8 Sekunden' },
    first_boss: { name: 'Erster Boss-Sieg', description: 'Besiege den ersten Boss-Gegner' },
    millionaire: { name: 'Millionär', description: 'Erreiche 1.000.000 Punkte' },
    boss_master: { name: 'Boss-Meister', description: 'Besiege 5 verschiedene Boss-Typen' },
    survivor: { name: 'Überlebenskünstler', description: 'Beende 10 Level ohne ein Leben zu verlieren' },
    double_power: { name: 'Doppel-Power', description: 'Aktiviere Doppel-Raumschiff-Modus zum ersten Mal' },
    collector: { name: 'Sammler', description: 'Sammle 20 Power-Ups in einer Spielsitzung' },
    precision_shooter: { name: 'Präzisionsschütze', description: 'Erreiche 90% Trefferquote in einem Level' },
    endurance_champion: { name: 'Ausdauer-Champion', description: 'Spiele 30 Minuten in einer Sitzung' },
    perfectionist: { name: 'Perfektionist', description: 'Beende ein Level ohne Schaden zu nehmen' },
    magnet_master: { name: 'Magnet-Meister', description: 'Sammle 10 Power-Ups mit Magnet-Power-Up' },
  },
  en: {
    fast_hunter: { name: 'Fast Hunter', description: 'Defeat 15 enemies within 8 seconds' },
    first_boss: { name: 'First Boss Victory', description: 'Defeat the first boss enemy' },
    millionaire: { name: 'Millionaire', description: 'Reach 1,000,000 points' },
    boss_master: { name: 'Boss Master', description: 'Defeat 5 different boss types' },
    survivor: { name: 'Survivor', description: 'Complete 10 levels without losing a life' },
    double_power: { name: 'Double Power', description: 'Activate Double Ship mode for the first time' },
    collector: { name: 'Collector', description: 'Collect 20 power-ups in a single game session' },
    precision_shooter: { name: 'Precision Shooter', description: 'Achieve 90% hit accuracy in a single level' },
    endurance_champion: { name: 'Endurance Champion', description: 'Play for 30 minutes in a single session' },
    perfectionist: { name: 'Perfectionist', description: 'Complete a level without taking any damage' },
    magnet_master: { name: 'Magnet Master', description: 'Collect 10 power-ups with Magnet power-up' },
  },
};

const categoryTranslations = {
  de: {
    combat: 'Kampf',
    boss: 'Boss-Kämpfe',
    score: 'Punkte',
    survival: 'Überleben',
    powerup: 'Power-Ups',
    time: 'Ausdauer',
  },
  en: {
    combat: 'Combat',
    boss: 'Boss Battles',
    score: 'Score',
    survival: 'Survival',
    powerup: 'Power-Ups',
    time: 'Endurance',
  },
};

const rarityColors = {
  common: 'text-gray-400 border-gray-500',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
};

const AchievementsPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { data: userProfile } = useGetCallerUserProfile();
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });
  const [sessionAchievements, setSessionAchievements] = useState<string[]>([]);

  // Use the actual user profile name for fetching achievements
  const playerName = userProfile?.name || '';

  const { data: playerAchievements, isLoading, refetch } = useGetAchievements(playerName);

  // Load session achievements from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('galaga-session-achievements');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessionAchievements(parsed);
      } catch (error) {
        console.error('Failed to parse session achievements:', error);
      }
    }
  }, []);

  // Refetch achievements when component mounts to ensure fresh data
  useEffect(() => {
    if (playerName) {
      refetch();
    }
  }, [playerName, refetch]);

  const t = {
    de: {
      title: 'GALAGAI - Erfolge',
      backToMenu: 'Zurück zum Menü',
      loading: 'Lade Erfolge...',
      noAchievements: 'Noch keine Erfolge freigeschaltet',
      unlocked: 'Freigeschaltet',
      locked: 'Gesperrt',
      progress: 'Fortschritt',
      unlockedOn: 'Freigeschaltet am',
      completion: 'Abschluss',
      categories: 'Kategorien',
      all: 'Alle',
      rarity: 'Seltenheit',
      common: 'Gewöhnlich',
      rare: 'Selten',
      epic: 'Episch',
      attribution: 'durch j_marques',
      newlyUnlocked: 'Neu freigeschaltet!',
    },
    en: {
      title: 'GALAGAI - Achievements',
      backToMenu: 'Back to Menu',
      loading: 'Loading achievements...',
      noAchievements: 'No achievements unlocked yet',
      unlocked: 'Unlocked',
      locked: 'Locked',
      progress: 'Progress',
      unlockedOn: 'Unlocked on',
      completion: 'Completion',
      categories: 'Categories',
      all: 'All',
      rarity: 'Rarity',
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      attribution: 'by j_marques',
      newlyUnlocked: 'Newly Unlocked!',
    },
  };

  const translations = t[language];
  const achievementTexts = achievementTranslations[language];
  const categoryTexts = categoryTranslations[language];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const achievements = playerAchievements?.achievements || [];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
  };

  const getAchievementIcon = (category: string, rarity: string) => {
    const iconMap: Record<string, string> = {
      combat: '/assets/generated/combat-achievement-icon.dim_64x64.png',
      boss: '/assets/generated/boss-achievement-icon.dim_64x64.png',
      score: '/assets/generated/score-achievement-icon.dim_64x64.png',
      survival: '/assets/generated/special-achievement-icon.dim_64x64.png',
      powerup: '/assets/generated/special-achievement-icon.dim_64x64.png',
      time: '/assets/generated/special-achievement-icon.dim_64x64.png',
    };
    return iconMap[category] || '/assets/generated/achievement-badge-icon.dim_64x64.png';
  };

  const isNewlyUnlocked = (achievementId: string) => {
    return sessionAchievements.includes(achievementId);
  };

  if (!playerName) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden">
      <div className="min-h-screen text-white p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-cyan-400 mb-4 tracking-wider glow">{translations.title}</h1>
            
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 mb-4 shadow-lg">
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                {unlockedCount} / {totalCount}
              </div>
              <div className="text-sm text-gray-300 mb-2">{translations.completion}: {completionPercentage}%</div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'
                  }`}
                >
                  {cat === 'all' ? translations.all : categoryTexts[cat as keyof typeof categoryTexts] || cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-300 py-8">{translations.loading}</div>
          ) : filteredAchievements.length === 0 ? (
            <div className="text-center text-gray-300 py-8">{translations.noAchievements}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {filteredAchievements.map((achievement) => {
                const achievementText = achievementTexts[achievement.id as keyof typeof achievementTexts];
                const progressPercent = Number(achievement.progress) / Number(achievement.target) * 100;
                const isNew = isNewlyUnlocked(achievement.id);
                
                return (
                  <div
                    key={achievement.id}
                    className={`bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border-2 ${
                      achievement.unlocked 
                        ? rarityColors[achievement.rarity as keyof typeof rarityColors] || 'border-gray-500'
                        : 'border-gray-700 opacity-60'
                    } shadow-lg transition-all hover:scale-105 ${isNew ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}`}
                  >
                    {isNew && achievement.unlocked && (
                      <div className="mb-2 text-center">
                        <span className="inline-block bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded animate-pulse">
                          {translations.newlyUnlocked}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 ${achievement.unlocked ? '' : 'opacity-40 grayscale'}`}>
                        <img 
                          src={getAchievementIcon(achievement.category, achievement.rarity)} 
                          alt={achievementText?.name || achievement.name}
                          className="w-16 h-16"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg mb-1 ${
                          achievement.unlocked 
                            ? rarityColors[achievement.rarity as keyof typeof rarityColors]?.split(' ')[0] || 'text-white'
                            : 'text-gray-400'
                        }`}>
                          {achievementText?.name || achievement.name}
                        </h3>
                        <p className="text-sm text-gray-300 mb-2">
                          {achievementText?.description || achievement.description}
                        </p>
                        
                        {!achievement.unlocked && Number(achievement.target) > 1 && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{translations.progress}</span>
                              <span>{Number(achievement.progress)} / {Number(achievement.target)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-cyan-500 h-full transition-all duration-300"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            achievement.unlocked 
                              ? 'bg-green-600/50 text-green-200'
                              : 'bg-gray-700/50 text-gray-400'
                          }`}>
                            {achievement.unlocked ? translations.unlocked : translations.locked}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-700/50 text-gray-300">
                            {categoryTexts[achievement.category as keyof typeof categoryTexts] || achievement.category}
                          </span>
                        </div>
                        
                        {achievement.unlocked && achievement.timestamp && (
                          <div className="text-xs text-gray-400 mt-2">
                            {translations.unlockedOn}: {formatDate(achievement.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mb-6">
            <button
              onClick={() => navigate({ to: '/' })}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors arcade-button shadow-lg"
            >
              {translations.backToMenu}
            </button>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 text-center text-gray-300 text-sm px-4 py-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg py-2 inline-block pointer-events-auto">
          <div>© 2025. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
              caffeine.ai
            </a>
          </div>
          <div className="mt-1">{translations.attribution}</div>
        </div>
      </footer>
    </div>
  );
};

const AchievementsPage: React.FC = () => {
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  return (
    <AccessControl language={language}>
      <AchievementsPageContent />
    </AccessControl>
  );
};

export default AchievementsPage;
