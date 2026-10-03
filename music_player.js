/**
 * Roblox Boombox & Jukebox Music Engine
 * Procedurally synthesizes authentic multi-instrument melodies:
 * - Bengali Classics & Hits:
 *     1. Purano Shei Diner Kotha (Rabindra Sangeet)
 *     2. Ami Shudhu Cheyechi Tomay
 *     3. Bojhena Shey Bojhena
 *     4. Barandaye Roddur (Bhoomi Folk Rock)
 * - Global Gaming Anthems:
 *     5. Alan Walker - Faded
 *     6. Alan Walker - The Spectre
 *     7. Astronomia (Coffin Dance Anthem)
 *     8. Megalovania (Undertale)
 *     9. Bad Apple!! (Touhou Arcade Hit)
 */
class RobloxMusicPlayer {
    constructor(soundEngine) {
        this.sound = soundEngine;
        this.ctx = null;
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.playbackTimer = null;
        this.currentNoteIndex = 0;
        this.volume = 0.45;

        // Visualizer equalizer bars
        this.eqBars = [0, 0, 0, 0, 0];

        // Track library with authentic notes (frequency, duration in seconds, instrument type)
        this.tracks = [
            {
                title: "Purano Shei Diner Kotha",
                artist: "Bengali Classic / Rabindranath Tagore",
                tempo: 220,
                notes: [
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4: Pu-
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4: ra-
                    { f: 440.00, d: 0.45, t: 'triangle' }, // A4: no
                    { f: 392.00, d: 0.45, t: 'triangle' }, // G4: shei
                    { f: 329.63, d: 0.70, t: 'sine' },     // E4: di-ner
                    { f: 293.66, d: 0.45, t: 'triangle' }, // D4: ko-
                    { f: 261.63, d: 0.85, t: 'sine' },     // C4: tha
                    { f: 0,      d: 0.15, t: 'rest' },     // rest
                    { f: 329.63, d: 0.35, t: 'triangle' }, // E4: bhu-
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4: li-
                    { f: 440.00, d: 0.50, t: 'triangle' }, // A4: bi
                    { f: 523.25, d: 0.75, t: 'sine' },     // C5: ki
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4: re
                    { f: 392.00, d: 0.85, t: 'sine' }      // G4: hay
                ]
            },
            {
                title: "Ami Shudhu Cheyechi Tomay",
                artist: "Popular Bengali Melody",
                tempo: 180,
                notes: [
                    { f: 440.00, d: 0.25, t: 'triangle' }, // A4
                    { f: 493.88, d: 0.25, t: 'triangle' }, // B4
                    { f: 523.25, d: 0.45, t: 'sine' },     // C5
                    { f: 440.00, d: 0.25, t: 'triangle' }, // A4
                    { f: 523.25, d: 0.45, t: 'sine' },     // C5
                    { f: 587.33, d: 0.35, t: 'triangle' }, // D5
                    { f: 523.25, d: 0.25, t: 'triangle' }, // C5
                    { f: 493.88, d: 0.55, t: 'sine' },     // B4
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4
                    { f: 440.00, d: 0.75, t: 'sine' }      // A4
                ]
            },
            {
                title: "Bojhena Shey Bojhena",
                artist: "Bengali Romantic Theme",
                tempo: 200,
                notes: [
                    { f: 392.00, d: 0.35, t: 'sine' }, // G4
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4
                    { f: 466.16, d: 0.45, t: 'sine' }, // Bb4
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4
                    { f: 392.00, d: 0.35, t: 'sine' }, // G4
                    { f: 349.23, d: 0.45, t: 'triangle' }, // F4
                    { f: 311.13, d: 0.55, t: 'sine' }, // Eb4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 311.13, d: 0.35, t: 'sine' }, // Eb4
                    { f: 349.23, d: 0.40, t: 'triangle' }, // F4
                    { f: 392.00, d: 0.75, t: 'sine' }  // G4
                ]
            },
            {
                title: "Barandaye Roddur",
                artist: "Bhoomi (Bengali Folk Rock)",
                tempo: 160,
                notes: [
                    { f: 293.66, d: 0.25, t: 'square' }, // D4
                    { f: 369.99, d: 0.25, t: 'triangle' }, // F#4
                    { f: 440.00, d: 0.35, t: 'sine' }, // A4
                    { f: 493.88, d: 0.35, t: 'sine' }, // B4
                    { f: 440.00, d: 0.25, t: 'triangle' }, // A4
                    { f: 369.99, d: 0.25, t: 'square' }, // F#4
                    { f: 329.63, d: 0.35, t: 'triangle' }, // E4
                    { f: 293.66, d: 0.45, t: 'sine' }, // D4
                    { f: 329.63, d: 0.25, t: 'triangle' }, // E4
                    { f: 369.99, d: 0.35, t: 'square' }, // F#4
                    { f: 293.66, d: 0.75, t: 'sine' }  // D4
                ]
            },
            {
                title: "Faded",
                artist: "Alan Walker (Global EDM)",
                tempo: 190,
                notes: [
                    { f: 369.99, d: 0.35, t: 'sine' }, // F#4
                    { f: 415.30, d: 0.35, t: 'sine' }, // G#4
                    { f: 466.16, d: 0.35, t: 'sine' }, // A#4
                    { f: 554.37, d: 0.70, t: 'sine' }, // C#5
                    { f: 466.16, d: 0.35, t: 'sine' }, // A#4
                    { f: 415.30, d: 0.35, t: 'sine' }, // G#4
                    { f: 369.99, d: 0.85, t: 'sine' }, // F#4
                    { f: 0,      d: 0.20, t: 'rest' },
                    { f: 311.13, d: 0.35, t: 'sine' }, // D#4
                    { f: 369.99, d: 0.35, t: 'sine' }, // F#4
                    { f: 415.30, d: 0.70, t: 'sine' }, // G#4
                    { f: 369.99, d: 0.85, t: 'sine' }  // F#4
                ]
            },
            {
                title: "The Spectre",
                artist: "Alan Walker (EDM Anthem)",
                tempo: 150,
                notes: [
                    { f: 329.63, d: 0.22, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.22, t: 'sawtooth' }, // G4
                    { f: 440.00, d: 0.22, t: 'sawtooth' }, // A4
                    { f: 493.88, d: 0.35, t: 'sawtooth' }, // B4
                    { f: 587.33, d: 0.35, t: 'sawtooth' }, // D5
                    { f: 523.25, d: 0.25, t: 'sawtooth' }, // C5
                    { f: 493.88, d: 0.35, t: 'sawtooth' }, // B4
                    { f: 440.00, d: 0.25, t: 'sawtooth' }, // A4
                    { f: 392.00, d: 0.25, t: 'sawtooth' }, // G4
                    { f: 440.00, d: 0.25, t: 'sawtooth' }, // A4
                    { f: 493.88, d: 0.35, t: 'sawtooth' }, // B4
                    { f: 329.63, d: 0.65, t: 'sawtooth' }  // E4
                ]
            },
            {
                title: "Astronomia (Coffin Dance)",
                artist: "Vicetone & Tony Igy (Roblox Meme)",
                tempo: 140,
                notes: [
                    { f: 440.00, d: 0.18, t: 'square' }, // A4
                    { f: 440.00, d: 0.18, t: 'square' },
                    { f: 440.00, d: 0.18, t: 'square' },
                    { f: 523.25, d: 0.25, t: 'square' }, // C5
                    { f: 493.88, d: 0.25, t: 'square' }, // B4
                    { f: 440.00, d: 0.25, t: 'square' }, // A4
                    { f: 392.00, d: 0.35, t: 'square' }, // G4
                    { f: 440.00, d: 0.35, t: 'square' }, // A4
                    { f: 587.33, d: 0.35, t: 'square' }, // D5
                    { f: 523.25, d: 0.25, t: 'square' }, // C5
                    { f: 493.88, d: 0.40, t: 'square' }  // B4
                ]
            },
            {
                title: "Megalovania",
                artist: "Toby Fox (Gaming Anthem)",
                tempo: 125,
                notes: [
                    { f: 293.66, d: 0.12, t: 'sawtooth' }, // D4
                    { f: 293.66, d: 0.12, t: 'sawtooth' }, // D4
                    { f: 587.33, d: 0.24, t: 'sawtooth' }, // D5
                    { f: 440.00, d: 0.28, t: 'sawtooth' }, // A4
                    { f: 0,      d: 0.08, t: 'rest' },
                    { f: 415.30, d: 0.24, t: 'sawtooth' }, // G#4
                    { f: 392.00, d: 0.24, t: 'sawtooth' }, // G4
                    { f: 349.23, d: 0.24, t: 'sawtooth' }, // F4
                    { f: 293.66, d: 0.14, t: 'sawtooth' }, // D4
                    { f: 349.23, d: 0.14, t: 'sawtooth' }, // F4
                    { f: 392.00, d: 0.18, t: 'sawtooth' }  // G4
                ]
            },
            {
                title: "Bad Apple!!",
                artist: "Alstroemeria Records (Arcade Hit)",
                tempo: 130,
                notes: [
                    { f: 293.66, d: 0.16, t: 'sawtooth' }, // D4
                    { f: 329.63, d: 0.16, t: 'sawtooth' }, // E4
                    { f: 349.23, d: 0.16, t: 'sawtooth' }, // F4
                    { f: 392.00, d: 0.22, t: 'sawtooth' }, // G4
                    { f: 440.00, d: 0.22, t: 'sawtooth' }, // A4
                    { f: 466.16, d: 0.28, t: 'sawtooth' }, // Bb4
                    { f: 440.00, d: 0.22, t: 'sawtooth' }, // A4
                    { f: 392.00, d: 0.22, t: 'sawtooth' }, // G4
                    { f: 349.23, d: 0.22, t: 'sawtooth' }, // F4
                    { f: 329.63, d: 0.22, t: 'sawtooth' }, // E4
                    { f: 293.66, d: 0.35, t: 'sawtooth' }  // D4
                ]
            }
        ];
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTrack(index) {
        this.initContext();
        this.stop();
        this.currentTrackIndex = (index + this.tracks.length) % this.tracks.length;
        this.currentNoteIndex = 0;
        this.isPlaying = true;

        this.scheduleNextNote();
        this.updateUI();

        if (window.game && window.game.ui) {
            const t = this.tracks[this.currentTrackIndex];
            window.game.ui.addChatMessage('Boombox', `Now Playing: 🎵 ${t.title} - ${t.artist}`, '#FFD700');
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        this.updateUI();
    }

    nextTrack() {
        this.playTrack(this.currentTrackIndex + 1);
    }

    prevTrack() {
        this.playTrack(this.currentTrackIndex - 1);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.playTrack(this.currentTrackIndex);
        }
    }

    scheduleNextNote() {
        if (!this.isPlaying) return;

        const track = this.tracks[this.currentTrackIndex];
        const note = track.notes[this.currentNoteIndex];

        if (note && note.t !== 'rest' && note.f > 0) {
            this.playTone(note.f, note.d, note.t);
            this.eqBars = this.eqBars.map(() => Math.floor(Math.random() * 80 + 20));
        } else {
            this.eqBars = [10, 15, 10, 20, 10];
        }

        const durationMs = (note ? note.d : 0.3) * 1000;
        this.currentNoteIndex = (this.currentNoteIndex + 1) % track.notes.length;

        this.playbackTimer = setTimeout(() => {
            this.scheduleNextNote();
        }, durationMs);
    }

    playTone(freq, duration, type = 'sine') {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(this.volume, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    updateUI() {
        const titleEl = document.getElementById('boombox-title');
        const artistEl = document.getElementById('boombox-artist');
        const playBtn = document.getElementById('boombox-play-btn');

        if (titleEl && artistEl) {
            const t = this.tracks[this.currentTrackIndex];
            titleEl.innerText = t.title;
            artistEl.innerText = t.artist;
        }
        if (playBtn) {
            playBtn.innerText = this.isPlaying ? '⏸️' : '▶️';
        }
    }
}

window.RobloxMusicPlayer = RobloxMusicPlayer;
