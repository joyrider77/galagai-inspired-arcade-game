import { Difficulty } from '../types/game';

// Canvas dimensions
export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 480;

// Player constants
export const PLAYER_SPEED = 2.5;
export const PLAYER_EXPLOSION_FRAMES = 12;
export const RESPAWN_DELAY = 2000;

// Projectile constants
export const PROJECTILE_SPEED = 6;
export const RAPID_FIRE_SPEED = 8;
export const SPREAD_SHOT_ANGLE = Math.PI / 8;

// Power-up constants
export const POWERUP_LIFETIME = 8000;
export const POWERUP_FALL_SPEED = 2;
export const DOUBLE_FIRE_DURATION = 10000;
export const SHIELD_DURATION = 15000;
export const INVINCIBILITY_DURATION = 8000;
export const RAPID_FIRE_DURATION = 12000;
export const SPREAD_SHOT_DURATION = 10000;
export const MAGNET_DURATION = 8000;
export const SLOW_MOTION_DURATION = 10000;
export const MAGNET_RANGE = 150;
export const SLOW_MOTION_FACTOR = 0.5;

// Level transition constants
export const LEVEL_TRANSITION_FADE_OUT_DURATION = 2000;
export const LEVEL_TRANSITION_MESSAGE_DURATION = 1000;
export const LEVEL_TRANSITION_FADE_IN_DURATION = 1000;
export const LEVEL_TRANSITION_DELAY = 1000;

// Display constants
export const POINT_DISPLAY_DURATION = 2500;
export const OUTRO_DURATION = 3000;
export const INTRO_EXTENSION_DURATION = 2000;
export const ACHIEVEMENT_NOTIFICATION_DURATION = 1500;

// Boss constants
export const BOSS_TELEPORT_INTERVAL = 3000;
export const BOSS_SHIELD_ROTATION_SPEED = 0.05;

// Difficulty settings
export const DIFFICULTY_SETTINGS: Record<Difficulty, {
  enemySpeed: number;
  enemyFireRate: number;
  enemiesPerWave: number;
  scoreMultiplier: number;
}> = {
  einfach: {
    enemySpeed: 0.4,
    enemyFireRate: 0.0003,
    enemiesPerWave: 0.7,
    scoreMultiplier: 1.0
  },
  mittel: {
    enemySpeed: 1.5,
    enemyFireRate: 0.0015,
    enemiesPerWave: 1.2,
    scoreMultiplier: 1.5
  },
  schwer: {
    enemySpeed: 2.0,
    enemyFireRate: 0.002,
    enemiesPerWave: 1.5,
    scoreMultiplier: 2.0
  }
};

// Diver enemy formation patterns
export const DIVER_FORMATION_PATTERNS = [
  'circular',
  'v-formation',
  'diamond',
  'spiral',
  'zigzag-group',
  'wave',
  'figure-8',
  'cross',
  'star',
  'multi-phase'
] as const;

export type DiverFormationPattern = typeof DIVER_FORMATION_PATTERNS[number];
