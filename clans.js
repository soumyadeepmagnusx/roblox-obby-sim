/**
 * Roblox Obby Simulator - Player Clan & Squad Tag System
 * Displays customizable clan tags above player avatar and in chat messages.
 * Includes official clan presets and custom tag creation with color accents.
 */
class RobloxClanSystem {
    constructor(player, ui, sound) {
        this.player = player;
        this.ui = ui;
        this.sound = sound;

        this.clans = [
            { tag: "PRO", name: "Pro Obbyists", color: "#00FFFF" },
            { tag: "TITN", name: "Titan Champions", color: "#FFD700" },
            { tag: "VOID", name: "Void Walkers", color: "#9933FF" },
            { tag: "APEX", name: "Apex Jumpers", color: "#FF2255" },
            { tag: "SPEED", name: "Speedrun Kings", color: "#00FF88" },
            { tag: "OG", name: "Robloxian 2006", color: "#FFB300" }
        ];

        this.currentClan = this.loadClan() || { tag: "PRO", color: "#00FFFF" };

        this.initDOM();
        this.updateOverheadTag();
    }

    loadClan() {
        try {
            const raw = localStorage.getItem('roblox_player_clan');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    saveClan(clan) {
        try {
            localStorage.setItem('roblox_player_clan', JSON.stringify(clan));
        } catch (e) {}
    }

    setClan(tag, color = '#00FFFF') {
        const cleanTag = tag.trim().toUpperCase().slice(0, 5);
        if (!cleanTag) {
            this.currentClan = null;
            try { localStorage.removeItem('roblox_player_clan'); } catch (e) {}
        } else {
            this.currentClan = { tag: cleanTag, color };
            this.saveClan(this.currentClan);
        }

        this.updateOverheadTag();

        if (this.ui) {
            this.ui.showToastBanner(`🛡️ Clan Tag Set: [${cleanTag || 'NONE'}]`);
            this.ui.addChatMessage('Clan', `Joined squad clan tag: [${cleanTag || 'NONE'}]`, color);
        }
        if (this.sound) {
            this.sound.playCoin();
        }
    }

    getFormattedName(playerName = 'Player') {
        if (!this.currentClan || !this.currentClan.tag) return playerName;
        return `[${this.currentClan.tag}] ${playerName}`;
    }

    updateOverheadTag() {
        const tagEl = document.getElementById('player-clan-overhead-text');
        if (tagEl) {
            if (this.currentClan && this.currentClan.tag) {
                tagEl.textContent = `[${this.currentClan.tag}]`;
                tagEl.style.color = this.currentClan.color || '#00FFFF';
                tagEl.style.display = 'inline';
            } else {
                tagEl.style.display = 'none';
            }
        }
    }

    initDOM() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('clan-customizer-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'clan-customizer-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 120;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 480px;
            max-width: 92%;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #FFD700;
            box-shadow: 0 12px 40px rgba(255, 215, 0, 0.35);
            border-radius: 16px;
            padding: 24px;
            color: #FFF;
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                <div style="font-size:18px; font-weight:800; color:#FFD700; display:flex; align-items:center; gap:8px;">
                    🛡️ <span>CLAN & SQUAD TAGS</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.clanSystem.toggleModal()">✕</span>
            </div>
            <div style="font-size:12px; color:#CCC;">
                Equip a verified Obby clan tag or type your own 3–5 letter squad tag to display above your avatar in multiplayer!
            </div>
            <div id="clan-presets-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;"></div>

            <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:12px; display:flex; gap:8px;">
                <input type="text" id="custom-clan-input" placeholder="CUSTOM TAG (max 5)" maxlength="5" style="flex:1; background:rgba(0,0,0,0.5); border:1px solid #555; color:#FFF; border-radius:8px; padding:8px 12px; font-weight:bold; text-transform:uppercase;">
                <button id="custom-clan-btn" style="background:#FFD700; color:#000; font-weight:bold; border:none; border-radius:8px; padding:8px 16px; cursor:pointer;">Apply</button>
            </div>

            <button class="menu-btn primary" onclick="window.game.clanSystem.toggleModal()" style="width:100%; padding:10px; font-weight:bold; background:rgba(255,255,255,0.1); color:#FFF; border:none; border-radius:8px; cursor:pointer;">
                Close
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;

        this.renderPresets();

        document.getElementById('custom-clan-btn').addEventListener('click', () => {
            const input = document.getElementById('custom-clan-input');
            if (input && input.value) {
                this.setClan(input.value, '#FFD700');
                input.value = '';
            }
        });
    }

    renderPresets() {
        const grid = document.getElementById('clan-presets-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.clans.forEach(c => {
            const item = document.createElement('div');
            item.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                padding: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: transform 0.2s, border-color 0.2s;
            `;
            item.onmouseover = () => { item.style.transform = 'translateY(-2px)'; item.style.borderColor = c.color; };
            item.onmouseout = () => { item.style.transform = 'none'; item.style.borderColor = 'rgba(255,255,255,0.15)'; };

            item.innerHTML = `
                <div>
                    <div style="font-weight:bold; font-size:14px; color:${c.color};">[${c.tag}]</div>
                    <div style="font-size:10px; color:#AAA;">${c.name}</div>
                </div>
                <button style="background:${c.color}; color:#000; font-size:11px; font-weight:bold; border:none; border-radius:6px; padding:4px 8px; cursor:pointer;">Join</button>
            `;

            item.addEventListener('click', () => {
                this.setClan(c.tag, c.color);
            });

            grid.appendChild(item);
        });
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
    }
}

if (typeof window !== 'undefined') {
    window.RobloxClanSystem = RobloxClanSystem;
}
