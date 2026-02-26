// Enhanced Audio Manager with custom audio assets and achievement/point sounds
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private gameStartAudio: HTMLAudioElement | null = null;
  private stageFlagAudio: HTMLAudioElement | null = null;
  private shootingAudio: HTMLAudioElement | null = null;
  private enemyAttackAudio: HTMLAudioElement | null = null;
  private diverAttackAudio: HTMLAudioElement | null = null;
  private magnetCollectAudio: HTMLAudioElement | null = null;
  private isMuted = false;
  private isInitialized = false;
  private activeShootingSounds: Set<HTMLAudioElement> = new Set();
  private lastAttackSoundTime = 0;
  private attackSoundCooldown = 300; // Minimum ms between attack sounds
  private lastDiverAttackSoundTime = 0;
  private diverAttackSoundCooldown = 400; // Minimum ms between diver attack sounds
  private lastPointSoundTime = 0;
  private pointSoundCooldown = 50; // Minimum ms between point sounds
  private lastMagnetSoundTime = 0;
  private magnetSoundCooldown = 200; // Minimum ms between magnet sounds

  async initialize(initialMuted: boolean = false): Promise<void> {
    if (this.isInitialized) return;

    this.isMuted = initialMuted;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.generateSounds();
      await this.loadCustomAudioAssets();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private async loadCustomAudioAssets(): Promise<void> {
    try {
      // Load game start audio
      this.gameStartAudio = new Audio('/assets/Galaga%20Game%20Start.m4a');
      this.gameStartAudio.preload = 'auto';
      await this.gameStartAudio.load();

      // Load stage flag audio
      this.stageFlagAudio = new Audio('/assets/Galaga%20Stage%20Flag.m4a');
      this.stageFlagAudio.preload = 'auto';
      await this.stageFlagAudio.load();

      // Load shooting audio
      this.shootingAudio = new Audio('/assets/Galaga%20Shooting.m4a');
      this.shootingAudio.preload = 'auto';
      await this.shootingAudio.load();

      // Load diver enemy attack audio
      this.diverAttackAudio = new Audio('/assets/Galaga%20Enemy%20flying.m4a');
      this.diverAttackAudio.preload = 'auto';
      await this.diverAttackAudio.load();

      // Generate enemy attack sound (synthesized for attention-grabbing effect)
      await this.generateEnemyAttackSound();
      
      // Generate magnet collect sound (synthesized)
      await this.generateMagnetCollectSound();
    } catch (error) {
      console.warn('Failed to load custom audio assets:', error);
    }
  }

  private async generateEnemyAttackSound(): Promise<void> {
    // Create a distinct, attention-grabbing sound for enemy attacks
    try {
      this.enemyAttackAudio = new Audio();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 0.4;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Create a distinctive "dive" sound with descending pitch
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        
        // Descending frequency from 800Hz to 200Hz
        const frequency = 800 - (600 * progress);
        
        // Add harmonics for richness
        const fundamental = Math.sin(2 * Math.PI * frequency * t);
        const harmonic2 = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.4;
        const harmonic3 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
        
        // Envelope with quick attack and sustain
        const attack = Math.min(1, t * 20);
        const decay = Math.exp(-t * 2);
        const envelope = attack * decay;
        
        // Add slight distortion for aggression
        const signal = (fundamental + harmonic2 + harmonic3) * envelope;
        data[i] = Math.tanh(signal * 1.5) * 0.5;
      }

      // Convert buffer to WAV blob
      const wavBlob = this.bufferToWave(buffer, sampleRate);
      const url = URL.createObjectURL(wavBlob);
      this.enemyAttackAudio.src = url;
      this.enemyAttackAudio.preload = 'auto';
      await this.enemyAttackAudio.load();
    } catch (error) {
      console.warn('Failed to generate enemy attack sound:', error);
    }
  }

  private async generateMagnetCollectSound(): Promise<void> {
    // Create a distinctive magnetic "whoosh" sound
    try {
      this.magnetCollectAudio = new Audio();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 0.6;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Create a magnetic attraction sound with rising pitch and whoosh effect
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        
        // Rising frequency from 200Hz to 1200Hz (magnetic pull effect)
        const frequency = 200 + (1000 * progress);
        
        // Add harmonics for richness
        const fundamental = Math.sin(2 * Math.PI * frequency * t);
        const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
        const harmonic3 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15;
        
        // Whoosh noise component
        const noise = (Math.random() - 0.5) * 0.2 * Math.exp(-progress * 3);
        
        // Envelope with quick attack and gradual decay
        const attack = Math.min(1, t * 30);
        const decay = Math.exp(-t * 2.5);
        const envelope = attack * decay;
        
        // Combine all components
        const signal = (fundamental + harmonic2 + harmonic3 + noise) * envelope;
        data[i] = Math.tanh(signal * 1.3) * 0.6;
      }

      // Convert buffer to WAV blob
      const wavBlob = this.bufferToWave(buffer, sampleRate);
      const url = URL.createObjectURL(wavBlob);
      this.magnetCollectAudio.src = url;
      this.magnetCollectAudio.preload = 'auto';
      await this.magnetCollectAudio.load();
    } catch (error) {
      console.warn('Failed to generate magnet collect sound:', error);
    }
  }

  private bufferToWave(buffer: AudioBuffer, sampleRate: number): Blob {
    const length = buffer.length;
    const data = buffer.getChannelData(0);
    const wav = new ArrayBuffer(44 + length * 2);
    const view = new DataView(wav);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([wav], { type: 'audio/wav' });
  }

  private generateSounds(): void {
    if (!this.audioContext) return;

    try {
      // Keep only the sounds that aren't replaced by custom audio
      this.sounds.set('enemyHit', this.generateSciFiEnemyExplosionSound());
      this.sounds.set('playerExplosion', this.generatePlayerExplosionSound());
      this.sounds.set('gameOver', this.generateGameOverSound());
      this.sounds.set('powerUpCollect', this.generatePowerUpSound());
      this.sounds.set('bonusLife', this.generateBonusLifeSound());
      this.sounds.set('achievement', this.generateAchievementUnlockSound());
      this.sounds.set('pointEarned', this.generatePointEarnedSound());
    } catch (error) {
      console.warn('Sound generation failed:', error);
    }
  }

  private generateSciFiEnemyExplosionSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.getChannelData(1);

    for (let i = 0; i < leftData.length; i++) {
      const t = i / sampleRate;
      const bassPulseFreq = 45 + Math.sin(t * 8) * 15;
      const bassPulse = Math.sin(2 * Math.PI * bassPulseFreq * t) * 0.6;
      const shimmerFreq1 = 2400 + Math.sin(t * 12) * 400;
      const shimmerFreq2 = 3200 + Math.cos(t * 16) * 300;
      const shimmerFreq3 = 4800 + Math.sin(t * 20) * 200;
      const shimmer1 = Math.sin(2 * Math.PI * shimmerFreq1 * t) * 0.15;
      const shimmer2 = Math.sin(2 * Math.PI * shimmerFreq2 * t) * 0.12;
      const shimmer3 = Math.sin(2 * Math.PI * shimmerFreq3 * t) * 0.08;
      const metallicShimmer = (shimmer1 + shimmer2 + shimmer3) * Math.exp(-t * 4);
      const midFreq = 180 + Math.sin(t * 6) * 40;
      const midTone = Math.sin(2 * Math.PI * midFreq * t) * 0.3;
      const instantAttack = Math.min(1, t * 100);
      const primaryDecay = Math.exp(-t * 3.5);
      const envelope = instantAttack * primaryDecay;
      const echoDelay = 0.08;
      const echoSample = Math.floor(i - (echoDelay * sampleRate));
      let echoComponent = 0;
      if (echoSample >= 0 && echoSample < leftData.length) {
        echoComponent = (bassPulse + midTone) * 0.25 * Math.exp(-t * 2);
      }
      const primarySound = (bassPulse + midTone + metallicShimmer) * envelope;
      const finalSound = primarySound + echoComponent;
      const stereoMovement = Math.sin(t * 4) * 0.15;
      const stereoWidth = 0.8;
      const compressedSound = Math.tanh(finalSound * 1.2) * 0.65;
      leftData[i] = compressedSound * (stereoWidth + stereoMovement);
      rightData[i] = compressedSound * (stereoWidth - stereoMovement);
    }

    return buffer;
  }

  private generatePlayerExplosionSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() - 0.5) * 2;
      const lowFreq = Math.sin(2 * Math.PI * 60 * t);
      const envelope = Math.exp(-t * 3);
      data[i] = (noise * 0.7 + lowFreq * 0.3) * envelope * 0.5;
    }

    return buffer;
  }

  private generateGameOverSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 220 - (t * 80);
      const envelope = Math.exp(-t * 2);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }

    return buffer;
  }

  private generatePowerUpSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 440 + (t * 880);
      const envelope = Math.exp(-t * 3);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }

    return buffer;
  }

  private generateBonusLifeSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const noteDuration = duration / notes.length;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteDuration);
      const noteTime = t - (noteIndex * noteDuration);
      const frequency = notes[noteIndex] || notes[notes.length - 1];
      const attack = Math.min(1, noteTime * 10);
      const sustain = noteTime < noteDuration * 0.7 ? 1 : Math.exp(-(noteTime - noteDuration * 0.7) * 8);
      const envelope = attack * sustain;
      data[i] = Math.sin(2 * Math.PI * frequency * noteTime) * envelope * 0.4;
    }

    return buffer;
  }

  private generateAchievementUnlockSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.2;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Celebratory ascending arpeggio with sparkle
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    const noteDuration = duration / notes.length;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteDuration);
      const noteTime = t - (noteIndex * noteDuration);
      const frequency = notes[noteIndex] || notes[notes.length - 1];
      
      // Main tone
      const fundamental = Math.sin(2 * Math.PI * frequency * noteTime);
      // Harmonic for richness
      const harmonic = Math.sin(2 * Math.PI * frequency * 2 * noteTime) * 0.3;
      // Sparkle effect
      const sparkle = Math.sin(2 * Math.PI * frequency * 4 * noteTime) * 0.15 * Math.exp(-noteTime * 8);
      
      const attack = Math.min(1, noteTime * 20);
      const sustain = noteTime < noteDuration * 0.6 ? 1 : Math.exp(-(noteTime - noteDuration * 0.6) * 6);
      const envelope = attack * sustain;
      
      data[i] = (fundamental + harmonic + sparkle) * envelope * 0.5;
    }

    return buffer;
  }

  private generatePointEarnedSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Short, pleasant "ding" sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = 880; // A5
      const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      const fundamental = Math.sin(2 * Math.PI * frequency * t);
      const attack = Math.min(1, t * 50);
      const decay = Math.exp(-t * 12);
      const envelope = attack * decay;
      data[i] = (fundamental + harmonic) * envelope * 0.3;
    }

    return buffer;
  }

  async playGameStartAudio(): Promise<number> {
    if (!this.isInitialized || this.isMuted || !this.gameStartAudio) return 3000;
    
    try {
      // Stop any existing playback first
      this.stopGameStartAudio();
      
      // Reset to beginning
      this.gameStartAudio.currentTime = 0;
      
      // Play the audio
      await this.gameStartAudio.play();
      
      return this.gameStartAudio.duration * 1000;
    } catch (error) {
      console.warn('Failed to play game start audio:', error);
      return 3000;
    }
  }

  stopGameStartAudio(): void {
    if (this.gameStartAudio) {
      try {
        this.gameStartAudio.pause();
        this.gameStartAudio.currentTime = 0;
      } catch (error) {
        console.debug('Could not stop game start audio:', error);
      }
    }
  }

  async playStageFlagAudio(): Promise<number> {
    if (!this.isInitialized || this.isMuted || !this.stageFlagAudio) return 3000;
    
    try {
      // Stop any existing playback first
      this.stopStageFlagAudio();
      
      // Reset to beginning
      this.stageFlagAudio.currentTime = 0;
      
      // Play the audio
      await this.stageFlagAudio.play();
      
      return this.stageFlagAudio.duration * 1000;
    } catch (error) {
      console.warn('Failed to play stage flag audio:', error);
      return 3000;
    }
  }

  stopStageFlagAudio(): void {
    if (this.stageFlagAudio) {
      try {
        this.stageFlagAudio.pause();
        this.stageFlagAudio.currentTime = 0;
      } catch (error) {
        console.debug('Could not stop stage flag audio:', error);
      }
    }
  }

  async playShootSound(): Promise<void> {
    if (!this.isInitialized || this.isMuted || !this.shootingAudio) return;
    
    try {
      // Create a new audio instance for each shot to allow rapid fire without cutting off
      const shootSound = this.shootingAudio.cloneNode() as HTMLAudioElement;
      shootSound.volume = 0.6;
      
      // Track active sounds
      this.activeShootingSounds.add(shootSound);
      
      // Clean up when sound ends
      shootSound.addEventListener('ended', () => {
        this.activeShootingSounds.delete(shootSound);
      });
      
      // Play immediately
      await shootSound.play();
    } catch (error) {
      console.warn('Failed to play shooting sound:', error);
    }
  }

  async playEnemyAttackSound(): Promise<void> {
    if (!this.isInitialized || this.isMuted || !this.enemyAttackAudio) return;
    
    // Implement cooldown to prevent sound overlap and performance issues
    const currentTime = Date.now();
    if (currentTime - this.lastAttackSoundTime < this.attackSoundCooldown) {
      return;
    }
    
    this.lastAttackSoundTime = currentTime;
    
    try {
      // Clone the audio for overlapping sounds (but controlled by cooldown)
      const attackSound = this.enemyAttackAudio.cloneNode() as HTMLAudioElement;
      attackSound.volume = 0.5; // Slightly lower volume to not overpower other sounds
      
      // Play immediately
      await attackSound.play();
    } catch (error) {
      console.warn('Failed to play enemy attack sound:', error);
    }
  }

  async playDiverAttackSound(): Promise<void> {
    if (!this.isInitialized || this.isMuted || !this.diverAttackAudio) return;
    
    // Implement cooldown to prevent excessive overlap when multiple divers attack
    const currentTime = Date.now();
    if (currentTime - this.lastDiverAttackSoundTime < this.diverAttackSoundCooldown) {
      return;
    }
    
    this.lastDiverAttackSoundTime = currentTime;
    
    try {
      // Clone the audio for overlapping sounds (but controlled by cooldown)
      const diverSound = this.diverAttackAudio.cloneNode() as HTMLAudioElement;
      diverSound.volume = 0.55; // Slightly lower volume to not overpower other sounds
      
      // Play immediately
      await diverSound.play();
    } catch (error) {
      console.warn('Failed to play diver attack sound:', error);
    }
  }

  async playMagnetCollectSound(): Promise<void> {
    if (!this.isInitialized || this.isMuted || !this.magnetCollectAudio) return;
    
    // Implement cooldown to prevent sound spam
    const currentTime = Date.now();
    if (currentTime - this.lastMagnetSoundTime < this.magnetSoundCooldown) {
      return;
    }
    
    this.lastMagnetSoundTime = currentTime;
    
    try {
      // Clone the audio for overlapping sounds (but controlled by cooldown)
      const magnetSound = this.magnetCollectAudio.cloneNode() as HTMLAudioElement;
      magnetSound.volume = 0.5;
      
      // Play immediately
      await magnetSound.play();
    } catch (error) {
      console.warn('Failed to play magnet collect sound:', error);
    }
  }

  async playAchievementUnlockSound(): Promise<void> {
    if (!this.isInitialized || this.isMuted) return;
    await this.playSound('achievement');
  }

  async playPointEarnedSound(): Promise<void> {
    if (!this.isInitialized || this.isMuted) return;
    
    // Implement cooldown to prevent sound spam
    const currentTime = Date.now();
    if (currentTime - this.lastPointSoundTime < this.pointSoundCooldown) {
      return;
    }
    
    this.lastPointSoundTime = currentTime;
    await this.playSound('pointEarned');
  }

  async playSound(soundName: string): Promise<void> {
    if (!this.isInitialized || !this.audioContext || this.isMuted) return;
    
    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      
      if (soundName === 'enemyHit' && buffer.numberOfChannels === 2) {
        const masterGain = this.audioContext.createGain();
        masterGain.gain.value = 0.75;
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = (Math.random() - 0.5) * 0.4;
        const delay1 = this.audioContext.createDelay(0.2);
        delay1.delayTime.value = 0.08;
        const echoGain = this.audioContext.createGain();
        echoGain.gain.value = 0.2;
        const lowPass = this.audioContext.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 4000;
        lowPass.Q.value = 0.5;
        source.connect(masterGain);
        masterGain.connect(panner);
        panner.connect(this.audioContext.destination);
        panner.connect(delay1);
        delay1.connect(echoGain);
        echoGain.connect(lowPass);
        lowPass.connect(this.audioContext.destination);
      } else {
        source.connect(this.audioContext.destination);
      }
      
      source.start(0);
    } catch (error) {
      console.warn('Failed to play sound:', soundName);
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopGameStartAudio();
      this.stopStageFlagAudio();
      // Stop all active shooting sounds
      this.activeShootingSounds.forEach(sound => {
        try {
          sound.pause();
          sound.currentTime = 0;
        } catch (error) {
          console.debug('Could not stop shooting sound:', error);
        }
      });
      this.activeShootingSounds.clear();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopGameStartAudio();
      this.stopStageFlagAudio();
      // Stop all active shooting sounds
      this.activeShootingSounds.forEach(sound => {
        try {
          sound.pause();
          sound.currentTime = 0;
        } catch (error) {
          console.debug('Could not stop shooting sound:', error);
        }
      });
      this.activeShootingSounds.clear();
    }
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }
}
