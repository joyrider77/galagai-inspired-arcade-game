import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetDesigns, useSelectDesign, useUnlockDesign, useCheckAndUnlockDesigns } from '../hooks/useQueries';
import { AccessControl } from './AccessControl';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

type Language = 'de' | 'en';

const translations = {
  de: {
    title: 'Raumschiff-Hangar',
    backToMenu: 'Zurück zum Menü',
    selectDesign: 'Auswählen',
    selected: 'Ausgewählt',
    locked: 'Gesperrt',
    unlockCondition: 'Freischaltbedingung',
    loading: 'Lade Designs...',
    noDesigns: 'Keine Designs verfügbar',
    attribution: 'durch j_marques',
    preview: 'Vorschau',
    currentDesign: 'Aktuelles Design',
    checkingProgress: 'Prüfe Fortschritt...',
  },
  en: {
    title: 'Spaceship Hangar',
    backToMenu: 'Back to Menu',
    selectDesign: 'Select',
    selected: 'Selected',
    locked: 'Locked',
    unlockCondition: 'Unlock Condition',
    loading: 'Loading designs...',
    noDesigns: 'No designs available',
    attribution: 'by j_marques',
    preview: 'Preview',
    currentDesign: 'Current Design',
    checkingProgress: 'Checking progress...',
  }
};

const DesignsPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  // Use principal-based player name for registered users
  const playerName = identity?.getPrincipal().toString() || 'Player';

  const t = translations[language];
  const designsQuery = useGetDesigns(playerName);
  const selectDesignMutation = useSelectDesign();
  const unlockDesignMutation = useUnlockDesign();
  const checkAndUnlockMutation = useCheckAndUnlockDesigns();

  // Check and unlock designs based on game progress when page loads
  useEffect(() => {
    const checkUnlocks = async () => {
      if (!designsQuery.data) return;

      const highScore = parseInt(localStorage.getItem('galaga-high-score') || '0');
      const maxLevel = parseInt(localStorage.getItem('galaga-max-level') || '0');

      // First, call backend to check and unlock based on backend data
      try {
        await checkAndUnlockMutation.mutateAsync(playerName);
      } catch (error) {
        console.error('Failed to check backend unlocks:', error);
      }

      // Then check local progress and unlock designs that meet conditions
      const unlocksNeeded: string[] = [];

      designsQuery.data.unlockedDesigns.forEach((design) => {
        if (!design.unlocked) {
          let shouldUnlock = false;

          // Check unlock conditions based on design ID with unique conditions
          switch (design.id) {
            case 'red':
              shouldUnlock = highScore >= 250000;
              break;
            case 'blue':
              shouldUnlock = maxLevel >= 5;
              break;
            case 'green':
              shouldUnlock = maxLevel >= 15;
              break;
            case 'yellow':
              shouldUnlock = highScore >= 750000;
              break;
            case 'f18':
              shouldUnlock = highScore >= 500000;
              break;
            case 'energy_trail':
              shouldUnlock = maxLevel >= 10;
              break;
            case 'plasma':
              shouldUnlock = maxLevel >= 20;
              break;
          }

          if (shouldUnlock) {
            unlocksNeeded.push(design.id);
          }
        }
      });

      // Unlock all designs that meet conditions
      for (const designId of unlocksNeeded) {
        try {
          await unlockDesignMutation.mutateAsync({ playerName, designId });
        } catch (error) {
          console.error(`Failed to unlock design ${designId}:`, error);
        }
      }

      // Refetch to get updated data
      if (unlocksNeeded.length > 0) {
        designsQuery.refetch();
      }
    };

    checkUnlocks();
  }, [playerName]); // Only run when playerName changes or on mount

  const handleSelectDesign = async (designId: string) => {
    try {
      await selectDesignMutation.mutateAsync({ playerName, designId });
      designsQuery.refetch();
    } catch (error) {
      console.error('Failed to select design:', error);
    }
  };

  const renderDesignPreview = (design: any) => {
    const colors: Record<string, string> = {
      white: '#ffffff',
      red: '#ff0000',
      blue: '#0080ff',
      green: '#00ff00',
      yellow: '#ffff00',
    };

    const color = colors[design.color] || '#ffffff';

    return (
      <div className="w-full h-32 bg-gray-900/50 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-800/20 to-gray-900/40"></div>
        <svg width="80" height="60" viewBox="0 0 30 20" className="relative z-10">
          {design.shape === 'f18' ? (
            <>
              <rect x="12" y="6" width="6" height="14" fill={color} />
              <polygon points="15,0 12,6 18,6" fill={color} />
              <rect x="5" y="8" width="5" height="8" fill={color} />
              <rect x="20" y="8" width="5" height="8" fill={color} />
              <rect x="6" y="16" width="2" height="3" fill="#ffffff" />
              <rect x="14" y="16" width="2" height="3" fill="#ffffff" />
              <rect x="22" y="16" width="2" height="3" fill="#ffffff" />
            </>
          ) : (
            <>
              <rect x="12" y="6" width="6" height="14" fill={color} />
              <polygon points="15,0 12,6 18,6" fill={color} />
              <rect x="0" y="8" width="7" height="8" fill={color} />
              <rect x="23" y="8" width="7" height="8" fill={color} />
              <rect x="6" y="16" width="2" height="3" fill="#ffffff" />
              <rect x="14" y="16" width="2" height="3" fill="#ffffff" />
              <rect x="22" y="16" width="2" height="3" fill="#ffffff" />
            </>
          )}
          {design.effects === 'energy_trail' && (
            <>
              <circle cx="9" cy="18" r="2" fill={color} opacity="0.6" />
              <circle cx="15" cy="18" r="2" fill={color} opacity="0.6" />
              <circle cx="21" cy="18" r="2" fill={color} opacity="0.6" />
            </>
          )}
          {design.effects === 'plasma' && (
            <>
              <circle cx="15" cy="10" r="3" fill="#00ffff" opacity="0.4" />
              <circle cx="15" cy="10" r="2" fill="#ffffff" opacity="0.6" />
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-screen text-white flex flex-col items-center p-4 pb-20">
        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold text-purple-400 mb-6 text-center glow">{t.title}</h1>

          {checkAndUnlockMutation.isPending && (
            <div className="mb-4 p-3 bg-blue-900/70 backdrop-blur-sm rounded-lg text-center">
              <p className="text-sm text-blue-300">{t.checkingProgress}</p>
            </div>
          )}

          {designsQuery.isLoading ? (
            <div className="text-center text-gray-400 py-8">{t.loading}</div>
          ) : designsQuery.data ? (
            <>
              <div className="mb-6 p-4 bg-gray-800/70 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-300 mb-2">{t.currentDesign}:</p>
                <p className="text-lg font-bold text-purple-400">
                  {designsQuery.data.unlockedDesigns.find(d => d.id === designsQuery.data?.selectedDesign)?.name || 'Klassisch'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {designsQuery.data.unlockedDesigns.map((design) => {
                  const isSelected = design.id === designsQuery.data?.selectedDesign;
                  const isUnlocked = design.unlocked;

                  return (
                    <div
                      key={design.id}
                      className={`bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border-2 ${
                        isSelected
                          ? 'border-purple-400'
                          : isUnlocked
                          ? 'border-gray-600'
                          : 'border-gray-700'
                      } ${!isUnlocked ? 'opacity-60' : ''}`}
                    >
                      {renderDesignPreview(design)}

                      <div className="mt-4">
                        <h3 className="text-lg font-bold text-cyan-400 mb-1">{design.name}</h3>
                        <p className="text-sm text-gray-300 mb-3">{design.description}</p>

                        {!isUnlocked && (
                          <div className="mb-3 p-2 bg-gray-800/50 rounded">
                            <p className="text-xs text-yellow-400">
                              {t.unlockCondition}: {design.unlockCondition}
                            </p>
                          </div>
                        )}

                        {isUnlocked && (
                          <button
                            onClick={() => handleSelectDesign(design.id)}
                            disabled={isSelected || selectDesignMutation.isPending}
                            className={`w-full ${
                              isSelected
                                ? 'bg-purple-600 cursor-default'
                                : 'bg-cyan-600 hover:bg-cyan-500'
                            } text-white font-bold py-2 px-4 rounded-lg transition-colors arcade-button`}
                          >
                            {isSelected ? t.selected : t.selectDesign}
                          </button>
                        )}

                        {!isUnlocked && (
                          <div className="w-full bg-gray-700 text-gray-400 font-bold py-2 px-4 rounded-lg text-center">
                            🔒 {t.locked}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">{t.noDesigns}</div>
          )}

          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors arcade-button mb-4"
          >
            {t.backToMenu}
          </button>
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

const DesignsPage: React.FC = () => {
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  return (
    <AccessControl language={language}>
      <DesignsPageContent />
    </AccessControl>
  );
};

export default DesignsPage;
