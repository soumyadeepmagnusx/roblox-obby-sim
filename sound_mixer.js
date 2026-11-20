/**
 * Roblox Sound Settings & Multi-Channel Audio Mixer
 * Provides independent master, music, sfx, and ambient volume sliders
 * with persistent local storage and instant real-time gain adjustment.
 */
class RobloxSoundMixer {
    constructor(soundEngine, musicPlayer) {
        this.sound = soundEngine;
        this.music = musicPlayer;

        this.volumes = {
            master: 0.75,
            music: 0.50,
            sfx: 0.85,
            ambience: 0.60,
            muted: false
        };

        this.loadSettings();
        this.applyVolumes();

        if (typeof document !== 'undefined') {
            this.initUI();
        }
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('roblox_sound_mixer');
            if (raw) {
                const parsed = JSON.parse(raw);
                this.volumes = { ...this.volumes, ...parsed };
            }
        } catch (e) {}
    }

    saveSettings() {
        try {
            localStorage.setItem('roblox_sound_mixer', JSON.stringify(this.volumes));
        } catch (e) {}
    }

    applyVolumes() {
        const effectiveMaster = this.volumes.muted ? 0 : this.volumes.master;

        // Apply to sound engine SFX
        if (this.sound) {
            this.sound.masterVolume = effectiveMaster * this.volumes.sfx;
            this.sound.enabled = !this.volumes.muted && this.volumes.master > 0;
        }

        // Apply to music player
        if (this.music && this.music.setVolume) {
            const effectiveMusic = effectiveMaster * this.volumes.music;
            this.music.setVolume(effectiveMusic);
        }
    }

    setMasterVolume(val) {
        this.volumes.master = Math.max(0, Math.min(1, parseFloat(val)));
        this.applyVolumes();
        this.saveSettings();
        this.updateSliders();
    }

    setMusicVolume(val) {
        this.volumes.music = Math.max(0, Math.min(1, parseFloat(val)));
        this.applyVolumes();
        this.saveSettings();
        this.updateSliders();
    }

    setSFXVolume(val) {
        this.volumes.sfx = Math.max(0, Math.min(1, parseFloat(val)));
        this.applyVolumes();
        this.saveSettings();
        this.updateSliders();
    }

    setAmbienceVolume(val) {
        this.volumes.ambience = Math.max(0, Math.min(1, parseFloat(val)));
        this.applyVolumes();
        this.saveSettings();
        this.updateSliders();
    }

    toggleMute() {
        this.volumes.muted = !this.volumes.muted;
        this.applyVolumes();
        this.saveSettings();
        this.updateSliders();
        if (window.game && window.game.ui && window.game.ui.showToastBanner) {
            window.game.ui.showToastBanner(this.volumes.muted ? '🔇 All Audio Muted' : '🔊 Audio Unmuted');
        }
        return this.volumes.muted;
    }

    initUI() {
        const modal = document.createElement('div');
        modal.id = 'sound-mixer-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 17, 21, 0.85);
            backdrop-filter: blur(10px);
            z-index: 110;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div class="menu-card" style="width: 380px; max-width: 92%;">
                <div class="menu-title">
                    <span>🎚️ AUDIO VOLUME MIXER</span>
                    <span style="cursor: pointer;" onclick="if(window.game && window.game.soundMixer) window.game.soundMixer.closeModal()">✕</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 14px; margin: 16px 0;">
                    <!-- Master Volume -->
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 4px;">
                            <span>🔊 Master Volume:</span>
                            <span id="mixer-val-master" style="color: #00FF88;">${Math.round(this.volumes.master * 100)}%</span>
                        </div>
                        <input id="mixer-slider-master" type="range" min="0" max="1" step="0.05" value="${this.volumes.master}"
                               oninput="if(window.game && window.game.soundMixer) window.game.soundMixer.setMasterVolume(this.value)"
                               style="width: 100%; accent-color: #00FF88; cursor: pointer;">
                    </div>

                    <!-- Music BGM Volume -->
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 4px;">
                            <span>🎵 Music & Boombox:</span>
                            <span id="mixer-val-music" style="color: #FFD700;">${Math.round(this.volumes.music * 100)}%</span>
                        </div>
                        <input id="mixer-slider-music" type="range" min="0" max="1" step="0.05" value="${this.volumes.music}"
                               oninput="if(window.game && window.game.soundMixer) window.game.soundMixer.setMusicVolume(this.value)"
                               style="width: 100%; accent-color: #FFD700; cursor: pointer;">
                    </div>

                    <!-- SFX Volume -->
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 4px;">
                            <span>💥 Sound FX (Jump/Bounce):</span>
                            <span id="mixer-val-sfx" style="color: #00F0FF;">${Math.round(this.volumes.sfx * 100)}%</span>
                        </div>
                        <input id="mixer-slider-sfx" type="range" min="0" max="1" step="0.05" value="${this.volumes.sfx}"
                               oninput="if(window.game && window.game.soundMixer) window.game.soundMixer.setSFXVolume(this.value)"
                               style="width: 100%; accent-color: #00F0FF; cursor: pointer;">
                    </div>

                    <!-- Ambience Volume -->
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 4px;">
                            <span>🌦️ Weather & Ambience:</span>
                            <span id="mixer-val-ambience" style="color: #9B59B6;">${Math.round(this.volumes.ambience * 100)}%</span>
                        </div>
                        <input id="mixer-slider-ambience" type="range" min="0" max="1" step="0.05" value="${this.volumes.ambience}"
                               oninput="if(window.game && window.game.soundMixer) window.game.soundMixer.setAmbienceVolume(this.value)"
                               style="width: 100%; accent-color: #9B59B6; cursor: pointer;">
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button id="mixer-mute-btn" class="hud-btn" style="flex: 1;" onclick="if(window.game && window.game.soundMixer) window.game.soundMixer.toggleMute()">
                        ${this.volumes.muted ? '🔇 Unmute All' : '🔊 Mute All'}
                    </button>
                    <button class="menu-btn primary" style="flex: 1;" onclick="if(window.game && window.game.soundMixer) window.game.soundMixer.closeModal()">Done</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.updateSliders();
    }

    openModal() {
        const modal = document.getElementById('sound-mixer-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateSliders();
        }
    }

    closeModal() {
        const modal = document.getElementById('sound-mixer-modal');
        if (modal) modal.style.display = 'none';
    }

    updateSliders() {
        if (typeof document === 'undefined') return;

        const updateElem = (id, val, color) => {
            const el = document.getElementById(id);
            if (el) el.textContent = `${Math.round(val * 100)}%`;
        };
        const updateSlider = (id, val) => {
            const s = document.getElementById(id);
            if (s) s.value = val;
        };

        updateElem('mixer-val-master', this.volumes.master);
        updateElem('mixer-val-music', this.volumes.music);
        updateElem('mixer-val-sfx', this.volumes.sfx);
        updateElem('mixer-val-ambience', this.volumes.ambience);

        updateSlider('mixer-slider-master', this.volumes.master);
        updateSlider('mixer-slider-music', this.volumes.music);
        updateSlider('mixer-slider-sfx', this.volumes.sfx);
        updateSlider('mixer-slider-ambience', this.volumes.ambience);

        const muteBtn = document.getElementById('mixer-mute-btn');
        if (muteBtn) {
            muteBtn.innerHTML = this.volumes.muted ? '🔇 Unmute All' : '🔊 Mute All';
            muteBtn.classList.toggle('danger', this.volumes.muted);
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxSoundMixer = RobloxSoundMixer;
}
