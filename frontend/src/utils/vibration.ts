// Vibration Manager for haptic feedback on supported devices
export class VibrationManager {
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
  }

  vibrate(pattern: number | number[]): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.debug('Vibration not available:', error);
    }
  }

  vibrateShoot(): void {
    this.vibrate(50);
  }

  vibrateDamage(): void {
    this.vibrate(250);
  }

  vibratePowerUp(): void {
    this.vibrate(120);
  }

  vibrateBossDefeat(): void {
    this.vibrate([100, 50, 100, 50, 200]);
  }

  vibrateExtraLife(): void {
    this.vibrate([150, 100, 150, 100, 150]);
  }

  vibrateUpgrade(): void {
    this.vibrate([80, 60, 80, 60, 120]);
  }

  vibrateDoubleShip(): void {
    this.vibrate([100, 80, 100]);
  }

  vibrateAchievementUnlock(): void {
    this.vibrate([100, 50, 100, 50, 150, 50, 200]);
  }

  vibratePointEarned(): void {
    this.vibrate(30);
  }

  stop(): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(0);
    } catch (error) {
      console.debug('Could not stop vibration:', error);
    }
  }
}
