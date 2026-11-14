/**
 * Roblox Boombox & Jukebox Music Engine
 * Procedurally synthesizes authentic multi-instrument melodies:
 * - Bengali Classics & Hits:
 *     1. Purano Shei Diner Kotha (Rabindra Sangeet)
 *     2. Ami Shudhu Cheyechi Tomay
 *     3. Bojhena Shey Bojhena
 *     4. Barandaye Roddur (Bhoomi Folk Rock)
 *     5. Tomake Chai (Kabir Suman)
 *     6. Aalo (Tahsan)
 *     7. Alo Chaya (Tahsan & Nancy Duet)
 *     8. Ekla Cholo Re (Rabindranath Tagore Immortal Anthem)
 *     9. Gram Chara Oi Ranga Matir Poth (Tagore Baul Classic)
 *     10. Chokher Aloy (Rabindranath Tagore Romantic Classic)
 * - Global Gaming Anthems:
 *     11. Alan Walker - Faded
 *     12. Alan Walker - The Spectre
 *     13. Astronomia (Coffin Dance Anthem)
 *     14. Megalovania (Undertale)
 *     15. Bad Apple!! (Touhou Arcade Hit)
 *     16. Tetris (Korobeiniki 8-Bit)
 *     17. Never Gonna Give You Up (Rick Astley Meme Anthem)
 *     18. Can You Feel My Heart (GigaChad Theme)
 *     19. Crab Rave (Noisestorm Celebration Anthem)
 *     20. Darude - Sandstorm (Classic Gaming Rave Drop)
 */
