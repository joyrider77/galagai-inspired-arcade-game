import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameQueries, useGetTopScores, useUpdateAchievement, useUpdateBossMasterAchievement, useUpdateMagnetMasterAchievement, useGetAchievements, useGetCallerUserProfile } from '../hooks/useQueries';
import { AudioManager } from '../utils/audio';
import { VibrationManager } from '../utils/vibration';
import { AchievementTracker } from '../utils/achievementTracker';
import { achievementTranslations } from '../utils/translations';
import { 
  Player, Enemy, Projectile, PowerUp, Explosion, PowerUpEffect, 
  BackgroundObject, PointDisplay, BorderStar, AchievementNotification,
  GameState, Language, Difficulty
} from '../types/game';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, PROJECTILE_SPEED,
  POWERUP_LIFETIME, POWERUP_FALL_SPEED, DOUBLE_FIRE_DURATION, SHIELD_DURATION,
  PLAYER_EXPLOSION_FRAMES, RESPAWN_DELAY, LEVEL_TRANSITION_FADE_OUT_DURATION,
  LEVEL_TRANSITION_MESSAGE_DURATION, LEVEL_TRANSITION_FADE_IN_DURATION,
  LEVEL_TRANSITION_DELAY, POINT_DISPLAY_DURATION, OUTRO_DURATION,
  INTRO_EXTENSION_DURATION, ACHIEVEMENT_NOTIFICATION_DURATION,
  DIFFICULTY_SETTINGS, MAGNET_DURATION, MAGNET_RANGE
} from '../constants/game';

interface GalagaGameProps {
  onBackToMenu: () => void;
  initialMuted?: boolean;
}

interface GameStateRef {
  player: Player;
  enemies: Enemy[];
  playerProjectiles: Projectile[];
  enemyProjectiles: Projectile[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  powerUpEffects: PowerUpEffect[];
  backgroundObjects: BackgroundObject[];
  pointDisplays: PointDisplay[];
  achievementNotifications: AchievementNotification[];
  score: number;
  wave: number;
  level: number;
  gameRunning: boolean;
  levelTransitionStartTime: number;
  levelTransitionPhase: 'fadeOut' | 'message' | 'fadeIn' | 'delay' | 'complete';
  fadeAlpha: number;
  isInLevelTransition: boolean;
  waitingForExplosions: boolean;
  introStartTime: number;
  isInIntro: boolean;
  introDuration: number;
  stageFlagStartTime: number;
  isInStageFlag: boolean;
  stageFlagDuration: number;
  outroStartTime: number;
  isInOutro: boolean;
  showBonusLifeMessage: boolean;
  bonusLifeMessageStartTime: number;
  levelDamageTaken: boolean;
  levelShotsFired: number;
  levelHits: number;
}

const translations = {
  de: {
    backToMenu: 'Zurück zum Menü',
    playAgain: 'Erneut spielen',
    gameOver: 'Spiel beendet!',
    score: 'Punkte',
    lives: 'Leben',
    level: 'Level',
    nextLevel: 'Nächstes Level',
    bossLevel: '>>> BOSS Level! <<<',
    rank: 'Rang',
    player: 'Spieler',
    points: 'Punkte',
    difficulty: 'Schwierigkeit',
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
    magnet: 'Magnet',
    einfach: 'Einfach',
    mittel: 'Mittel',
    schwer: 'Schwer',
    ready: 'Bereit!',
    nameRejected: 'Dieser Name ist nicht erlaubt. Bitte wählen Sie einen anderen Namen.',
    nameError: 'Fehler beim Speichern des Namens. Bitte versuchen Sie es erneut.',
    bonusLife: '+1 Leben Bonus!',
    soundOn: '🔊 Ton an',
    soundOff: '🔇 Stumm',
  },
  en: {
    backToMenu: 'Back to Menu',
    playAgain: 'Play Again',
    gameOver: 'Game Over!',
    score: 'Score',
    lives: 'Lives',
    level: 'Level',
    nextLevel: 'Next Level',
    bossLevel: '>>> BOSS Level! <<<',
    rank: 'Rank',
    player: 'Player',
    points: 'Points',
    difficulty: 'Difficulty',
    enterName: 'Your name for the leaderboard',
    submitScore: 'Submit to Leaderboard',
    submitting: 'Submitting...',
    viewHighScores: 'View High Scores',
    refreshLeaderboard: 'Refresh Leaderboard',
    refreshing: 'Refreshing...',
    noScores: 'No entries in the leaderboard yet',
    loading: 'Loading leaderboard...',
    left: 'Left',
    right: 'Right',
    fire: 'FIRE',
    doubleFire: 'Double Fire',
    shield: 'Shield',
    magnet: 'Magnet',
    einfach: 'Easy',
    mittel: 'Medium',
    schwer: 'Hard',
    ready: 'Ready!',
    nameRejected: 'This name is not allowed. Please choose another name.',
    nameError: 'Error saving name. Please try again.',
    bonusLife: '+1 Life Bonus!',
    soundOn: '🔊 Sound On',
    soundOff: '🔇 Muted',
  }
};

const GalagaGame: React.FC<GalagaGameProps> = ({ onBackToMenu, initialMuted = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager());
  const vibrationManagerRef = useRef<VibrationManager>(new VibrationManager());
  const achievementTrackerRef = useRef<AchievementTracker>(new AchievementTracker());
  const borderStarsRef = useRef<BorderStar[]>([]);
  const lastStarUpdateRef = useRef<number>(0);
  const unlockedAchievementsRef = useRef<Set<string>>(new Set());
  
  const gameStateRef = useRef<GameStateRef>({
    player: {
      x: CANVAS_WIDTH / 2 - 15,
      y: CANVAS_HEIGHT - 40,
      width: 30,
      height: 20,
      active: true,
      lives: 3,
      isExploding: false,
      explosionFrame: 0,
      respawnTimer: 0
    },
    enemies: [],
    playerProjectiles: [],
    enemyProjectiles: [],
    powerUps: [],
    explosions: [],
    powerUpEffects: [],
    backgroundObjects: [],
    pointDisplays: [],
    achievementNotifications: [],
    score: 0,
    wave: 1,
    level: 1,
    gameRunning: false,
    levelTransitionStartTime: 0,
    levelTransitionPhase: 'complete',
    fadeAlpha: 0,
    isInLevelTransition: false,
    waitingForExplosions: false,
    introStartTime: 0,
    isInIntro: false,
    introDuration: 3000,
    stageFlagStartTime: 0,
    isInStageFlag: false,
    stageFlagDuration: 3000,
    outroStartTime: 0,
    isInOutro: false,
    showBonusLifeMessage: false,
    bonusLifeMessageStartTime: 0,
    levelDamageTaken: false,
    levelShotsFired: 0,
    levelHits: 0,
  });

  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  const [difficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('galaga-difficulty');
    return (saved as Difficulty) || 'einfach';
  });

  // Get player name from UserProfile
  const { data: userProfile } = useGetCallerUserProfile();
  const playerName = userProfile?.name || 'Player';

