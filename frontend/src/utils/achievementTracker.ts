export interface AchievementProgress {
  fast_hunter: { count: number; startTime: number };
  first_boss: { defeated: boolean };
  millionaire: { reached: boolean };
  boss_master: { types: Set<number> };
  survivor: { levelsWithoutDeath: number };
  double_power: { activated: boolean };
  collector: { powerUpsCollected: number };
  precision_shooter: { shots: number; hits: number };
  endurance_champion: { startTime: number };
  perfectionist: { damageTaken: boolean };
  magnet_master: { magnetCollectedCount: number };
}

export class AchievementTracker {
  private progress: AchievementProgress;
  private callbacks: Map<string, (achievementId: string, progress: number, bossType?: number) => void>;
  private unlockedThisSession: Set<string>;
  private unlockCooldowns: Map<string, number>;
  private cooldownDuration = 1000; // 1 second cooldown per achievement

  constructor() {
    this.progress = {
      fast_hunter: { count: 0, startTime: 0 },
      first_boss: { defeated: false },
      millionaire: { reached: false },
      boss_master: { types: new Set() },
      survivor: { levelsWithoutDeath: 0 },
      double_power: { activated: false },
      collector: { powerUpsCollected: 0 },
      precision_shooter: { shots: 0, hits: 0 },
      endurance_champion: { startTime: Date.now() },
      perfectionist: { damageTaken: false },
      magnet_master: { magnetCollectedCount: 0 },
    };
    this.callbacks = new Map();
    this.unlockedThisSession = new Set();
    this.unlockCooldowns = new Map();
  }

  onAchievementProgress(achievementId: string, callback: (achievementId: string, progress: number, bossType?: number) => void) {
    this.callbacks.set(achievementId, callback);
  }

  private notifyProgress(achievementId: string, progress: number, bossType?: number) {
    // Check cooldown to prevent spam
    const now = Date.now();
    const lastUnlock = this.unlockCooldowns.get(achievementId) || 0;
    
    if (now - lastUnlock < this.cooldownDuration) {
      return; // Skip if within cooldown period
    }
    
    this.unlockCooldowns.set(achievementId, now);
    this.unlockedThisSession.add(achievementId);
    
    // Set flag in localStorage to trigger animation on start page
    try {
      localStorage.setItem('galagai_new_achievements', 'true');
    } catch (error) {
      console.error('Error setting new achievements flag:', error);
    }
    
    const callback = this.callbacks.get(achievementId);
    if (callback) {
      callback(achievementId, progress, bossType);
    }
  }

  getUnlockedThisSession(): string[] {
    return Array.from(this.unlockedThisSession);
  }

  trackEnemyKill() {
    const now = Date.now();
    if (this.progress.fast_hunter.startTime === 0) {
      this.progress.fast_hunter.startTime = now;
      this.progress.fast_hunter.count = 1;
    } else if (now - this.progress.fast_hunter.startTime <= 8000) {
      this.progress.fast_hunter.count++;
      if (this.progress.fast_hunter.count >= 15) {
        this.notifyProgress('fast_hunter', 15);
        this.progress.fast_hunter.count = 0;
        this.progress.fast_hunter.startTime = 0;
      }
    } else {
      this.progress.fast_hunter.startTime = now;
      this.progress.fast_hunter.count = 1;
    }
  }

  trackBossDefeat(bossType: number) {
    if (!this.progress.first_boss.defeated) {
      this.progress.first_boss.defeated = true;
      this.notifyProgress('first_boss', 1);
    }

    const previousSize = this.progress.boss_master.types.size;
    this.progress.boss_master.types.add(bossType);
    
    // Only notify if a new boss type was added
    if (this.progress.boss_master.types.size > previousSize) {
      if (this.progress.boss_master.types.size >= 5) {
        this.notifyProgress('boss_master', 5, bossType);
      }
    }
  }

  trackScore(score: number) {
    if (score >= 1000000 && !this.progress.millionaire.reached) {
      this.progress.millionaire.reached = true;
      this.notifyProgress('millionaire', 1000000);
    }
  }

  trackLevelComplete(damageTaken: boolean) {
    if (!damageTaken) {
      this.progress.survivor.levelsWithoutDeath++;
      if (this.progress.survivor.levelsWithoutDeath >= 10) {
        this.notifyProgress('survivor', 10);
      }

      if (!this.progress.perfectionist.damageTaken) {
        this.notifyProgress('perfectionist', 1);
      }
    } else {
      this.progress.survivor.levelsWithoutDeath = 0;
    }

    this.progress.perfectionist.damageTaken = false;
  }

  trackDamage() {
    this.progress.perfectionist.damageTaken = true;
    this.progress.survivor.levelsWithoutDeath = 0;
  }

  trackDoubleShipActivation() {
    if (!this.progress.double_power.activated) {
      this.progress.double_power.activated = true;
      this.notifyProgress('double_power', 1);
    }
  }

  trackPowerUpCollected() {
    this.progress.collector.powerUpsCollected++;
    if (this.progress.collector.powerUpsCollected >= 20) {
      this.notifyProgress('collector', 20);
    }
  }

  trackMagnetCollectedPowerUp() {
    this.progress.magnet_master.magnetCollectedCount++;
    if (this.progress.magnet_master.magnetCollectedCount >= 10) {
      this.notifyProgress('magnet_master', 10);
    }
  }

  trackShot() {
    this.progress.precision_shooter.shots++;
  }

  trackHit() {
    this.progress.precision_shooter.hits++;
    const accuracy = (this.progress.precision_shooter.hits / this.progress.precision_shooter.shots) * 100;
    if (accuracy >= 90 && this.progress.precision_shooter.shots >= 10) {
      this.notifyProgress('precision_shooter', 90);
    }
  }

  trackPlaytime() {
    const playtime = (Date.now() - this.progress.endurance_champion.startTime) / 1000 / 60;
    if (playtime >= 30) {
      this.notifyProgress('endurance_champion', 30);
    }
  }

  resetSession() {
    this.progress.fast_hunter = { count: 0, startTime: 0 };
    this.progress.collector.powerUpsCollected = 0;
    this.progress.precision_shooter = { shots: 0, hits: 0 };
    this.progress.endurance_champion.startTime = Date.now();
    this.progress.perfectionist.damageTaken = false;
    this.progress.survivor.levelsWithoutDeath = 0;
    this.progress.magnet_master.magnetCollectedCount = 0;
    this.unlockedThisSession.clear();
    this.unlockCooldowns.clear();
  }

  getProgress() {
    return { ...this.progress };
  }
}