class RobloxMusicPlayer {
    constructor(soundEngine) {
        this.sound = soundEngine;
        this.ctx = null;
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.playbackTimer = null;
        this.currentNoteIndex = 0;
        this.volume = parseFloat(localStorage.getItem('roblox_boombox_volume') || '0.45');
        this.shuffleMode = false;
        this.loopMode = 'track'; // 'track' (repeat 1) or 'playlist' (auto-advance)
        this.loopCycles = 0;

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
            },
            {
                title: "Tomake Chai",
                artist: "Kabir Suman (Bengali Iconic Anthem)",
                tempo: 190,
                notes: [
                    { f: 261.63, d: 0.35, t: 'triangle' }, // C4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 329.63, d: 0.50, t: 'sine' },     // E4
                    { f: 349.23, d: 0.35, t: 'triangle' }, // F4
                    { f: 392.00, d: 0.65, t: 'sine' },     // G4
                    { f: 349.23, d: 0.35, t: 'triangle' }, // F4
                    { f: 329.63, d: 0.50, t: 'sine' },     // E4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 261.63, d: 0.75, t: 'sine' }      // C4
                ]
            },
            {
                title: "Aalo",
                artist: "Tahsan (Romantic Melody)",
                tempo: 175,
                notes: [
                    { f: 329.63, d: 0.30, t: 'sine' },     // E4
                    { f: 392.00, d: 0.30, t: 'triangle' }, // G4
                    { f: 440.00, d: 0.55, t: 'sine' },     // A4
                    { f: 392.00, d: 0.30, t: 'triangle' }, // G4
                    { f: 329.63, d: 0.40, t: 'sine' },     // E4
                    { f: 293.66, d: 0.30, t: 'triangle' }, // D4
                    { f: 261.63, d: 0.65, t: 'sine' }      // C4
                ]
            },
            {
                title: "Tetris (Korobeiniki)",
                artist: "Russian Folk / Nintendo Game Boy 8-Bit",
                tempo: 140,
                notes: [
                    { f: 659.25, d: 0.22, t: 'square' }, // E5
                    { f: 493.88, d: 0.12, t: 'square' }, // B4
                    { f: 523.25, d: 0.12, t: 'square' }, // C5
                    { f: 587.33, d: 0.22, t: 'square' }, // D5
                    { f: 523.25, d: 0.12, t: 'square' }, // C5
                    { f: 493.88, d: 0.12, t: 'square' }, // B4
                    { f: 440.00, d: 0.22, t: 'square' }, // A4
                    { f: 440.00, d: 0.12, t: 'square' }, // A4
                    { f: 523.25, d: 0.12, t: 'square' }, // C5
                    { f: 659.25, d: 0.22, t: 'square' }, // E5
                    { f: 587.33, d: 0.12, t: 'square' }, // D5
                    { f: 523.25, d: 0.12, t: 'square' }, // C5
                    { f: 493.88, d: 0.32, t: 'square' }  // B4
                ]
            },
            {
                title: "Alo Chaya",
                artist: "Tahsan & Nancy (Bengali Duet Classic)",
                tempo: 180,
                notes: [
                    { f: 392.00, d: 0.30, t: 'triangle' }, // G4
                    { f: 440.00, d: 0.30, t: 'triangle' }, // A4
                    { f: 523.25, d: 0.50, t: 'sine' },     // C5
                    { f: 493.88, d: 0.35, t: 'triangle' }, // B4
                    { f: 440.00, d: 0.45, t: 'sine' },     // A4
                    { f: 392.00, d: 0.30, t: 'triangle' }, // G4
                    { f: 329.63, d: 0.60, t: 'sine' },     // E4
                    { f: 349.23, d: 0.30, t: 'triangle' }, // F4
                    { f: 392.00, d: 0.70, t: 'sine' },     // G4
                    { f: 0,      d: 0.15, t: 'rest' },     // rest
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4
                    { f: 329.63, d: 0.45, t: 'sine' },     // E4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 261.63, d: 0.80, t: 'sine' }      // C4
                ]
            },
            {
                title: "Never Gonna Give You Up",
                artist: "Rick Astley (Roblox Internet Anthem)",
                tempo: 120,
                notes: [
                    { f: 293.66, d: 0.18, t: 'sawtooth' }, // D4
                    { f: 329.63, d: 0.18, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.18, t: 'sawtooth' }, // G4
                    { f: 329.63, d: 0.18, t: 'sawtooth' }, // E4
                    { f: 493.88, d: 0.38, t: 'square' },   // B4
                    { f: 493.88, d: 0.20, t: 'square' },   // B4
                    { f: 440.00, d: 0.45, t: 'sawtooth' }, // A4
                    { f: 0,      d: 0.12, t: 'rest' },     // rest
                    { f: 293.66, d: 0.18, t: 'sawtooth' }, // D4
                    { f: 329.63, d: 0.18, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.18, t: 'sawtooth' }, // G4
                    { f: 329.63, d: 0.18, t: 'sawtooth' }, // E4
                    { f: 440.00, d: 0.38, t: 'square' },   // A4
                    { f: 440.00, d: 0.20, t: 'square' },   // A4
                    { f: 392.00, d: 0.45, t: 'sawtooth' }, // G4
                    { f: 0,      d: 0.12, t: 'rest' },     // rest
                    { f: 293.66, d: 0.18, t: 'sawtooth' }, // D4
                    { f: 329.63, d: 0.18, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.18, t: 'sawtooth' }, // G4
                    { f: 329.63, d: 0.18, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.28, t: 'square' },   // G4
                    { f: 440.00, d: 0.28, t: 'square' },   // A4
                    { f: 369.99, d: 0.28, t: 'sawtooth' }, // F#4
                    { f: 293.66, d: 0.28, t: 'sawtooth' }, // D4
                    { f: 329.63, d: 0.55, t: 'sine' }      // E4
                ]
            },
            {
                title: "Ekla Cholo Re",
                artist: "Rabindranath Tagore (Immortal Anthem)",
                tempo: 165,
                notes: [
                    { f: 329.63, d: 0.35, t: 'sine' },     // E4: Jo-di
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4: tor
                    { f: 440.00, d: 0.50, t: 'sine' },     // A4: daak
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4: shu-ne
                    { f: 523.25, d: 0.65, t: 'sine' },     // C5: ke-u
                    { f: 493.88, d: 0.35, t: 'triangle' }, // B4: na
                    { f: 440.00, d: 0.45, t: 'sine' },     // A4: aa-she
                    { f: 392.00, d: 0.70, t: 'sine' },     // G4: to-be
                    { f: 0,      d: 0.15, t: 'rest' },     // rest
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4: ek-
                    { f: 329.63, d: 0.35, t: 'triangle' }, // E4: la
                    { f: 293.66, d: 0.50, t: 'sine' },     // D4: cho-lo
                    { f: 329.63, d: 0.35, t: 'triangle' }, // E4: re
                    { f: 392.00, d: 0.85, t: 'sine' }      // G4
                ]
            },
            {
                title: "Can You Feel My Heart (GigaChad Theme)",
                artist: "Bring Me The Horizon / Roblox Meme Anthem",
                tempo: 135,
                notes: [
                    { f: 329.63, d: 0.16, t: 'sawtooth' }, // E4
                    { f: 329.63, d: 0.16, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.16, t: 'sawtooth' }, // G4
                    { f: 329.63, d: 0.16, t: 'sawtooth' }, // E4
                    { f: 493.88, d: 0.28, t: 'square' },   // B4
                    { f: 440.00, d: 0.28, t: 'sawtooth' }, // A4
                    { f: 392.00, d: 0.28, t: 'sawtooth' }, // G4
                    { f: 369.99, d: 0.32, t: 'sawtooth' }, // F#4
                    { f: 0,      d: 0.12, t: 'rest' },     // rest
                    { f: 329.63, d: 0.16, t: 'sawtooth' }, // E4
                    { f: 329.63, d: 0.16, t: 'sawtooth' }, // E4
                    { f: 392.00, d: 0.16, t: 'sawtooth' }, // G4
                    { f: 493.88, d: 0.24, t: 'square' },   // B4
                    { f: 587.33, d: 0.38, t: 'square' },   // D5
                    { f: 523.25, d: 0.24, t: 'sawtooth' }, // C5
                    { f: 493.88, d: 0.45, t: 'sine' }      // B4
                ]
            },
            {
                title: "Gram Chara Oi Ranga Matir Poth",
                artist: "Rabindranath Tagore (Folk Baul Classic)",
                tempo: 175,
                notes: [
                    { f: 261.63, d: 0.35, t: 'triangle' }, // C4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 329.63, d: 0.45, t: 'sine' },     // E4
                    { f: 392.00, d: 0.45, t: 'sine' },     // G4
                    { f: 329.63, d: 0.35, t: 'triangle' }, // E4
                    { f: 392.00, d: 0.45, t: 'sine' },     // G4
                    { f: 440.00, d: 0.65, t: 'sine' },     // A4
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4
                    { f: 329.63, d: 0.45, t: 'sine' },     // E4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 261.63, d: 0.80, t: 'sine' }      // C4
                ]
            },
            {
                title: "Crab Rave",
                artist: "Noisestorm (Roblox Victory Celebration)",
                tempo: 125,
                notes: [
                    { f: 587.33, d: 0.14, t: 'square' }, // D5
                    { f: 932.33, d: 0.14, t: 'square' }, // Bb5
                    { f: 783.99, d: 0.14, t: 'square' }, // G5
                    { f: 783.99, d: 0.14, t: 'square' }, // G5
                    { f: 587.33, d: 0.14, t: 'square' }, // D5
                    { f: 587.33, d: 0.14, t: 'square' }, // D5
                    { f: 880.00, d: 0.14, t: 'square' }, // A5
                    { f: 698.46, d: 0.14, t: 'square' }, // F5
                    { f: 698.46, d: 0.14, t: 'square' }, // F5
                    { f: 587.33, d: 0.14, t: 'square' }, // D5
                    { f: 587.33, d: 0.14, t: 'square' }, // D5
                    { f: 880.00, d: 0.14, t: 'square' }, // A5
                    { f: 698.46, d: 0.14, t: 'square' }, // F5
                    { f: 698.46, d: 0.14, t: 'square' }, // F5
                    { f: 523.25, d: 0.14, t: 'square' }, // C5
                    { f: 523.25, d: 0.14, t: 'square' }, // C5
                    { f: 659.25, d: 0.30, t: 'square' }  // E5
                ]
            },
            {
                title: "Chokher Aloy",
                artist: "Rabindranath Tagore (Romantic Classic)",
                tempo: 185,
                notes: [
                    { f: 329.63, d: 0.35, t: 'sine' },     // E4
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4
                    { f: 440.00, d: 0.45, t: 'sine' },     // A4
                    { f: 392.00, d: 0.35, t: 'triangle' }, // G4
                    { f: 329.63, d: 0.50, t: 'sine' },     // E4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 261.63, d: 0.70, t: 'sine' },     // C4
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 329.63, d: 0.45, t: 'sine' },     // E4
                    { f: 392.00, d: 0.70, t: 'sine' }      // G4
                ]
            },
            {
                title: "Sandstorm",
                artist: "Darude (Classic Gaming Rave Drop)",
                tempo: 136,
                notes: [
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.22, t: 'sawtooth' }, // B4
                    { f: 0,      d: 0.08, t: 'rest' },
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.10, t: 'sawtooth' }, // B4
                    { f: 493.88, d: 0.20, t: 'sawtooth' }, // B4
                    { f: 659.25, d: 0.10, t: 'square' },   // E5
                    { f: 659.25, d: 0.10, t: 'square' },   // E5
                    { f: 659.25, d: 0.10, t: 'square' },   // E5
                    { f: 587.33, d: 0.10, t: 'square' },   // D5
                    { f: 587.33, d: 0.10, t: 'square' },   // D5
                    { f: 587.33, d: 0.10, t: 'square' },   // D5
                    { f: 440.00, d: 0.25, t: 'sawtooth' }  // A4
                ]
            },
            {
                title: "Bhalobashibo Bashibo Re",
                artist: "Habib Wahid (Bengali Folk Pop)",
                tempo: 165,
                notes: [
                    { f: 493.88, d: 0.28, t: 'triangle' }, // B4
                    { f: 554.37, d: 0.28, t: 'triangle' }, // C#5
                    { f: 587.33, d: 0.45, t: 'sine' },     // D5
                    { f: 659.25, d: 0.40, t: 'triangle' }, // E5
                    { f: 587.33, d: 0.35, t: 'sine' },     // D5
                    { f: 554.37, d: 0.35, t: 'triangle' }, // C#5
                    { f: 493.88, d: 0.50, t: 'sine' },     // B4
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4
                    { f: 493.88, d: 0.75, t: 'sine' }      // B4
                ]
            },
            {
                title: "Super Mario Bros. Theme",
                artist: "Koji Kondo (Retro Gaming Classic)",
                tempo: 200,
                notes: [
                    { f: 659.25, d: 0.14, t: 'square' }, // E5
                    { f: 659.25, d: 0.14, t: 'square' }, // E5
                    { f: 0,      d: 0.14, t: 'rest' },
                    { f: 659.25, d: 0.14, t: 'square' }, // E5
                    { f: 0,      d: 0.14, t: 'rest' },
                    { f: 523.25, d: 0.14, t: 'square' }, // C5
                    { f: 659.25, d: 0.25, t: 'square' }, // E5
                    { f: 783.99, d: 0.40, t: 'square' }, // G5
                    { f: 0,      d: 0.30, t: 'rest' },
                    { f: 392.00, d: 0.45, t: 'square' }  // G4
                ]
            },
            {
                title: "Ami Banglay Gaan Gai",
                artist: "Pratul Mukhopadhyay (Bengali Anthem)",
                tempo: 155,
                notes: [
                    { f: 293.66, d: 0.35, t: 'triangle' }, // D4
                    { f: 369.99, d: 0.35, t: 'triangle' }, // F#4
                    { f: 440.00, d: 0.45, t: 'sine' },     // A4
                    { f: 493.88, d: 0.40, t: 'sine' },     // B4
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4
                    { f: 369.99, d: 0.55, t: 'sine' },     // F#4
                    { f: 329.63, d: 0.35, t: 'triangle' }, // E4
                    { f: 293.66, d: 0.85, t: 'sine' }      // D4
                ]
            },
            {
                title: "Wet Hands (Minecraft Theme)",
                artist: "C418 (Atmospheric Gaming Piano)",
                tempo: 120,
                notes: [
                    { f: 440.00, d: 0.50, t: 'sine' }, // A4
                    { f: 659.25, d: 0.65, t: 'sine' }, // E5
                    { f: 739.99, d: 0.55, t: 'sine' }, // F#5
                    { f: 659.25, d: 0.70, t: 'sine' }, // E5
                    { f: 554.37, d: 0.60, t: 'sine' }, // C#5
                    { f: 493.88, d: 0.55, t: 'sine' }, // B4
                    { f: 440.00, d: 1.10, t: 'sine' }  // A4
                ]
            },
            {
                title: "Dhitang Dhitang Bole",
                artist: "Salil Chowdhury (Bengali Folk Classic)",
                tempo: 190,
                notes: [
                    { f: 392.00, d: 0.22, t: 'triangle' }, // G4
                    { f: 392.00, d: 0.22, t: 'triangle' }, // G4
                    { f: 440.00, d: 0.28, t: 'triangle' }, // A4
                    { f: 493.88, d: 0.35, t: 'sine' },     // B4
                    { f: 587.33, d: 0.40, t: 'sine' },     // D5
                    { f: 523.25, d: 0.30, t: 'triangle' }, // C5
                    { f: 493.88, d: 0.30, t: 'sine' },     // B4
                    { f: 440.00, d: 0.35, t: 'triangle' }, // A4
                    { f: 392.00, d: 0.75, t: 'sine' }      // G4
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
        this.loopCycles = 0;
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
        if (this.shuffleMode && this.tracks.length > 1) {
            let nextIdx = this.currentTrackIndex;
            while (nextIdx === this.currentTrackIndex) {
                nextIdx = Math.floor(Math.random() * this.tracks.length);
            }
            this.playTrack(nextIdx);
        } else {
            this.playTrack(this.currentTrackIndex + 1);
        }
    }

    prevTrack() {
        this.playTrack(this.currentTrackIndex - 1);
    }

    toggleShuffle() {
        this.shuffleMode = !this.shuffleMode;
        const btn = document.getElementById('boombox-shuffle-btn');
        if (btn) {
            btn.style.background = this.shuffleMode ? '#00FF88' : '';
            btn.style.color = this.shuffleMode ? '#000' : '';
        }
    }

    toggleLoop() {
        this.loopMode = (this.loopMode === 'track') ? 'playlist' : 'track';
        const btn = document.getElementById('boombox-loop-btn');
        if (btn) {
            btn.innerHTML = this.loopMode === 'track' ? '🔂 Repeat: 1' : '🔁 Playlist';
        }
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
        this.currentNoteIndex++;
        if (this.currentNoteIndex >= track.notes.length) {
            this.currentNoteIndex = 0;
            this.loopCycles++;
            if (this.loopMode === 'playlist' && this.loopCycles >= 2) {
                this.playbackTimer = setTimeout(() => {
                    this.nextTrack();
                }, durationMs);
                return;
            }
        }

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

        this.renderVisualizer();
    }

    renderVisualizer() {
        const canvas = document.getElementById('boombox-eq-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        const barCount = 14;
        const barWidth = (w - (barCount - 1) * 3) / barCount;

        for (let i = 0; i < barCount; i++) {
            const heightFactor = this.isPlaying ? (0.2 + Math.random() * 0.75) : 0.1;
            const barH = Math.max(2, h * heightFactor);
            const x = i * (barWidth + 3);
            const y = h - barH;

            const grad = ctx.createLinearGradient(x, y, x, h);
            grad.addColorStop(0, '#00FF88');
            grad.addColorStop(1, '#0074E4');

            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barH);
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, parseFloat(val)));
        localStorage.setItem('roblox_boombox_volume', this.volume.toString());
        const label = document.getElementById('boombox-vol-label');
        if (label) {
            label.innerText = Math.round(this.volume * 100) + '%';
        }
    }

    updateUI() {
        const titleEl = document.getElementById('boombox-title');
        const artistEl = document.getElementById('boombox-artist');
        const playBtn = document.getElementById('boombox-play-btn');
        const volSlider = document.getElementById('boombox-vol-slider');
        const volLabel = document.getElementById('boombox-vol-label');

        if (titleEl && artistEl) {
            const t = this.tracks[this.currentTrackIndex];
            titleEl.innerText = t.title;
            artistEl.innerText = t.artist;
        }
        if (playBtn) {
            playBtn.innerText = this.isPlaying ? '⏸️' : '▶️';
        }
        if (volSlider) {
            volSlider.value = this.volume;
        }
        if (volLabel) {
            volLabel.innerText = Math.round(this.volume * 100) + '%';
        }
        this.renderVisualizer();
    }
}

window.RobloxMusicPlayer = RobloxMusicPlayer;
