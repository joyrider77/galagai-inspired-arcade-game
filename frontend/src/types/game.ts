export type Difficulty = 'einfach' | 'mittel' | 'schwer';
export type Language = 'de' | 'en';

export interface Position {
  x: number;
  y: number;
}

export interface GameObject extends Position {
  width: number;
  height: number;
  active: boolean;
}

export interface Player extends GameObject {
  lives: number;
  isExploding: boolean;
  explosionFrame: number;
  respawnTimer: number;
}

export type EnemyType = 'grunt' | 'officer' | 'boss' | 'diver' | 'zigzag' | 'formation' | 'heavy';
export type MovePattern = 'formation' | 'diving' | 'attacking' | 'zigzag' | 'groupFly' | 'heavy' | 'orbit' | 'shield-orbit' | 'teleport' | 'swarm';
export type DiverFormationPattern = 'circular' | 'v-formation' | 'diamond' | 'spiral' | 'zigzag-group' | 'wave' | 'figure-8' | 'cross' | 'star' | 'multi-phase';

export interface Enemy extends GameObject {
  type: EnemyType;
  points: number;
  movePattern: MovePattern;
  originalX: number;
  originalY: number;
  angle: number;
  health: number;
  maxHealth: number;
  zigzagDirection: number;
  formationIndex: number;
  diveSpeed: number;
  lastShotTime: number;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  isBoss?: boolean;
  bossType?: number;
  diverGroupId?: number;
  diverFormationPattern?: DiverFormationPattern;
  diverPhase?: number;
  diverGroupAngle?: number;
  teleportTimer?: number;
  lastTeleportTime?: number;
  shieldActive?: boolean;
  shieldRotation?: number;
}

export interface Projectile extends GameObject {
  dy: number;
  dx?: number;
  isPlayerProjectile: boolean;
  isSpread?: boolean;
}

export type PowerUpType = 'doubleFire' | 'shield' | 'invincibility' | 'rapidFire' | 'spreadShot' | 'magnet' | 'slowMotion';

export interface PowerUp extends GameObject {
  type: PowerUpType;
  spawnTime: number;
  duration: number;
  dy: number;
  isBeingAttracted?: boolean;
}

export interface Explosion extends Position {
  frame: number;
  maxFrames: number;
  active: boolean;
}

export interface PowerUpEffect {
  type: PowerUpType;
  endTime: number;
  active: boolean;
  magnetCollectedCount?: number;
}

export interface BackgroundObject extends Position {
  type: 'planet' | 'spaceship' | 'asteroid';
  size: number;
  color: string;
  speed: number;
  opacity: number;
  angle: number;
  rotationSpeed: number;
  active: boolean;
}

export interface PointDisplay extends Position {
  points: number;
  startTime: number;
  duration: number;
  active: boolean;
  velocity: { x: number; y: number };
}

export interface BorderStar extends Position {
  size: number;
  baseSize: number;
  brightness: number;
  baseBrightness: number;
  pulseSpeed: number;
  pulseOffset: number;
}

export interface AchievementNotification {
  id: string;
  name: string;
  description: string;
  startTime: number;
  duration: number;
  active: boolean;
}

export type GameState = 'playing' | 'gameOver' | 'highScores' | 'levelTransition' | 'intro' | 'stageFlag' | 'outro';
