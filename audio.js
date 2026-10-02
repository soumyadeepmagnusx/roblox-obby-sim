/**
 * Roblox Audio Synthesizer
 * Uses Web Audio API to procedurally generate authentic retro/Roblox sound effects
 * 100% offline, zero external asset dependencies.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.masterVolume = 0.5;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Toggle master audio
    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.bgmPlaying) {
            this.stopBgm();
        }
        return this.enabled;
    }

    // Classic Roblox Jump "Boing"
    playJump() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    // Iconic classic Roblox "OOF!" death sound
    playOof() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Vocal formant simulation: dual oscillator with downward bend
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        // Downward pitch bend characteristic of the "oof"
        osc1.frequency.setValueAtTime(320, now);
        osc1.frequency.exponentialRampToValueAtTime(110, now + 0.28);

        osc2.frequency.setValueAtTime(240, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.28);

        // Bandpass to give vocal-like resonant quality
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.frequency.exponentialRampToValueAtTime(380, now + 0.28);
        filter.Q.setValueAtTime(2.5, now);

        gain.gain.setValueAtTime(0.55 * this.masterVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
    }

    // Checkpoint sparkle chime (C5 -> E5 -> G5)
    playCheckpoint() {
        if (!this.enabled) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.35);
        });
    }

    // Coin collect "ding"
    playCoin() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [987.77, 1318.51]; // B5 -> E6
        notes.forEach((freq, idx) => {
            const t = now + idx * 0.07;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    // Super Trampoline Bounce Pad
    playBounce() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

        gain.gain.setValueAtTime(0.45 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Speed boost whoosh
    playBoost() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);

        gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Victory Fanfare
    playVictory() {
        if (!this.enabled) return;
        this.init();
        const fanfare = [
            { f: 523.25, d: 0.12 }, // C5
            { f: 659.25, d: 0.12 }, // E5
            { f: 783.99, d: 0.12 }, // G5
            { f: 1046.50, d: 0.28 }, // C6
            { f: 783.99, d: 0.15 }, // G5
            { f: 1046.50, d: 0.50 }  // C6
        ];

        let cursor = 0;
        fanfare.forEach((n) => {
            const now = this.ctx.currentTime + cursor;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(n.f, now);

            gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + n.d + 0.05);

            cursor += n.d + 0.04;
        });
    }

    // Footstep thud
    playStep() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

        gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    // Upbeat 8-bit Background Music loop
    toggleBgm() {
        if (this.bgmPlaying) {
            this.stopBgm();
            return false;
        } else {
            this.startBgm();
            return true;
        }
    }

    startBgm() {
        if (!this.enabled) return;
        this.init();
        this.bgmPlaying = true;
        
        const melody = [
            261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
            293.66, 369.99, 440.00, 587.33, 440.00, 369.99,
            261.63, 329.63, 392.00, 493.88, 392.00, 329.63,
            349.23, 440.00, 523.25, 659.25, 523.25, 440.00
        ];
        
        let step = 0;
        const interval = 160; // ms

        const tick = () => {
            if (!this.bgmPlaying || !this.enabled) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(melody[step % melody.length], now);

            gain.gain.setValueAtTime(0.05 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);

            step++;
            this.bgmTimer = setTimeout(tick, interval);
        };

        tick();
    }

    stopBgm() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.soundEngine = new SoundEngine();
