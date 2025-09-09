/**
 * Sound Alerts Utility
 * Provides audio feedback for admin notifications using Web Audio API
 * Supports different priority levels with unique sounds
 */
class SoundAlerts {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.3;
    this.initialized = false;
    this.started = false; // Defer init until a user gesture
  }

  /**
   * Initialize Web Audio API
   */
  async init() {
    try {
      // Check if Web Audio API is supported
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.log('Sound alerts: Web Audio API not supported');
        return;
      }

      if (!this.audioContext) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtor();
      }

      // Resume audio context if suspended (required for Chrome)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      await this.loadSounds();

      // Verify initialization
      if (this.isInitialized()) {
        console.log('Sound alerts: Initialized successfully');
        this.initialized = true;
        this.started = true;
      } else {
        console.error('Sound alerts: Initialization incomplete');
        this.initialized = false;
      }
    } catch (error) {
      console.error('Sound alerts: Initialization failed', error);
    }
  }

  /**
   * Must be called from a user gesture (click/tap) to enable audio on browsers
   */
  async startAfterUserGesture() {
    try {
      if (!this.audioContext) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtor();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      if (!this.isInitialized()) {
        await this.loadSounds();
      }
      this.started = true;
      return true;
    } catch (e) {
      console.error('Sound alerts: startAfterUserGesture failed', e);
      return false;
    }
  }

  /**
   * Load different sound types for different priorities
   */
  async loadSounds() {
    this.sounds = {
      // Critical - High frequency, urgent tone (800Hz sawtooth)
      critical: this.generateTone(800, 0.4, 'sawtooth', 2),

      // Important - Medium frequency, attention tone (600Hz square)
      important: this.generateTone(600, 0.3, 'square', 1),

      // Regular - Low frequency, gentle tone (400Hz sine)
      regular: this.generateTone(400, 0.2, 'sine', 1),

      // Connection - Success tone (500Hz sine with fade)
      connection: this.generateTone(500, 0.25, 'sine', 1, true),

      // Error - Warning tone (300Hz triangle)
      error: this.generateTone(300, 0.35, 'triangle', 2),
    };

    // Verify all sounds are properly initialized
    Object.keys(this.sounds).forEach((key) => {
      if (typeof this.sounds[key] !== 'function') {
        console.error(`Sound alerts: ${key} sound is not a function`);
      }
    });
  }

  /**
   * Generate a tone with specified parameters
   */
  generateTone(
    frequency,
    duration,
    type = 'sine',
    repetitions = 1,
    fadeOut = false,
  ) {
    return () => {
      if (!this.audioContext || !this.isEnabled) return;
      // If audio context not yet started by a user gesture, skip playing
      if (this.audioContext.state === 'suspended' || !this.started) {
        return;
      }

      try {
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Set oscillator properties
        oscillator.frequency.setValueAtTime(
          frequency,
          this.audioContext.currentTime,
        );
        oscillator.type = type;

        // Set gain (volume)
        gainNode.gain.setValueAtTime(
          this.volume,
          this.audioContext.currentTime,
        );

        // Apply fade out if requested
        if (fadeOut) {
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + duration,
          );
        }

        // Start and stop oscillator
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        // Repeat if needed
        if (repetitions > 1) {
          setTimeout(
            () => {
              this.generateTone(
                frequency,
                duration,
                type,
                repetitions - 1,
                fadeOut,
              )();
            },
            duration * 1000 + 100,
          );
        }
      } catch (error) {
        console.error('Sound alerts: Error playing tone', error);
      }
    };
  }

  /**
   * Play sound based on notification priority
   */
  playSound(priority) {
    const sound = this.sounds[priority.toLowerCase()];
    if (sound && typeof sound === 'function') {
      sound();
    } else {
      // Default to regular sound
      if (this.sounds.regular && typeof this.sounds.regular === 'function') {
        this.sounds.regular();
      } else {
        console.error(
          'Sound alerts: No valid sound found for priority:',
          priority,
        );
      }
    }
  }

  /**
   * Play connection success sound
   */
  async playConnectionSound() {
    try {
      // Ensure sound alerts are initialized
      if (!this.isInitialized()) {
        console.log('Sound alerts: Reinitializing for connection sound');
        await this.init();
      }

      if (
        this.sounds.connection &&
        typeof this.sounds.connection === 'function'
      ) {
        this.sounds.connection();
      } else {
        console.error(
          'Sound alerts: Connection sound is not properly initialized',
        );
        // Fallback to regular sound if connection sound is not available
        if (this.sounds.regular && typeof this.sounds.regular === 'function') {
          this.sounds.regular();
        }
      }
    } catch (error) {
      console.error('Sound alerts: Error playing connection sound', error);
    }
  }

  /**
   * Play error sound
   */
  playErrorSound() {
    if (this.sounds.error && typeof this.sounds.error === 'function') {
      this.sounds.error();
    } else {
      console.error('Sound alerts: Error sound is not properly initialized');
      // Fallback to regular sound if error sound is not available
      if (this.sounds.regular && typeof this.sounds.regular === 'function') {
        this.sounds.regular();
      }
    }
  }

  /**
   * Enable/disable sound alerts
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('soundAlertsEnabled', enabled.toString());
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundAlertsVolume', this.volume.toString());
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      enabled: this.isEnabled,
      volume: this.volume,
      supported: !!this.audioContext,
      initialized: this.isInitialized(),
    };
  }

  /**
   * Check if sound alerts are properly initialized
   */
  isInitialized() {
    const initialized =
      !!this.audioContext &&
      Object.keys(this.sounds).length > 0 &&
      Object.values(this.sounds).every((sound) => typeof sound === 'function');

    // Update internal state
    this.initialized = initialized;

    return initialized;
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const enabled = localStorage.getItem('soundAlertsEnabled');
      const volume = localStorage.getItem('soundAlertsVolume');

      if (enabled !== null) {
        this.isEnabled = enabled === 'true';
      }

      if (volume !== null) {
        this.volume = parseFloat(volume);
      }
    } catch (error) {
      console.error('Sound alerts: Error loading settings', error);
    }
  }

  /**
   * Test all sounds
   */
  testSounds() {
    if (!this.isEnabled) return;

    console.log('Testing all sounds...');

    // Ensure sounds are initialized
    if (!this.isInitialized()) {
      console.warn('Sound alerts: Reinitializing sounds for testing');
      this.loadSounds();
    }

    // Play each sound with delay
    setTimeout(() => {
      if (this.sounds.critical && typeof this.sounds.critical === 'function') {
        this.sounds.critical();
      }
    }, 0);
    setTimeout(() => {
      if (
        this.sounds.important &&
        typeof this.sounds.important === 'function'
      ) {
        this.sounds.important();
      }
    }, 1000);
    setTimeout(() => {
      if (this.sounds.regular && typeof this.sounds.regular === 'function') {
        this.sounds.regular();
      }
    }, 2000);
    setTimeout(() => {
      if (
        this.sounds.connection &&
        typeof this.sounds.connection === 'function'
      ) {
        this.sounds.connection();
      }
    }, 3000);
    setTimeout(() => {
      if (this.sounds.error && typeof this.sounds.error === 'function') {
        this.sounds.error();
      }
    }, 4000);
  }

  /**
   * Force reinitialization
   */
  async reinitialize() {
    try {
      this.destroy();
      await this.init();
      return this.isInitialized();
    } catch (error) {
      console.error('Sound alerts: Reinitialization failed', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sounds = {};
  }
}

// Create singleton instance
const soundAlerts = new SoundAlerts();

// Load settings on initialization
soundAlerts.loadSettings();

export default soundAlerts;
