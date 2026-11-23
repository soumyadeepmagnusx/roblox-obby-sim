/**
 * Roblox Keybind Manager (keybinds.js)
 * Provides custom keybind remapping with conflict detection and persistent local storage.
 */
class RobloxKeybindManager {
    constructor(game) {
        this.game = game;
        this.defaults = {
            jump: { label: "Jump", code: "Space", display: "Space" },
            sprint: { label: "Sprint", code: "ShiftLeft", display: "Shift" },
            grapple: { label: "Grapple Hook", code: "KeyH", display: "H" },
            emotes: { label: "Emote Wheel", code: "KeyJ", display: "J" },
            weather: { label: "Cycle Weather", code: "KeyK", display: "K" },
            lighting: { label: "Cycle Lighting", code: "KeyL", display: "L" },
            minimap: { label: "Toggle Radar", code: "KeyM", display: "M" },
            hats: { label: "Cycle 3D Hats", code: "KeyN", display: "N" },
            drone: { label: "Companion Drone", code: "KeyO", display: "O" },
            ghost: { label: "Speedrun Ghost", code: "KeyX", display: "X" },
            aura: { label: "Cycle Aura", code: "KeyZ", display: "Z" },
            spin: { label: "Lucky Wheel", code: "KeyG", display: "G" },
            quest: { label: "Quest Board", code: "KeyQ", display: "Q" },
            spectate: { label: "Spectate Camera", code: "KeyF", display: "F" },
            reset: { label: "Quick Restart", code: "KeyT", display: "T" }
        };

        this.bindings = JSON.parse(JSON.stringify(this.defaults));
        this.listeningAction = null;

        this.loadSettings();

        if (typeof document !== 'undefined') {
            this.initUI();
            this.bindEvents();
        }
    }

    loadSettings() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('roblox_keybinds');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    Object.keys(parsed).forEach(k => {
                        if (this.bindings[k]) {
                            this.bindings[k].code = parsed[k].code;
                            this.bindings[k].display = parsed[k].display;
                        }
                    });
                }
            }
        } catch (e) {}
    }

    saveSettings() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('roblox_keybinds', JSON.stringify(this.bindings));
            }
        } catch (e) {}
    }

    initUI() {
        const modal = document.createElement('div');
        modal.id = 'keybinds-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 520px;
            max-width: 92vw;
            max-height: 85vh;
            overflow-y: auto;
            background: rgba(18, 22, 32, 0.96);
            border: 2px solid #00F0FF;
            border-radius: 16px;
            box-shadow: 0 0 35px rgba(0, 240, 255, 0.45);
            color: #FFF;
            font-family: 'Segoe UI', Roboto, sans-serif;
            z-index: 10005;
            padding: 24px;
            backdrop-filter: blur(12px);
        `;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h2 style="margin:0; font-size:20px; color:#00F0FF; display:flex; align-items:center; gap:8px;">
                    <span>⌨️</span> Custom Keybinds Manager
                </h2>
                <button id="close-keybinds-btn" style="background:#FF3344; border:none; color:#FFF; font-weight:bold; border-radius:8px; padding:6px 14px; cursor:pointer;">✕</button>
            </div>
            
            <p style="font-size:12px; color:#AAA; margin:0 0 16px 0;">Click on any keybind button below, then press your desired replacement key on your keyboard.</p>

            <div id="keybinds-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
                <!-- Generated Rows -->
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
                <button id="reset-keybinds-btn" style="background:#555; border:none; color:#DDD; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer;">↺ Reset Defaults</button>
                <button id="done-keybinds-btn" style="background:#00FF88; border:none; color:#111; padding:8px 22px; border-radius:8px; font-weight:bold; cursor:pointer;">Done</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-keybinds-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('done-keybinds-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('reset-keybinds-btn')?.addEventListener('click', () => this.resetDefaults());

        this.renderList();
    }

    renderList() {
        const list = document.getElementById('keybinds-list');
        if (!list) return;

        list.innerHTML = Object.keys(this.bindings).map(action => {
            const item = this.bindings[action];
            const isListening = this.listeningAction === action;
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                    <span style="font-size:13px; font-weight:600; color:#EEE;">${item.label}</span>
                    <button class="keybind-assign-btn" data-action="${action}" style="background:${isListening ? '#FF8800' : 'rgba(0,240,255,0.2)'}; border:1px solid ${isListening ? '#FFAA00' : '#00F0FF'}; color:#FFF; font-family:monospace; font-weight:bold; font-size:13px; padding:4px 14px; border-radius:6px; min-width:80px; cursor:pointer; text-align:center;">
                        ${isListening ? 'Press key...' : item.display}
                    </button>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.keybind-assign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.startListening(action);
            });
        });
    }

    startListening(action) {
        this.listeningAction = action;
        this.renderList();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.listeningAction) {
                e.preventDefault();
                e.stopPropagation();

                const code = e.code;
                let display = e.key.toUpperCase();
                if (code.startsWith('Key')) display = code.replace('Key', '');
                else if (code.startsWith('Digit')) display = code.replace('Digit', '');
                else if (code === 'Space') display = 'Space';
                else if (code === 'ShiftLeft' || code === 'ShiftRight') display = 'Shift';

                this.bindings[this.listeningAction].code = code;
                this.bindings[this.listeningAction].display = display;
                this.saveSettings();
                this.listeningAction = null;
                this.renderList();

                if (this.game && this.game.sound && this.game.sound.playClick) {
                    this.game.sound.playClick();
                }
            }
        });
    }

    resetDefaults() {
        this.bindings = JSON.parse(JSON.stringify(this.defaults));
        this.saveSettings();
        this.renderList();
        if (this.game && this.game.sound && this.game.sound.playClick) {
            this.game.sound.playClick();
        }
    }

    openModal() {
        const modal = document.getElementById('keybinds-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderList();
        }
    }

    closeModal() {
        this.listeningAction = null;
        const modal = document.getElementById('keybinds-modal');
        if (modal) modal.style.display = 'none';
    }

    matches(action, event) {
        if (!this.bindings[action]) return false;
        return event.code === this.bindings[action].code;
    }
}

if (typeof window !== 'undefined') {
    window.RobloxKeybindManager = RobloxKeybindManager;
}
