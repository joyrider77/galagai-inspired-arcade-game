import { Language } from '../types/game';

export const translations = {
  de: {
    backToMenu: 'Zurück zum Menü',
    playAgain: 'Erneut spielen',
    gameOver: 'Spiel beendet!',
    score: 'Punkte',
    lives: 'Leben',
    wave: 'Welle',
    level: 'Level',
    nextLevel: 'Nächstes Level',
    bossLevel: '>>> BOSS Level! <<<',
    rank: 'Rang',
    player: 'Spieler',
    points: 'Punkte',
    difficulty: 'Schwierigkeit',
    reachedLevel: 'Stage',
    enterName: 'Dein Name für die Bestenliste',
    submitScore: 'In Bestenliste eintragen',
    submitting: 'Speichere...',
    viewHighScores: 'Bestenliste ansehen',
    refreshLeaderboard: 'Bestenliste aktualisieren',
    refreshing: 'Aktualisiere...',
    noScores: 'Noch keine Einträge in der Bestenliste',
    loading: 'Lade Bestenliste...',
    left: 'Links',
    right: 'Rechts',
    fire: 'FEUER',
    doubleFire: 'Doppelfeuer',
    shield: 'Schild',
    invincibility: 'Unverwundbar',
    rapidFire: 'Schnellfeuer',
    spreadShot: 'Streuschuss',
    magnet: 'Magnet',
    slowMotion: 'Zeitlupe',
    einfach: 'Einfach',
    mittel: 'Mittel',
    schwer: 'Schwer',
    ready: 'Bereit!',
    nameRejected: 'Dieser Name ist nicht erlaubt. Bitte wählen Sie einen anderen Namen.',
    nameError: 'Fehler beim Speichern des Namens. Bitte versuchen Sie es erneut.',
    bonusLife: '+1 Leben Bonus!',
    soundOn: '🔊 Ton an',
    soundOff: '🔇 Stumm',
    achievementUnlocked: 'Erfolg freigeschaltet!',
    loggedInAs: 'Angemeldet als',
    logout: 'Abmelden',
    loggingOut: 'Abmelden...',
  },
  en: {
    backToMenu: 'Back to Menu',
    playAgain: 'Play Again',
    gameOver: 'Game Over!',
    score: 'Score',
    lives: 'Lives',
    wave: 'Wave',
    level: 'Level',
    nextLevel: 'Next Level',
    bossLevel: '>>> BOSS Level! <<<',
    rank: 'Rank',
    player: 'Player',
    points: 'Points',
    difficulty: 'Difficulty',
    reachedLevel: 'Stage',
    enterName: 'Enter your name for leaderboard',
    submitScore: 'Submit to Leaderboard',
    submitting: 'Submitting...',
    viewHighScores: 'View High Scores',
    refreshLeaderboard: 'Refresh Leaderboard',
    refreshing: 'Refreshing...',
    noScores: 'No scores yet',
    loading: 'Loading leaderboard...',
    left: 'Left',
    right: 'Right',
    fire: 'FIRE',
    doubleFire: 'Double Fire',
    shield: 'Shield',
    invincibility: 'Invincibility',
    rapidFire: 'Rapid Fire',
    spreadShot: 'Spread Shot',
    magnet: 'Magnet',
    slowMotion: 'Slow Motion',
    einfach: 'Easy',
    mittel: 'Medium',
    schwer: 'Hard',
    ready: 'Ready!',
    nameRejected: 'This name is not allowed. Please choose a different name.',
    nameError: 'Error saving name. Please try again.',
    bonusLife: '+1 Bonus Life!',
    soundOn: '🔊 Sound On',
    soundOff: '🔇 Muted',
    achievementUnlocked: 'Achievement Unlocked!',
    loggedInAs: 'Logged in as',
    logout: 'Logout',
    loggingOut: 'Logging out...',
  }
};

export const achievementTranslations = {
  de: {
    fast_hunter: { name: 'Schneller Jäger', description: 'Besiege 15 Gegner in 8 Sekunden' },
    first_boss: { name: 'Erster Boss-Sieg', description: 'Besiege den ersten Boss-Gegner' },
    millionaire: { name: 'Millionär', description: 'Erreiche 1.000.000 Punkte' },
    boss_master: { name: 'Boss-Meister', description: 'Besiege 6 verschiedene Boss-Typen' },
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
    boss_master: { name: 'Boss Master', description: 'Defeat 6 different boss types' },
    survivor: { name: 'Survivor', description: 'Complete 10 levels without losing a life' },
    double_power: { name: 'Double Power', description: 'Activate Double Ship mode for the first time' },
    collector: { name: 'Collector', description: 'Collect 20 power-ups in a single game session' },
    precision_shooter: { name: 'Precision Shooter', description: 'Achieve 90% hit accuracy in a single level' },
    endurance_champion: { name: 'Endurance Champion', description: 'Play for 30 minutes in a single session' },
    perfectionist: { name: 'Perfectionist', description: 'Complete a level without taking any damage' },
    magnet_master: { name: 'Magnet Master', description: 'Collect 10 power-ups using magnet power-up' },
  },
};

export function getTranslation(language: Language) {
  return translations[language];
}

export function translateDifficulty(difficulty: string, language: Language): string {
  const t = translations[language];
  switch (difficulty) {
    case 'einfach':
      return language === 'de' ? 'Einfach' : 'Easy';
    case 'mittel':
      return language === 'de' ? 'Mittel' : 'Medium';
    case 'schwer':
      return language === 'de' ? 'Schwer' : 'Hard';
    default:
      return difficulty;
  }
}