  const [gameState, setGameState] = useState<GameState>('intro');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [nameInputValue, setNameInputValue] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameError, setNameError] = useState<string>('');
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [activeNotifications, setActiveNotifications] = useState<AchievementNotification[]>([]);
  
  const animationFrameRef = useRef<number | undefined>(undefined);
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false
  });

  const { submitScore } = useGameQueries();
  const topScoresQuery = useGetTopScores(50);
  const updateAchievement = useUpdateAchievement();
  const updateBossMaster = useUpdateBossMasterAchievement();
  const updateMagnetMaster = useUpdateMagnetMasterAchievement();
  const { data: playerAchievements } = useGetAchievements(playerName);

  const t = translations[language];
  const achievementTexts = achievementTranslations[language];

  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }, []);

  // Load previously unlocked achievements on mount
  useEffect(() => {
    if (playerAchievements?.achievements) {
      const unlocked = playerAchievements.achievements
        .filter(a => a.unlocked)
        .map(a => a.id);
      unlockedAchievementsRef.current = new Set(unlocked);
    }
  }, [playerAchievements]);

  // Function to show achievement notification
  const showAchievementNotification = useCallback((achievementId: string) => {
    const state = gameStateRef.current;
    const achievementText = achievementTexts[achievementId as keyof typeof achievementTexts];
    
    if (!achievementText) return;

    const notification: AchievementNotification = {
      id: achievementId,
      name: achievementText.name,
      description: achievementText.description,
      startTime: Date.now(),
      duration: ACHIEVEMENT_NOTIFICATION_DURATION,
      active: true
    };

    state.achievementNotifications.push(notification);
    setActiveNotifications([...state.achievementNotifications.filter(n => n.active)]);

    // Save to session storage for Achievements page
    const sessionAchievements = JSON.parse(localStorage.getItem('galaga-session-achievements') || '[]');
    if (!sessionAchievements.includes(achievementId)) {
      sessionAchievements.push(achievementId);
      localStorage.setItem('galaga-session-achievements', JSON.stringify(sessionAchievements));
    }

    // Play achievement sound and vibration
    audioManagerRef.current.playSound('achievement');
    vibrationManagerRef.current.vibrateAchievementUnlock();
  }, [achievementTexts]);

  // Initialize achievement tracker callbacks
  useEffect(() => {
    const tracker = achievementTrackerRef.current;
    
    const handleAchievementProgress = async (achievementId: string, progress: number, bossType?: number) => {
      try {
        // Check if this achievement was already unlocked
        const wasUnlocked = unlockedAchievementsRef.current.has(achievementId);

        // Update backend
        if (achievementId === 'boss_master' && bossType !== undefined) {
          await updateBossMaster.mutateAsync({
            playerName,
            bossType: bossType.toString()
          });
        } else if (achievementId === 'magnet_master') {
          await updateMagnetMaster.mutateAsync({
            playerName,
            magnetCount: progress
          });
        } else {
          await updateAchievement.mutateAsync({
            playerName,
            achievementId,
            progress: BigInt(progress)
          });
        }

        // Show notification only if newly unlocked
        if (!wasUnlocked) {
          unlockedAchievementsRef.current.add(achievementId);
          showAchievementNotification(achievementId);
        }
      } catch (error) {
        console.error('Failed to update achievement:', error);
      }
    };

    const achievementIds = [
      'fast_hunter', 'first_boss', 'millionaire', 'boss_master', 'survivor',
      'double_power', 'collector', 'precision_shooter', 'endurance_champion', 
      'perfectionist', 'magnet_master'
    ];

    achievementIds.forEach(id => {
      tracker.onAchievementProgress(id, handleAchievementProgress);
    });
  }, [playerName, updateAchievement, updateBossMaster, updateMagnetMaster, showAchievementNotification]);

  // Store game progress in localStorage for hangar unlocks
  useEffect(() => {
    const state = gameStateRef.current;
    const currentHighScore = parseInt(localStorage.getItem('galaga-high-score') || '0');
    const currentMaxLevel = parseInt(localStorage.getItem('galaga-max-level') || '0');
    
    if (state.score > currentHighScore) {
      localStorage.setItem('galaga-high-score', state.score.toString());
    }
    if (state.level > currentMaxLevel) {
      localStorage.setItem('galaga-max-level', state.level.toString());
    }
  }, [displayScore, displayLevel]);

  const initializeBorderStars = useCallback(() => {
    if (!isMobileDevice()) {
      borderStarsRef.current = [];
      return;
    }

    const stars: BorderStar[] = [];
    const container = containerRef.current;
    
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const canvas = canvasRef.current;
    
    let canvasLeft = 0;
    let canvasTop = 0;
    let canvasRight = containerRect.width;
    let canvasBottom = containerRect.height;
    
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      canvasLeft = canvasRect.left - containerRect.left;
      canvasTop = canvasRect.top - containerRect.top;
      canvasRight = canvasLeft + canvasRect.width;
      canvasBottom = canvasTop + canvasRect.height;
    }
    
    const starSpacing = 30;
    
    // Top border
    for (let x = 0; x < containerRect.width; x += starSpacing) {
      for (let y = 0; y < canvasTop; y += starSpacing) {
        stars.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          size: 1.5,
          baseSize: 1.5 + Math.random() * 1.2,
          brightness: 0.6,
          baseBrightness: 0.5 + Math.random() * 0.4,
          pulseSpeed: 0.8 + Math.random() * 1.2,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }
    
    // Bottom border
    for (let x = 0; x < containerRect.width; x += starSpacing) {
      for (let y = canvasBottom; y < containerRect.height; y += starSpacing) {
        stars.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          size: 1.5,
          baseSize: 1.5 + Math.random() * 1.2,
          brightness: 0.6,
          baseBrightness: 0.5 + Math.random() * 0.4,
          pulseSpeed: 0.8 + Math.random() * 1.2,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }
    
    // Left border
    for (let x = 0; x < canvasLeft; x += starSpacing) {
      for (let y = 0; y < containerRect.height; y += starSpacing) {
        stars.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          size: 1.5,
          baseSize: 1.5 + Math.random() * 1.2,
          brightness: 0.6,
          baseBrightness: 0.5 + Math.random() * 0.4,
          pulseSpeed: 0.8 + Math.random() * 1.2,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }
    
    // Right border
    for (let x = canvasRight; x < containerRect.width; x += starSpacing) {
      for (let y = 0; y < containerRect.height; y += starSpacing) {
        stars.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          size: 1.5,
          baseSize: 1.5 + Math.random() * 1.2,
          brightness: 0.6,
          baseBrightness: 0.5 + Math.random() * 0.4,
          pulseSpeed: 0.8 + Math.random() * 1.2,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }
    
    borderStarsRef.current = stars;
  }, [isMobileDevice]);

  const updateBorderStars = useCallback(() => {
    if (!isMobileDevice()) return;

    const now = Date.now();
    
    if (now - lastStarUpdateRef.current < 50) {
      return;
    }
    
    lastStarUpdateRef.current = now;
    const time = now * 0.001;
    
    borderStarsRef.current.forEach(star => {
      const pulse = Math.sin(time * star.pulseSpeed + star.pulseOffset);
      star.size = star.baseSize * (0.7 + pulse * 0.3);
      star.brightness = star.baseBrightness * (0.6 + pulse * 0.4);
    });
  }, [isMobileDevice]);

  const translateDifficulty = useCallback((difficultyKey: string): string => {
    switch (difficultyKey) {
      case 'einfach':
        return 'Einfach';
      case 'mittel':
        return 'Mittel';
      case 'schwer':
        return 'Schwer';
      default:
        return difficultyKey;
    }
  }, []);

  const initializeAudio = useCallback(async () => {
    try {
      await audioManagerRef.current.initialize(initialMuted);
      setIsMuted(audioManagerRef.current.getMuted());
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, [initialMuted]);

  const stopGameLoop = useCallback(() => {
    if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  const isBossLevel = useCallback((level: number): boolean => {
    return level % 5 === 0;
  }, []);

  const shouldAwardBonusLife = useCallback((level: number): boolean => {
    return level % 10 === 0 && level > 0;
  }, []);

  const initializeEnemies = useCallback(() => {
    const enemies: Enemy[] = [];
    const level = gameStateRef.current.level;
    const currentTime = Date.now();
    const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
    const isBoss = isBossLevel(level);
    
    if (isBoss) {
      const bossX = CANVAS_WIDTH / 2 - 15;
      const bossY = 60;
      
      enemies.push({
        x: bossX,
        y: bossY,
        originalX: bossX,
        originalY: bossY,
        width: 30,
        height: 24,
        active: true,
        type: 'boss',
        points: Math.floor(1000 * gameStateRef.current.wave * difficultySettings.scoreMultiplier),
        movePattern: 'formation',
        angle: 0,
        health: 5,
        maxHealth: 5,
        zigzagDirection: 1,
        formationIndex: 0,
        diveSpeed: 1,
        lastShotTime: currentTime,
        isBoss: true
      });
      
      const orbitRadius = 60;
      const numOrbiters = 6;
      for (let i = 0; i < numOrbiters; i++) {
        const orbitAngle = (i / numOrbiters) * Math.PI * 2;
        enemies.push({
          x: bossX + Math.cos(orbitAngle) * orbitRadius,
          y: bossY + Math.sin(orbitAngle) * orbitRadius,
          originalX: bossX,
          originalY: bossY,
          width: 20,
          height: 16,
          active: true,
          type: 'heavy',
          points: Math.floor(400 * gameStateRef.current.wave * difficultySettings.scoreMultiplier),
          movePattern: 'orbit',
          angle: 0,
          health: 2,
          maxHealth: 2,
          zigzagDirection: 1,
          formationIndex: i,
          diveSpeed: 1,
          lastShotTime: currentTime,
          orbitAngle: orbitAngle,
          orbitRadius: orbitRadius,
          orbitSpeed: 0.02
        });
      }
    } else {
      const baseRows = 5;
      const baseCols = 8;
      const levelMultiplier = 1 + (level - 1) * 0.1;
      const totalEnemies = Math.floor(baseRows * baseCols * difficultySettings.enemiesPerWave * levelMultiplier);
      const rows = Math.ceil(totalEnemies / baseCols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < baseCols; col++) {
          if (enemies.length >= totalEnemies) break;
          
          let enemyType: Enemy['type'];
          let points: number;
          let health: number;
          let movePattern: Enemy['movePattern'];
          
          if (row === 0) {
            enemyType = 'heavy';
            points = 400;
            health = 2;
            movePattern = 'heavy';
          } else if (row === 1) {
            enemyType = 'formation';
            points = 300;
            health = 1;
            movePattern = 'groupFly';
          } else if (row === 2 && col % 2 === 0) {
            enemyType = 'diver';
            points = 250;
            health = 1;
            movePattern = 'formation';
          } else if (row === 2) {
            enemyType = 'zigzag';
            points = 200;
            health = 1;
            movePattern = 'zigzag';
          } else if (row === 3) {
            enemyType = 'officer';
            points = 160;
            health = 1;
            movePattern = 'formation';
          } else {
            enemyType = 'grunt';
            points = 100;
            health = 1;
            movePattern = 'formation';
          }
          
          enemies.push({
            x: 40 + col * 30,
            y: 40 + row * 25,
            originalX: 40 + col * 30,
            originalY: 40 + row * 25,
            width: 20,
            height: 16,
            active: true,
            type: enemyType,
            points: Math.floor(points * gameStateRef.current.wave * difficultySettings.scoreMultiplier * levelMultiplier),
            movePattern: movePattern,
            angle: 0,
            health: health,
            maxHealth: health,
            zigzagDirection: Math.random() < 0.5 ? 1 : -1,
            formationIndex: row * 8 + col,
            diveSpeed: 1 + Math.random() * 2 * difficultySettings.enemySpeed,
            lastShotTime: currentTime
          });
        }
      }
    }
    
    gameStateRef.current.enemies = enemies;
  }, [difficulty, isBossLevel]);

  const startIntroSequence = useCallback(async () => {
    const state = gameStateRef.current;
    state.isInIntro = true;
    state.introStartTime = Date.now();
    state.gameRunning = true;
    
    const audioDuration = await audioManagerRef.current.playGameStartAudio();
    state.introDuration = audioDuration + INTRO_EXTENSION_DURATION;
  }, []);

  const updateIntroSequence = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isInIntro) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.introStartTime;
    
    if (elapsed >= state.introDuration) {
      state.isInIntro = false;
      audioManagerRef.current.stopGameStartAudio();
      startStageFlagSequence();
    }
  }, []);

  const startStageFlagSequence = useCallback(async () => {
    const state = gameStateRef.current;
    state.isInStageFlag = true;
    state.stageFlagStartTime = Date.now();
    state.gameRunning = true;
    
    const audioDuration = await audioManagerRef.current.playStageFlagAudio();
    state.stageFlagDuration = audioDuration;
    setGameState('stageFlag');
  }, []);

  const updateStageFlagSequence = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isInStageFlag) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.stageFlagStartTime;
    
    if (elapsed >= state.stageFlagDuration) {
      state.isInStageFlag = false;
      audioManagerRef.current.stopStageFlagAudio();
      setGameState('playing');
    }
  }, []);

  const startOutroSequence = useCallback(() => {
    const state = gameStateRef.current;
    state.isInOutro = true;
    state.outroStartTime = Date.now();
    state.gameRunning = true;
    audioManagerRef.current.stopGameStartAudio();
    audioManagerRef.current.stopStageFlagAudio();
    audioManagerRef.current.playSound('gameOver');
  }, []);

  const updateOutroSequence = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isInOutro) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.outroStartTime;
    
    if (elapsed >= OUTRO_DURATION) {
      state.isInOutro = false;
      state.gameRunning = false;
      setShowNameInput(true);
      setGameState('gameOver');
    }
  }, []);

  const startLevelTransition = useCallback(() => {
    const state = gameStateRef.current;
    state.waitingForExplosions = true;
    state.gameRunning = true;
  }, []);

  const checkExplosionsComplete = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.waitingForExplosions) return false;
    
    const activeExplosions = state.explosions.filter(explosion => explosion.active);
    if (activeExplosions.length === 0) {
      state.waitingForExplosions = false;
      state.isInLevelTransition = true;
      state.levelTransitionStartTime = Date.now();
      state.levelTransitionPhase = 'fadeOut';
      state.fadeAlpha = 0;

      const tracker = achievementTrackerRef.current;
      tracker.trackLevelComplete(state.levelDamageTaken);
      
      if (state.levelShotsFired > 0) {
        const accuracy = (state.levelHits / state.levelShotsFired) * 100;
        if (accuracy >= 90 && state.levelShotsFired >= 10) {
          tracker.trackHit();
        }
      }

      state.levelDamageTaken = false;
      state.levelShotsFired = 0;
      state.levelHits = 0;

      return true;
    }
    
    return false;
  }, []);

  const updateLevelTransition = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isInLevelTransition) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.levelTransitionStartTime;
    
    switch (state.levelTransitionPhase) {
      case 'fadeOut':
        state.fadeAlpha = Math.min(1, elapsed / LEVEL_TRANSITION_FADE_OUT_DURATION);
        if (elapsed >= LEVEL_TRANSITION_FADE_OUT_DURATION) {
          state.levelTransitionPhase = 'message';
          state.levelTransitionStartTime = currentTime;
        }
        break;
        
      case 'message':
        state.fadeAlpha = 1;
        if (elapsed >= LEVEL_TRANSITION_MESSAGE_DURATION) {
          state.levelTransitionPhase = 'fadeIn';
          state.levelTransitionStartTime = currentTime;
        }
        break;
        
      case 'fadeIn':
        state.fadeAlpha = Math.max(0, 1 - (elapsed / LEVEL_TRANSITION_FADE_IN_DURATION));
        if (elapsed >= LEVEL_TRANSITION_FADE_IN_DURATION) {
          state.levelTransitionPhase = 'delay';
          state.levelTransitionStartTime = currentTime;
        }
        break;
        
      case 'delay':
        state.fadeAlpha = 0;
        if (elapsed >= LEVEL_TRANSITION_DELAY) {
          state.levelTransitionPhase = 'complete';
          state.isInLevelTransition = false;
          state.level++;
          setDisplayLevel(state.level);
          
          if (shouldAwardBonusLife(state.level)) {
            state.player.lives++;
            setDisplayLives(state.player.lives);
            state.showBonusLifeMessage = true;
            state.bonusLifeMessageStartTime = Date.now();
            audioManagerRef.current.playSound('bonusLife');
            vibrationManagerRef.current.vibrateExtraLife();
          }
          
          initializeEnemies();
          setGameState('playing');
        }
        break;
    }
  }, [initializeEnemies, shouldAwardBonusLife]);

  const spawnBackgroundObject = useCallback(() => {
    const state = gameStateRef.current;
    
    if (Math.random() < 0.008) {
      const objectTypes: BackgroundObject['type'][] = ['planet', 'spaceship', 'asteroid'];
      const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      
      let size: number;
      let color: string;
      let speed: number;
      let opacity: number;
      
      switch (type) {
        case 'planet':
          size = 20 + Math.random() * 30;
          const planetColors = ['#4a5568', '#2d3748', '#1a202c', '#2b6cb0', '#3182ce', '#805ad5'];
          color = planetColors[Math.floor(Math.random() * planetColors.length)];
          speed = 0.3 + Math.random() * 0.4;
          opacity = 0.4 + Math.random() * 0.3;
          break;
        case 'spaceship':
          size = 12 + Math.random() * 16;
          color = '#718096';
          speed = 0.6 + Math.random() * 1.0;
          opacity = 0.5 + Math.random() * 0.3;
          break;
        case 'asteroid':
          size = 10 + Math.random() * 20;
          const asteroidColors = ['#4a5568', '#2d3748', '#553c9a', '#744210'];
          color = asteroidColors[Math.floor(Math.random() * asteroidColors.length)];
          speed = 0.4 + Math.random() * 0.6;
          opacity = 0.35 + Math.random() * 0.35;
          break;
      }
      
      let x: number, y: number;
      const spawnSide = Math.floor(Math.random() * 3);
      
      if (spawnSide === 0) {
        x = -size;
        y = Math.random() * (CANVAS_HEIGHT - size);
      } else if (spawnSide === 1) {
        x = CANVAS_WIDTH + size;
        y = Math.random() * (CANVAS_HEIGHT - size);
      } else {
        x = Math.random() * (CANVAS_WIDTH - size);
        y = -size;
      }
      
      state.backgroundObjects.push({
        x,
        y,
        type,
        size,
        color,
        speed,
        opacity,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        active: true
      });
    }
  }, []);

  const spawnPowerUp = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    
    if (state.powerUps.length === 0 && Math.random() < 0.003) {
      const powerUpTypes: PowerUp['type'][] = ['doubleFire', 'shield', 'magnet'];
      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      
      state.powerUps.push({
        x: Math.random() * (CANVAS_WIDTH - 30) + 15,
        y: 0,
        width: 20,
        height: 20,
        active: true,
        type: powerUpType,
        spawnTime: currentTime,
        duration: POWERUP_LIFETIME,
        dy: POWERUP_FALL_SPEED,
        isBeingAttracted: false
      });
    }
  }, []);

  const addPointDisplay = useCallback((x: number, y: number, points: number) => {
    const state = gameStateRef.current;
    const velocityX = (Math.random() - 0.5) * 1.5;
    const velocityY = -1.5;
    
    state.pointDisplays.push({
      x: x,
      y: y,
      points: points,
      startTime: Date.now(),
      duration: POINT_DISPLAY_DURATION,
      active: true,
      velocity: { x: velocityX, y: velocityY }
    });
  }, []);

  const resetGame = useCallback(() => {
    stopGameLoop();
    
    gameStateRef.current = {
      player: {
        x: CANVAS_WIDTH / 2 - 15,
        y: CANVAS_HEIGHT - 40,
        width: 30,
        height: 20,
        active: true,
        lives: 3,
        isExploding: false,
        explosionFrame: 0,
        respawnTimer: 0
      },
      enemies: [],
      playerProjectiles: [],
      enemyProjectiles: [],
      powerUps: [],
      explosions: [],
      powerUpEffects: [],
      backgroundObjects: [],
      pointDisplays: [],
      achievementNotifications: [],
      score: 0,
      wave: 1,
      level: 1,
      gameRunning: false,
      levelTransitionStartTime: 0,
      levelTransitionPhase: 'complete',
      fadeAlpha: 0,
      isInLevelTransition: false,
      waitingForExplosions: false,
      introStartTime: 0,
      isInIntro: false,
      introDuration: 3000,
      stageFlagStartTime: 0,
      isInStageFlag: false,
      stageFlagDuration: 3000,
      outroStartTime: 0,
      isInOutro: false,
      showBonusLifeMessage: false,
      bonusLifeMessageStartTime: 0,
      levelDamageTaken: false,
      levelShotsFired: 0,
      levelHits: 0,
    };
    
    setDisplayScore(0);
    setDisplayLives(3);
    setDisplayLevel(1);
    setActiveNotifications([]);

    achievementTrackerRef.current.resetSession();
    localStorage.removeItem('galaga-session-achievements');
  }, [stopGameLoop]);

  const checkCollisions = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
    const tracker = achievementTrackerRef.current;
    
    state.playerProjectiles.forEach(projectile => {
      if (!projectile.active) return;
      
      state.enemies.forEach(enemy => {
        if (!enemy.active) return;
        
        if (projectile.x < enemy.x + enemy.width &&
            projectile.x + projectile.width > enemy.x &&
            projectile.y < enemy.y + enemy.height &&
            projectile.y + projectile.height > enemy.y) {
          
          projectile.active = false;
          enemy.health--;
          
          state.levelHits++;
          tracker.trackHit();
          
          if (enemy.health <= 0) {
            enemy.active = false;
            const pointsEarned = Math.floor(enemy.points * difficultySettings.scoreMultiplier);
            state.score += pointsEarned;
            setDisplayScore(state.score);
            
            addPointDisplay(
              enemy.x + enemy.width / 2, 
              enemy.y + enemy.height / 2, 
              pointsEarned
            );
            
            state.explosions.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              frame: 0,
              maxFrames: 8,
              active: true
            });
            
            audioManagerRef.current.playPointEarnedSound();
            vibrationManagerRef.current.vibratePointEarned();

            tracker.trackEnemyKill();
            tracker.trackScore(state.score);

            if (enemy.isBoss) {
              vibrationManagerRef.current.vibrateBossDefeat();
              const bossType = Math.floor(state.level / 5);
              tracker.trackBossDefeat(bossType);
            }
          }
          
          audioManagerRef.current.playSound('enemyHit');
        }
      });
    });

    state.enemyProjectiles.forEach(projectile => {
      if (!projectile.active || !state.player.active || state.player.isExploding) return;
      
      if (projectile.x < state.player.x + state.player.width &&
          projectile.x + projectile.width > state.player.x &&
          projectile.y < state.player.y + state.player.height &&
          projectile.y + projectile.height > state.player.y) {
        
        projectile.active = false;
        
        const shieldEffect = state.powerUpEffects.find(effect => effect.type === 'shield' && effect.active);
        if (shieldEffect) {
          shieldEffect.active = false;
        } else {
          state.player.isExploding = true;
          state.player.explosionFrame = 0;
          state.player.respawnTimer = currentTime + RESPAWN_DELAY;
          state.player.lives--;
          setDisplayLives(state.player.lives);
          audioManagerRef.current.playSound('playerExplosion');
          vibrationManagerRef.current.vibrateDamage();

          state.levelDamageTaken = true;
          tracker.trackDamage();
          
          if (state.player.lives <= 0) {
            startOutroSequence();
          }
        }
      }
    });

    if (!state.player.isExploding) {
      state.powerUps.forEach(powerUp => {
        if (!powerUp.active) return;
        
        if (state.player.x < powerUp.x + powerUp.width &&
            state.player.x + state.player.width > powerUp.x &&
            state.player.y < powerUp.y + powerUp.height &&
            state.player.y + powerUp.height > powerUp.y) {
          
          powerUp.active = false;
          audioManagerRef.current.playSound('powerUpCollect');
          vibrationManagerRef.current.vibratePowerUp();
          
          let duration: number;
          switch (powerUp.type) {
            case 'doubleFire':
              duration = DOUBLE_FIRE_DURATION;
              break;
            case 'shield':
              duration = SHIELD_DURATION;
              break;
            case 'magnet':
              duration = MAGNET_DURATION;
              break;
            default:
              duration = 10000;
          }
          
          state.powerUpEffects = state.powerUpEffects.filter(effect => effect.type !== powerUp.type);
          
          const newEffect: PowerUpEffect = {
            type: powerUp.type,
            endTime: currentTime + duration,
            active: true
          };
          
          if (powerUp.type === 'magnet') {
            newEffect.magnetCollectedCount = 0;
          }
          
          state.powerUpEffects.push(newEffect);

          tracker.trackPowerUpCollected();
          if (powerUp.type === 'doubleFire') {
            tracker.trackDoubleShipActivation();
          }
        }
      });
    }

    const activeEnemies = state.enemies.filter(enemy => enemy.active);
    if (activeEnemies.length === 0 && !state.isInLevelTransition && !state.waitingForExplosions && !state.isInIntro && !state.isInStageFlag && !state.isInOutro) {
      state.wave++;
      startLevelTransition();
    }
  }, [difficulty, startLevelTransition, addPointDisplay, startOutroSequence]);

  const updateGame = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();
    const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
    const tracker = achievementTrackerRef.current;
    
    updateBorderStars();
    
    tracker.trackPlaytime();
    
    if (state.isInIntro) {
      updateIntroSequence();
      spawnBackgroundObject();
      state.backgroundObjects.forEach(obj => {
        if (obj.active) {
          if (obj.x < -obj.size) {
            obj.x += obj.speed;
          } else if (obj.x > CANVAS_WIDTH + obj.size) {
            obj.x -= obj.speed;
          } else if (obj.y < -obj.size) {
            obj.y += obj.speed;
          } else {
            if (obj.x < CANVAS_WIDTH / 2) {
              obj.x += obj.speed;
            } else {
              obj.x -= obj.speed;
            }
            obj.y += obj.speed * 0.5;
          }
          
          obj.angle += obj.rotationSpeed;
          
          if (obj.x < -obj.size * 2 || obj.x > CANVAS_WIDTH + obj.size * 2 ||
              obj.y > CANVAS_HEIGHT + obj.size * 2) {
            obj.active = false;
          }
        }
      });
      state.backgroundObjects = state.backgroundObjects.filter(obj => obj.active);
      return;
    }

    if (state.isInStageFlag) {
      updateStageFlagSequence();
      return;
    }
    
    if (state.isInOutro) {
      updateOutroSequence();
      return;
    }
    
    if (state.isInLevelTransition) {
      updateLevelTransition();
      return;
    }
    
    if (state.waitingForExplosions) {
      checkExplosionsComplete();
    }
    
    if (state.showBonusLifeMessage) {
      const elapsed = currentTime - state.bonusLifeMessageStartTime;
      if (elapsed >= 3000) {
        state.showBonusLifeMessage = false;
      }
    }

    state.achievementNotifications.forEach(notification => {
      if (notification.active) {
        const elapsed = currentTime - notification.startTime;
        if (elapsed >= notification.duration) {
          notification.active = false;
        }
      }
    });
    state.achievementNotifications = state.achievementNotifications.filter(n => n.active);
    setActiveNotifications(state.achievementNotifications.filter(n => n.active));
    
    if (!state.gameRunning) return;

    if (state.player.isExploding) {
      state.player.explosionFrame++;
      if (state.player.explosionFrame >= PLAYER_EXPLOSION_FRAMES) {
        if (currentTime >= state.player.respawnTimer) {
          state.player.isExploding = false;
          state.player.explosionFrame = 0;
          state.player.x = CANVAS_WIDTH / 2 - 15;
          state.player.y = CANVAS_HEIGHT - 40;
          state.player.active = true;
        }
      }
    }

    if (!state.player.isExploding && state.player.active) {
      if (keysRef.current.has('ArrowLeft') || touchRef.current.left) {
        state.player.x = Math.max(0, state.player.x - PLAYER_SPEED);
      }
      if (keysRef.current.has('ArrowRight') || touchRef.current.right) {
        state.player.x = Math.min(CANVAS_WIDTH - state.player.width, state.player.x + PLAYER_SPEED);
      }
    }

    state.playerProjectiles.forEach(projectile => {
      if (projectile.active) {
        projectile.y += projectile.dy;
        if (projectile.y < 0) projectile.active = false;
      }
    });

    state.enemyProjectiles.forEach(projectile => {
      if (projectile.active) {
        projectile.y += projectile.dy;
        if (projectile.y > CANVAS_HEIGHT) projectile.active = false;
      }
    });

    // Magnet effect: attract power-ups
    const magnetEffect = state.powerUpEffects.find(effect => effect.type === 'magnet' && effect.active);
    if (magnetEffect) {
      state.powerUps.forEach(powerUp => {
        if (powerUp.active) {
          const dx = state.player.x + state.player.width / 2 - (powerUp.x + powerUp.width / 2);
          const dy = state.player.y + state.player.height / 2 - (powerUp.y + powerUp.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < MAGNET_RANGE) {
            powerUp.isBeingAttracted = true;
            const attractionSpeed = 3;
            const angle = Math.atan2(dy, dx);
            powerUp.x += Math.cos(angle) * attractionSpeed;
            powerUp.y += Math.sin(angle) * attractionSpeed;
            
            // Check if power-up reached player
            if (distance < 30) {
              powerUp.active = false;
              audioManagerRef.current.playSound('magnetCollect');
              vibrationManagerRef.current.vibratePowerUp();
              
              // Track magnet collection
              if (magnetEffect.magnetCollectedCount !== undefined) {
                magnetEffect.magnetCollectedCount++;
                tracker.trackMagnetCollectedPowerUp();
              }
              
              let duration: number;
              switch (powerUp.type) {
                case 'doubleFire':
                  duration = DOUBLE_FIRE_DURATION;
                  break;
                case 'shield':
                  duration = SHIELD_DURATION;
                  break;
                case 'magnet':
                  duration = MAGNET_DURATION;
                  break;
                default:
                  duration = 10000;
              }
              
              state.powerUpEffects = state.powerUpEffects.filter(effect => effect.type !== powerUp.type || effect.type === 'magnet');
              
              const newEffect: PowerUpEffect = {
                type: powerUp.type,
                endTime: currentTime + duration,
                active: true
              };
              
              if (powerUp.type === 'magnet') {
                newEffect.magnetCollectedCount = 0;
              }
              
              state.powerUpEffects.push(newEffect);

              tracker.trackPowerUpCollected();
              if (powerUp.type === 'doubleFire') {
                tracker.trackDoubleShipActivation();
              }
            }
          } else {
            powerUp.isBeingAttracted = false;
            powerUp.y += powerUp.dy;
          }
        }
      });
    } else {
      state.powerUps.forEach(powerUp => {
        if (powerUp.active) {
          powerUp.isBeingAttracted = false;
          powerUp.y += powerUp.dy;
          if (powerUp.y > CANVAS_HEIGHT + 50 || currentTime - powerUp.spawnTime > powerUp.duration) {
            powerUp.active = false;
          }
        }
      });
    }

    state.backgroundObjects.forEach(obj => {
      if (obj.active) {
        if (obj.x < -obj.size) {
          obj.x += obj.speed;
        } else if (obj.x > CANVAS_WIDTH + obj.size) {
          obj.x -= obj.speed;
        } else if (obj.y < -obj.size) {
          obj.y += obj.speed;
        } else {
          if (obj.x < CANVAS_WIDTH / 2) {
            obj.x += obj.speed;
          } else {
            obj.x -= obj.speed;
          }
          obj.y += obj.speed * 0.5;
        }
        
        obj.angle += obj.rotationSpeed;
        
        if (obj.x < -obj.size * 2 || obj.x > CANVAS_WIDTH + obj.size * 2 ||
            obj.y > CANVAS_HEIGHT + obj.size * 2) {
          obj.active = false;
        }
      }
    });

    state.powerUpEffects.forEach(effect => {
      if (effect.active && currentTime > effect.endTime) {
        effect.active = false;
      }
    });

    state.explosions.forEach(explosion => {
      if (explosion.active) {
        explosion.frame++;
        if (explosion.frame >= explosion.maxFrames) {
          explosion.active = false;
        }
      }
    });

    state.pointDisplays.forEach(pointDisplay => {
      if (pointDisplay.active) {
        const elapsed = currentTime - pointDisplay.startTime;
        if (elapsed >= pointDisplay.duration) {
          pointDisplay.active = false;
        } else {
          pointDisplay.x += pointDisplay.velocity.x;
          pointDisplay.y += pointDisplay.velocity.y;
          pointDisplay.velocity.x *= 0.98;
          pointDisplay.velocity.y *= 0.98;
        }
      }
    });

    const time = Date.now() * 0.001;
    const levelSpeedMultiplier = 1 + (state.level - 1) * 0.1;
    state.enemies.forEach((enemy) => {
      if (!enemy.active) return;
      
      const previousMovePattern = enemy.movePattern;
      
      switch (enemy.movePattern) {
        case 'orbit':
          if (enemy.orbitAngle !== undefined && enemy.orbitRadius !== undefined && enemy.orbitSpeed !== undefined) {
            enemy.orbitAngle += enemy.orbitSpeed;
            enemy.x = enemy.originalX + Math.cos(enemy.orbitAngle) * enemy.orbitRadius;
            enemy.y = enemy.originalY + Math.sin(enemy.orbitAngle) * enemy.orbitRadius;
          }
          break;
          
        case 'formation':
          enemy.x = enemy.originalX + Math.sin(time + enemy.originalX * 0.01) * 20;
          enemy.y = enemy.originalY + Math.sin(time * 0.5) * 10;
          
          if (enemy.type === 'diver' && Math.random() < 0.0008 * difficultySettings.enemySpeed * levelSpeedMultiplier) {
            enemy.movePattern = 'diving';
            enemy.angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
          }
          break;
          
        case 'diving':
          enemy.x += Math.cos(enemy.angle) * enemy.diveSpeed * difficultySettings.enemySpeed * levelSpeedMultiplier;
          enemy.y += Math.abs(Math.sin(enemy.angle)) * (enemy.diveSpeed + 1) * difficultySettings.enemySpeed * levelSpeedMultiplier;
          
          if (enemy.y > CANVAS_HEIGHT || enemy.x < 0 || enemy.x > CANVAS_WIDTH) {
            enemy.movePattern = 'formation';
            enemy.x = enemy.originalX;
            enemy.y = enemy.originalY;
          }
          break;
          
        case 'zigzag':
          enemy.y = enemy.originalY + Math.sin(time * 0.3) * 15;
          enemy.x += enemy.zigzagDirection * Math.sin(time * 2) * 2 * difficultySettings.enemySpeed * levelSpeedMultiplier;
          
          if (enemy.x <= 0 || enemy.x >= CANVAS_WIDTH - enemy.width) {
            enemy.zigzagDirection *= -1;
          }
          break;
          
        case 'groupFly':
          const formationOffset = (enemy.formationIndex % 4) * Math.PI / 2;
          enemy.x = enemy.originalX + Math.sin(time + formationOffset) * 30 * difficultySettings.enemySpeed * levelSpeedMultiplier;
          enemy.y = enemy.originalY + Math.cos(time * 0.7 + formationOffset) * 20 * difficultySettings.enemySpeed * levelSpeedMultiplier;
          break;
          
        case 'heavy':
          enemy.y = enemy.originalY + Math.sin(time * 0.2) * 5;
          enemy.x = enemy.originalX + Math.sin(time * 0.3 + enemy.formationIndex) * 15 * difficultySettings.enemySpeed * levelSpeedMultiplier;
          
          if (Math.random() < 0.0005 * difficultySettings.enemySpeed * levelSpeedMultiplier) {
            const playerDirection = state.player.x > enemy.x ? 1 : -1;
            enemy.x += playerDirection * 0.5 * difficultySettings.enemySpeed * levelSpeedMultiplier;
          }
          break;
      }
      
      if (enemy.type === 'diver' && previousMovePattern === 'formation' && enemy.movePattern === 'diving') {
        audioManagerRef.current.playDiverAttackSound();
      }
      
      let shootChance = difficultySettings.enemyFireRate * levelSpeedMultiplier;
      if (enemy.isBoss) shootChance *= 4;
      else if (enemy.type === 'heavy') shootChance *= 2;
      else if (enemy.type === 'diver' && enemy.movePattern === 'diving') shootChance *= 4;
      
      if (Math.random() < shootChance && currentTime - enemy.lastShotTime > 1000) {
        enemy.lastShotTime = currentTime;
        
        if (enemy.isBoss) {
          for (let i = -1; i <= 1; i++) {
            state.enemyProjectiles.push({
              x: enemy.x + enemy.width / 2 + i * 8,
              y: enemy.y + enemy.height,
              width: 3,
              height: 8,
              active: true,
              dy: 3 * difficultySettings.enemySpeed * levelSpeedMultiplier,
              isPlayerProjectile: false
            });
          }
        } else {
          state.enemyProjectiles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            width: 3,
            height: 8,
            active: true,
            dy: (enemy.type === 'heavy' ? 4 : 3) * difficultySettings.enemySpeed * levelSpeedMultiplier,
            isPlayerProjectile: false
          });
        }
      }
    });

    spawnPowerUp();
    spawnBackgroundObject();

    state.playerProjectiles = state.playerProjectiles.filter(p => p.active);
    state.enemyProjectiles = state.enemyProjectiles.filter(p => p.active);
    state.powerUps = state.powerUps.filter(p => p.active);
    state.explosions = state.explosions.filter(e => e.active);
    state.powerUpEffects = state.powerUpEffects.filter(e => e.active);
    state.backgroundObjects = state.backgroundObjects.filter(obj => obj.active);
    state.pointDisplays = state.pointDisplays.filter(pd => pd.active);

    checkCollisions();
  }, [checkCollisions, spawnPowerUp, spawnBackgroundObject, difficulty, updateLevelTransition, checkExplosionsComplete, updateIntroSequence, updateStageFlagSequence, updateOutroSequence, updateBorderStars]);

  const drawPlayerSpaceship = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    const { x, y, width, height } = player;
    
    if (player.isExploding) {
      const progress = player.explosionFrame / PLAYER_EXPLOSION_FRAMES;
      const size = 30 * (1 + progress * 2);
      const alpha = 1 - progress;
      
      ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, size, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, size * 0.6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, size * 0.3, 0, 2 * Math.PI);
      ctx.fill();
      
      return;
    }
    
    const state = gameStateRef.current;
    const shieldActive = state.powerUpEffects.some(effect => effect.type === 'shield' && effect.active);
    
    if (shieldActive) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 2 + 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#00ffff';
    const fuselageWidth = width * 0.4;
    const fuselageX = x + (width - fuselageWidth) / 2;
    ctx.fillRect(fuselageX, y + height * 0.3, fuselageWidth, height * 0.7);
    
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(fuselageX, y + height * 0.3);
    ctx.lineTo(fuselageX + fuselageWidth, y + height * 0.3);
    ctx.closePath();
    ctx.fill();
    
    const wingWidth = width * 0.25;
    const wingHeight = height * 0.4;
    const wingY = y + height * 0.4;
    
    ctx.fillRect(x, wingY, wingWidth, wingHeight);
    ctx.fillRect(x + width - wingWidth, wingY, wingWidth, wingHeight);
    
    ctx.fillStyle = '#ffffff';
    const exhaustWidth = 3;
    const exhaustHeight = 4;
    const exhaustY = y + height - exhaustHeight;
    
    ctx.fillRect(x + width * 0.2, exhaustY, exhaustWidth, exhaustHeight);
    ctx.fillRect(x + width / 2 - exhaustWidth / 2, exhaustY, exhaustWidth, exhaustHeight);
    ctx.fillRect(x + width * 0.8 - exhaustWidth, exhaustY, exhaustWidth, exhaustHeight);
    
    const cockpitWidth = 4;
    const cockpitHeight = 3;
    ctx.fillRect(x + width / 2 - cockpitWidth / 2, y + height * 0.15, cockpitWidth, cockpitHeight);
    
    ctx.fillRect(x, wingY, 2, 2);
    ctx.fillRect(x + width - 2, wingY, 2, 2);
  }, []);

  const drawGalagaEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const { x, y, width, height, type, health, maxHealth, isBoss } = enemy;
    
    let primaryColor: string;
    let secondaryColor = '#ffffff';
    let accentColor: string;
    
    switch (type) {
      case 'boss':
        primaryColor = '#ff0000';
        accentColor = '#ff8888';
        break;
      case 'heavy':
        primaryColor = '#800080';
        accentColor = '#ff00ff';
        break;
      case 'formation':
        primaryColor = '#0080ff';
        accentColor = '#80c0ff';
        break;
      case 'diver':
        primaryColor = '#ff8000';
        accentColor = '#ffb366';
        break;
      case 'zigzag':
        primaryColor = '#80ff00';
        accentColor = '#b3ff66';
        break;
      case 'officer':
        primaryColor = '#ffff00';
        accentColor = '#ffff88';
        break;
      default:
        primaryColor = '#00ff00';
        accentColor = '#88ff88';
        break;
    }

    if (maxHealth > 1) {
      const healthRatio = health / maxHealth;
      ctx.fillStyle = healthRatio > 0.5 ? '#00ff00' : healthRatio > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(x, y - 3, width * healthRatio, 2);
    }

    if (isBoss || type === 'boss') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 2, y + 4, width - 4, height - 8);
      ctx.fillRect(x + 4, y + 2, width - 8, height - 4);
      ctx.fillRect(x, y + 6, 4, 4);
      ctx.fillRect(x + width - 4, y + 6, 4, 4);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + 4, y + 4, 3, 3);
      ctx.fillRect(x + width - 7, y + 4, 3, 3);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + width/2 - 2, y + 6, 4, 4);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 3, y + height - 3, 2, 2);
      ctx.fillRect(x + width - 5, y + height - 3, 2, 2);
    } else if (type === 'heavy') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 3, y + 3, width - 6, height - 6);
      ctx.fillRect(x + 1, y + 5, width - 2, height - 10);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + width/2 - 1, y + 1, 2, 4);
      ctx.fillRect(x + 2, y + 2, 2, 2);
      ctx.fillRect(x + width - 4, y + 2, 2, 2);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + width/2 - 2, y + 7, 4, 3);
    } else if (type === 'formation') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 4, y + 2, width - 8, height - 4);
      ctx.fillRect(x + 2, y + 4, width - 4, height - 8);
      ctx.fillRect(x + 1, y + 6, 3, 2);
      ctx.fillRect(x + width - 4, y + 6, 3, 2);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + width/2 - 1, y + 3, 2, 3);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x, y + 6, 2, 2);
      ctx.fillRect(x + width - 2, y + 6, 2, 2);
    } else if (type === 'diver') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 3, y + 1, width - 6, height - 2);
      ctx.fillRect(x + 1, y + 4, 4, 6);
      ctx.fillRect(x + width - 5, y + 4, 4, 6);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + width/2 - 1, y, 2, 3);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + 4, y + height - 2, 2, 2);
      ctx.fillRect(x + width - 6, y + height - 2, 2, 2);
    } else if (type === 'zigzag') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 2, y + 3, width - 4, height - 6);
      ctx.fillRect(x + 4, y + 1, width - 8, height - 2);
      ctx.fillRect(x, y + 5, 3, 4);
      ctx.fillRect(x + width - 3, y + 7, 3, 2);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + 3, y + 4, 2, 2);
      ctx.fillRect(x + width - 5, y + 6, 2, 2);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + width/2 - 1, y + 2, 2, height - 4);
    } else if (type === 'officer') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + width/2 - 2, y + 2, 4, height - 4);
      ctx.fillRect(x + 2, y + 3, 6, 3);
      ctx.fillRect(x + width - 8, y + 3, 6, 3);
      ctx.fillRect(x + 3, y + 8, 5, 3);
      ctx.fillRect(x + width - 8, y + 8, 5, 3);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + 1, y + 4, 2, 2);
      ctx.fillRect(x + width - 3, y + 4, 2, 2);
      ctx.fillRect(x + width/2 - 1, y + 1, 2, 2);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + width/2 - 1, y + 6, 2, 3);
    } else {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 3, y + 2, width - 6, height - 4);
      ctx.fillRect(x + 2, y + 4, width - 4, height - 8);
      ctx.fillRect(x + 1, y + 6, 3, 3);
      ctx.fillRect(x + width - 4, y + 6, 3, 3);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + 5, y + 4, 2, 2);
      ctx.fillRect(x + width - 7, y + 4, 2, 2);
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + width/2 - 1, y + 3, 2, height - 6);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x + 4, y + height - 2, 2, 1);
      ctx.fillRect(x + width - 6, y + height - 2, 2, 1);
    }
  }, []);

  const drawBackgroundObject = useCallback((ctx: CanvasRenderingContext2D, obj: BackgroundObject) => {
    const { x, y, type, size, color, opacity, angle } = obj;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(angle);
    
    switch (type) {
      case 'planet':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
        ctx.beginPath();
        ctx.arc(-size / 6, -size / 6, size / 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size / 4, size / 8, size / 12, 0, 2 * Math.PI);
        ctx.fill();
        break;
        
      case 'spaceship':
        ctx.fillStyle = color;
        ctx.fillRect(-size / 2, -size / 8, size, size / 4);
        ctx.fillRect(-size / 4, -size / 4, size / 2, size / 2);
        ctx.fillStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.fillRect(-size / 2 - 2, -size / 16, 4, size / 8);
        break;
        
      case 'asteroid':
        ctx.fillStyle = color;
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
          const angleStep = (2 * Math.PI * i) / points;
          const radius = (size / 2) * (0.7 + Math.random() * 0.3);
          const px = Math.cos(angleStep) * radius;
          const py = Math.sin(angleStep) * radius;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
        ctx.beginPath();
        ctx.arc(-size / 6, 0, size / 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size / 8, -size / 8, size / 16, 0, 2 * Math.PI);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }, []);

  const drawPowerUp = useCallback((ctx: CanvasRenderingContext2D, powerUp: PowerUp) => {
    const { x, y, width, height, type, isBeingAttracted } = powerUp;
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time) * 0.3 + 0.7;
    
    // Draw attraction effect if being attracted by magnet
    if (isBeingAttracted) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 0, 255, ${pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 2 + 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
    
    if (type === 'doubleFire') {
      ctx.fillStyle = `rgba(255, 165, 0, ${pulse})`;
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
      ctx.fillRect(x + 6, y + 6, width - 12, height - 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 8, y + 7, 2, 6);
      ctx.fillRect(x + 10, y + 7, 2, 6);
      ctx.fillRect(x + 7, y + 8, 6, 2);
    } else if (type === 'shield') {
      ctx.fillStyle = `rgba(0, 191, 255, ${pulse})`;
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
      ctx.fillRect(x + 6, y + 6, width - 12, height - 12);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 4, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (type === 'magnet') {
      ctx.fillStyle = `rgba(255, 0, 255, ${pulse})`;
      ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
      ctx.fillStyle = `rgba(255, 100, 255, ${pulse})`;
      ctx.fillRect(x + 6, y + 6, width - 12, height - 12);
      // Draw magnet symbol
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6, y + 8, 3, 6);
      ctx.fillRect(x + 11, y + 8, 3, 6);
      ctx.fillRect(x + 6, y + 13, 8, 2);
    }
  }, []);

  const drawExplosion = useCallback((ctx: CanvasRenderingContext2D, explosion: Explosion) => {
    const { x, y, frame, maxFrames } = explosion;
    const progress = frame / maxFrames;
    const size = 20 * (1 - progress);
    const alpha = 1 - progress;
    
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawPointDisplay = useCallback((ctx: CanvasRenderingContext2D, pointDisplay: PointDisplay) => {
    const { x, y, points, startTime, duration } = pointDisplay;
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = elapsed / duration;
    const alpha = Math.max(0, 1 - Math.pow(progress, 1.5));
    const scale = 0.8 + (1 - progress) * 0.4;
    
    ctx.save();
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.font = `bold ${Math.floor(14 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.9})`;
    ctx.lineWidth = 3;
    ctx.strokeText(`+${points}`, x, y);
    ctx.fillText(`+${points}`, x, y);
    ctx.shadowBlur = 15;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.fillText(`+${points}`, x, y);
    ctx.restore();
  }, []);

  const drawBonusLifeMessage = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    if (!state.showBonusLifeMessage) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.bonusLifeMessageStartTime;
    const progress = elapsed / 3000;
    
    let alpha = 1;
    if (progress < 0.2) {
      alpha = progress / 0.2;
    } else if (progress > 0.8) {
      alpha = (1 - progress) / 0.2;
    }
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.strokeText(t.bonusLife, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
    ctx.fillText(t.bonusLife, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    const pulse = Math.sin(elapsed * 0.008) * 0.1 + 1;
    ctx.scale(pulse, pulse);
    ctx.restore();
  }, [t.bonusLife]);

  const drawIntroSequence = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    if (!state.isInIntro) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.introStartTime;
    const progress = elapsed / state.introDuration;
    
    const previewEnemies = [
      { x: CANVAS_WIDTH / 2 - 60, y: 100, type: 'boss' as const },
      { x: CANVAS_WIDTH / 2 - 20, y: 140, type: 'heavy' as const },
      { x: CANVAS_WIDTH / 2 + 20, y: 140, type: 'formation' as const },
      { x: CANVAS_WIDTH / 2 - 40, y: 180, type: 'diver' as const },
      { x: CANVAS_WIDTH / 2 + 40, y: 180, type: 'zigzag' as const },
    ];
    
    const enemyAlpha = Math.sin(elapsed * 0.003) * 0.3 + 0.5;
    ctx.save();
    ctx.globalAlpha = enemyAlpha;
    
    previewEnemies.forEach((enemy, index) => {
      const floatOffset = Math.sin(elapsed * 0.002 + index) * 10;
      const mockEnemy: Enemy = {
        x: enemy.x,
        y: enemy.y + floatOffset,
        width: enemy.type === 'boss' ? 30 : 20,
        height: enemy.type === 'boss' ? 24 : 16,
        type: enemy.type,
        active: true,
        points: 0,
        movePattern: 'formation',
        originalX: enemy.x,
        originalY: enemy.y,
        angle: 0,
        health: 1,
        maxHealth: 1,
        zigzagDirection: 1,
        formationIndex: 0,
        diveSpeed: 1,
        lastShotTime: 0,
        isBoss: enemy.type === 'boss'
      };
      drawGalagaEnemy(ctx, mockEnemy);
    });
    
    ctx.restore();
    
    let alpha = 1;
    if (progress < 0.15) {
      alpha = progress / 0.15;
    } else if (progress > 0.85) {
      alpha = (1 - progress) / 0.15;
    }
    
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 25;
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.strokeText(t.ready, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.fillText(t.ready, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    const pulse = Math.sin(elapsed * 0.006) * 0.15 + 1;
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    
    ctx.shadowBlur = 35;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.fillText(t.ready, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.restore();
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.8})`;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText(`${t.level} 1`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    ctx.restore();
  }, [t.ready, t.level, drawGalagaEnemy]);

  const drawStageFlagSequence = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    if (!state.isInStageFlag) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.stageFlagStartTime;
    const progress = elapsed / state.stageFlagDuration;
    
    let alpha = 1;
    if (progress < 0.15) {
      alpha = progress / 0.15;
    } else if (progress > 0.85) {
      alpha = (1 - progress) / 0.15;
    }
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 25;
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.strokeText(`${t.level} 1`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.fillText(`${t.level} 1`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    const pulse = Math.sin(elapsed * 0.006) * 0.15 + 1;
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    
    ctx.shadowBlur = 35;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.fillText(`${t.level} 1`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.restore();
  }, [t.level]);

  const drawOutroSequence = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    if (!state.isInOutro) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - state.outroStartTime;
    const progress = elapsed / OUTRO_DURATION;
    
    let alpha = Math.min(1, progress * 2);
    
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.strokeText(t.gameOver, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.fillText(t.gameOver, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.restore();
  }, [t.gameOver]);

  const drawLevelTransition = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    
    if (state.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${state.fadeAlpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    if (state.levelTransitionPhase === 'message' || state.levelTransitionPhase === 'fadeIn') {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const nextLevel = state.level + 1;
      const message = `${t.nextLevel} ${nextLevel}`;
      const isBoss = isBossLevel(nextLevel);
      
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
      ctx.fillStyle = '#00ffff';
      ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
      
      if (isBoss) {
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.strokeText(t.bossLevel, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.fillStyle = '#ff0000';
        ctx.fillText(t.bossLevel, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
      }
      
      ctx.restore();
    }
  }, [t.nextLevel, t.bossLevel, isBossLevel]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 73 + Date.now() * 0.01) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    state.backgroundObjects.forEach(obj => {
      if (!obj.active) return;
      drawBackgroundObject(ctx, obj);
    });

    if (state.isInIntro) {
      drawIntroSequence(ctx);
      return;
    }

    if (state.isInStageFlag) {
      drawStageFlagSequence(ctx);
      return;
    }

    if (state.isInOutro) {
      if (state.player.active || state.player.isExploding) {
        drawPlayerSpaceship(ctx, state.player);
      }
      state.enemies.forEach(enemy => {
        if (!enemy.active) return;
        drawGalagaEnemy(ctx, enemy);
      });
      state.powerUps.forEach(powerUp => {
        if (!powerUp.active) return;
        drawPowerUp(ctx, powerUp);
      });
      state.explosions.forEach(explosion => {
        if (!explosion.active) return;
        drawExplosion(ctx, explosion);
      });
      ctx.fillStyle = '#ffffff';
      state.playerProjectiles.forEach(projectile => {
        if (projectile.active) {
          ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }
      });
      ctx.fillStyle = '#ff0000';
      state.enemyProjectiles.forEach(projectile => {
        if (projectile.active) {
          ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }
      });
      state.pointDisplays.forEach(pointDisplay => {
        if (!pointDisplay.active) return;
        drawPointDisplay(ctx, pointDisplay);
      });
      drawOutroSequence(ctx);
      return;
    }

    if (state.player.active || state.player.isExploding) {
      drawPlayerSpaceship(ctx, state.player);
    }

    state.enemies.forEach(enemy => {
      if (!enemy.active) return;
      drawGalagaEnemy(ctx, enemy);
    });

    state.powerUps.forEach(powerUp => {
      if (!powerUp.active) return;
      drawPowerUp(ctx, powerUp);
    });

    state.explosions.forEach(explosion => {
      if (!explosion.active) return;
      drawExplosion(ctx, explosion);
    });

    ctx.fillStyle = '#ffffff';
    state.playerProjectiles.forEach(projectile => {
      if (projectile.active) {
        ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
      }
    });

    ctx.fillStyle = '#ff0000';
    state.enemyProjectiles.forEach(projectile => {
      if (projectile.active) {
        ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
      }
    });

    state.pointDisplays.forEach(pointDisplay => {
      if (!pointDisplay.active) return;
      drawPointDisplay(ctx, pointDisplay);
    });

    if (state.isInLevelTransition) {
      drawLevelTransition(ctx);
    }
    
    if (state.showBonusLifeMessage) {
      drawBonusLifeMessage(ctx);
    }
  }, [drawPlayerSpaceship, drawGalagaEnemy, drawBackgroundObject, drawPowerUp, drawExplosion, drawPointDisplay, drawLevelTransition, drawIntroSequence, drawStageFlagSequence, drawOutroSequence, drawBonusLifeMessage]);

  const gameLoop = useCallback(() => {
    const state = gameStateRef.current;
    
    updateGame();
    render();
    
    if (state.gameRunning || state.isInLevelTransition || state.waitingForExplosions || state.isInIntro || state.isInStageFlag || state.isInOutro) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [updateGame, render]);

  const startGame = useCallback(async () => {
    try {
      stopGameLoop();
      await initializeAudio();
      
      resetGame();
      initializeBorderStars();
      
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      initializeEnemies();
      
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % CANVAS_WIDTH;
        const y = (i * 73) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 1, 1);
      }
      
      setGameState('intro');
      await startIntroSequence();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      
    } catch (error) {
      console.error('Failed to start game:', error);
      
      try {
        stopGameLoop();
        resetGame();
        initializeBorderStars();
        initializeEnemies();
        gameStateRef.current.gameRunning = true;
        
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 50; i++) {
              const x = (i * 37) % CANVAS_WIDTH;
              const y = (i * 73) % CANVAS_HEIGHT;
              ctx.fillRect(x, y, 1, 1);
            }
            drawPlayerSpaceship(ctx, gameStateRef.current.player);
            gameStateRef.current.enemies.forEach(enemy => {
              if (enemy.active) {
                drawGalagaEnemy(ctx, enemy);
              }
            });
          }
        }
        
        setGameState('intro');
        await startIntroSequence();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      } catch (fallbackError) {
        console.error('Fallback initialization also failed:', fallbackError);
        setGameState('intro');
        gameStateRef.current.gameRunning = true;
        await startIntroSequence();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    }
  }, [resetGame, initializeEnemies, gameLoop, initializeAudio, drawPlayerSpaceship, drawGalagaEnemy, stopGameLoop, startIntroSequence, initializeBorderStars]);

  const shoot = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.gameRunning || !state.player.active || state.player.isExploding || state.isInIntro || state.isInStageFlag) return;
    
    state.levelShotsFired++;
    achievementTrackerRef.current.trackShot();

    const doubleFire = state.powerUpEffects.some(effect => effect.type === 'doubleFire' && effect.active);
    
    if (doubleFire) {
      state.playerProjectiles.push({
        x: state.player.x + state.player.width / 2 - 6,
        y: state.player.y,
        width: 2,
        height: 8,
        active: true,
        dy: -PROJECTILE_SPEED,
        isPlayerProjectile: true
      });
      
      state.playerProjectiles.push({
        x: state.player.x + state.player.width / 2 + 4,
        y: state.player.y,
        width: 2,
        height: 8,
        active: true,
        dy: -PROJECTILE_SPEED,
        isPlayerProjectile: true
      });
    } else {
      state.playerProjectiles.push({
        x: state.player.x + state.player.width / 2 - 1,
        y: state.player.y,
        width: 2,
        height: 8,
        active: true,
        dy: -PROJECTILE_SPEED,
        isPlayerProjectile: true
      });
    }
    
    audioManagerRef.current.playShootSound();
    vibrationManagerRef.current.vibrateShoot();
  }, []);

  const handleSubmitScore = useCallback(async () => {
    if (nameInputValue.trim()) {
      setNameError('');
      
      try {
        await submitScore.mutateAsync({
          playerName: nameInputValue.trim(),
          score: BigInt(displayScore),
          difficulty: difficulty,
          level: BigInt(displayLevel)
        });
        setShowNameInput(false);
        setGameState('highScores');
        topScoresQuery.refetch();
      } catch (error) {
        console.error('Error submitting score:', error);
        
        if (error instanceof Error && error.message === 'NAME_REJECTED') {
          setNameError(t.nameRejected);
        } else {
          setNameError(t.nameError);
        }
      }
    }
  }, [nameInputValue, displayScore, difficulty, displayLevel, submitScore, topScoresQuery, t.nameRejected, t.nameError]);

  const toggleMute = useCallback(() => {
    const muted = audioManagerRef.current.toggleMute();
    setIsMuted(muted);
    localStorage.setItem('galaga-muted', String(muted));
  }, []);

  const handleBackToMenu = useCallback(() => {
    stopGameLoop();
    audioManagerRef.current.stopGameStartAudio();
    audioManagerRef.current.stopStageFlagAudio();
    vibrationManagerRef.current.stop();
    onBackToMenu();
  }, [stopGameLoop, onBackToMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    startGame();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      stopGameLoop();
      audioManagerRef.current.stopGameStartAudio();
      audioManagerRef.current.stopStageFlagAudio();
      vibrationManagerRef.current.stop();
    };
  }, [shoot, stopGameLoop, initializeAudio, startGame]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (!isMobileDevice()) return;
    
    const container = containerRef.current;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    container.appendChild(canvas);
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initializeBorderStars();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    let animationId: number;
    
    const renderStars = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      borderStarsRef.current.forEach(star => {
        ctx.save();
        ctx.globalAlpha = star.brightness;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = star.size * 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      animationId = requestAnimationFrame(renderStars);
    };
    
    renderStars();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
      container.removeChild(canvas);
    };
  }, [initializeBorderStars, isMobileDevice]);

  const handleTouchStart = useCallback((action: 'left' | 'right' | 'shoot') => {
    touchRef.current[action] = true;
    if (action === 'shoot') {
      shoot();
    }
  }, [shoot]);

  const handleTouchEnd = useCallback((action: 'left' | 'right' | 'shoot') => {
    touchRef.current[action] = false;
  }, []);

  const activePowerUps = gameStateRef.current.powerUpEffects.filter(effect => effect.active);

  if (gameState === 'highScores') {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="text-center max-w-4xl w-full">
          <h1 className="text-3xl font-bold text-yellow-400 mb-8 glow">{t.viewHighScores}</h1>
          <div className="bg-gray-900 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            {topScoresQuery.isLoading ? (
              <p className="text-gray-400">{t.loading}</p>
            ) : topScoresQuery.data && topScoresQuery.data.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-600 font-bold text-cyan-400 text-xs">
                  <span className="w-8">{t.rank}</span>
                  <span className="flex-1 text-center">{t.player}</span>
                  <span className="w-16 text-center">{t.points}</span>
                  <span className="w-16 text-center">{t.difficulty}</span>
                  <span className="w-12 text-center">Stage</span>
                </div>
                {topScoresQuery.data.map(([name, entry], index) => (
                  <div key={`${name}-${entry.timestamp}`} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0 text-xs">
                    <span className="text-yellow-400 font-bold w-8">{index + 1}.</span>
                    <span className="text-cyan-400 flex-1 text-center truncate px-1" title={name}>{name}</span>
                    <span className="text-yellow-400 font-bold w-16 text-center">{entry.score.toString()}</span>
                    <span className="text-orange-400 w-16 text-center text-xs">
                      {translateDifficulty(entry.difficulty)}
                    </span>
                    <span className="text-green-400 w-12 text-center">
                      {entry.level.toString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">{t.noScores}</p>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={handleBackToMenu}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button"
            >
              {t.backToMenu}
            </button>
            <button
              onClick={() => topScoresQuery.refetch()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors arcade-button"
              disabled={topScoresQuery.isFetching}
            >
              {topScoresQuery.isFetching ? t.refreshing : t.refreshLeaderboard}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-4 game-over-screen overflow-hidden">
        <div className="text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-400 mb-4 glow">{t.gameOver}</h1>
          <p className="text-xl text-yellow-400 mb-2">{t.score}: {displayScore}</p>
          <p className="text-lg text-cyan-400 mb-2">{t.level}: {displayLevel}</p>
          <p className="text-sm text-gray-400 mb-6">
            {t.difficulty}: {difficulty === 'einfach' && '🟢 ' + t.einfach}
            {difficulty === 'mittel' && '🟡 ' + t.mittel}
            {difficulty === 'schwer' && '🔴 ' + t.schwer}
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={nameInputValue}
              onChange={(e) => {
                setNameInputValue(e.target.value);
                if (nameError) {
                  setNameError('');
                }
              }}
              placeholder={t.enterName}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
              maxLength={20}
            />
            {nameError && (
              <p className="text-red-400 text-sm mt-2">{nameError}</p>
            )}
            <button
              onClick={handleSubmitScore}
              disabled={!nameInputValue.trim() || submitScore.isPending}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors arcade-button"
            >
              {submitScore.isPending ? t.submitting : t.submitScore}
            </button>
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors arcade-button"
            >
              {t.backToMenu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden" style={{ position: 'relative' }}>
      {/* Achievement Notifications */}
      {activeNotifications.map((notification) => {
        const currentTime = Date.now();
        const elapsed = currentTime - notification.startTime;
        const progress = elapsed / notification.duration;
        
        let opacity = 1;
        let translateY = 0;
        
        if (progress < 0.15) {
          opacity = progress / 0.15;
          translateY = -20 * (1 - opacity);
        } else if (progress > 0.85) {
          opacity = (1 - progress) / 0.15;
          translateY = -20 * (1 - opacity);
        }
        
        return (
          <div
            key={notification.id}
            className="fixed left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
            style={{
              top: '60px',
              opacity,
              transform: `translate(-50%, ${translateY}px)`,
              transition: 'opacity 0.3s ease, transform 0.3s ease'
            }}
          >
            <div className="bg-black/60 backdrop-blur-sm border border-yellow-400/70 rounded-lg shadow-lg px-3 py-2 max-w-xs mx-auto flex items-center gap-2"
              style={{
                boxShadow: '0 0 12px rgba(255, 215, 0, 0.3)'
              }}
            >
              <div className="text-yellow-400 text-xl shrink-0">🏆</div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-yellow-400 font-bold text-xs truncate">
                  {notification.name}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-col items-center h-full w-full max-w-md" style={{ position: 'relative', zIndex: 2 }}>
        <div className="flex justify-between w-full px-4 py-2 text-sm shrink-0">
          <span className="text-cyan-400">{t.score}: {displayScore}</span>
          <span className="text-yellow-400">{t.lives}: {displayLives}</span>
          <span className="text-green-400">{t.level}: {displayLevel}</span>
        </div>

        <div className="flex justify-between w-full px-4 pb-2 text-xs shrink-0">
          <div className="text-orange-400">
            {difficulty === 'einfach' && '🟢 ' + t.einfach}
            {difficulty === 'mittel' && '🟡 ' + t.mittel}
            {difficulty === 'schwer' && '🔴 ' + t.schwer}
          </div>
          {activePowerUps.length > 0 && (
            <div className="flex space-x-2">
              {activePowerUps.map((effect, index) => {
                const timeLeft = Math.max(0, Math.ceil((effect.endTime - Date.now()) / 1000));
                return (
                  <div key={index} className={`px-2 py-1 rounded ${
                    effect.type === 'doubleFire' ? 'bg-orange-600' : 
                    effect.type === 'shield' ? 'bg-blue-600' : 
                    'bg-purple-600'
                  }`}>
                    {effect.type === 'doubleFire' ? t.doubleFire : 
                     effect.type === 'shield' ? t.shield : 
                     t.magnet}: {timeLeft}s
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center w-full px-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-gray-600 bg-black max-w-full h-auto"
            style={{ position: 'relative', zIndex: 2 }}
          />
        </div>

        <div className="flex justify-between items-center w-full px-4 py-3 shrink-0">
          <div className="flex space-x-2">
            <button
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-lg transition-colors select-none game-control mobile-control-wide flex items-center justify-center overflow-hidden"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', width: '80px', height: '80px', padding: '0' }}
            >
              <img src="/assets/generated/left-arrow-icon-blue-large.png" alt={t.left} className="pointer-events-none" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </button>
            <button
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-lg transition-colors select-none game-control mobile-control-wide flex items-center justify-center overflow-hidden"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', width: '80px', height: '80px', padding: '0' }}
            >
              <img src="/assets/generated/right-arrow-icon-blue-large.png" alt={t.right} className="pointer-events-none" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </button>
          </div>

          <button
            onTouchStart={() => handleTouchStart('shoot')}
            onTouchEnd={() => handleTouchEnd('shoot')}
            onMouseDown={() => handleTouchStart('shoot')}
            onMouseUp={() => handleTouchEnd('shoot')}
            className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-lg transition-colors select-none game-control mobile-control-wide flex items-center justify-center overflow-hidden"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', width: '120px', height: '80px', padding: '0' }}
          >
            <img src="/assets/schiessenButtonRot.webp" alt={t.fire} className="pointer-events-none" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </button>
        </div>

        <div className="flex space-x-2 pb-3 shrink-0">
          <button
            onClick={handleBackToMenu}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded text-sm transition-colors arcade-button"
          >
            {t.backToMenu}
          </button>
          <button
            onClick={toggleMute}
            className={`${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white font-bold py-2 px-4 rounded text-sm transition-colors arcade-button`}
          >
            {isMuted ? t.soundOff : t.soundOn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalagaGame;
