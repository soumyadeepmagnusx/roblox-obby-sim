/**
 * Roblox Obby Simulator - Player Level & Experience (XP) Progression System
 * Awards XP for checkpoints, collected studs, speedrun completions, and parkour feats.
 * Features an animated HUD progress bar, level-up confetti, and coin rewards.
 */
class RobloxLevelSystem {
    constructor(player, particles, sound, ui, collectibles) {
        this.player = player;
        this.particles = particles;
        this.sound = sound;
        this.ui = ui;
        this.collectibles = collectibles;

        this.level = parseInt(localStorage.getItem('roblox_player_level') || '1', 10);
        this.xp = parseInt(localStorage.getItem('roblox_player_xp') || '0', 10);

        this.initDOM();
        this.updateHUD();
    }

    getXpRequiredForLevel(lvl) {
        return Math.floor(80 * Math.pow(1.22, lvl - 1));
    }

    addXP(amount, reason = '') {
        this.xp += amount;
        let leveledUp = false;

        let required = this.getXpRequiredForLevel(this.level);
        while (this.xp >= required) {
            this.xp -= required;
            this.level++;
            leveledUp = true;
            required = this.getXpRequiredForLevel(this.level);
        }

        this.saveState();
        this.updateHUD();

        if (leveledUp) {
            this.onLevelUp();
        } else if (reason && this.ui) {
            // Optional subtle notification if significant XP
            if (amount >= 50) {
                this.ui.showToastBanner(`⭐ +${amount} XP (${reason})`);
            }
        }
    }

    onLevelUp() {
        const bonusCoins = 25 * this.level;
        if (this.collectibles && this.collectibles.addCoins) {
            this.collectibles.addCoins(bonusCoins);
        } else if (this.player) {
            this.player.coins = (this.player.coins || 0) + bonusCoins;
            const coinEl = document.getElementById('hud-coins');
            if (coinEl) coinEl.innerText = this.player.coins;
        }

        if (this.particles && this.player) {
            this.particles.spawnConfetti(this.player.position);
        }
        if (this.sound) {
            this.sound.playVictory();
        }
        if (this.ui) {
            this.ui.showToastBanner(`🎉 LEVEL UP! YOU ARE NOW LEVEL ${this.level}! (+${bonusCoins} 🪙)`);
            this.ui.addChatMessage('Level', `🌟 Level Up! Reached Level ${this.level} and earned +${bonusCoins} Gold Coins!`, '#00FFCC');
        }
    }

    saveState() {
        try {
            localStorage.setItem('roblox_player_level', this.level.toString());
            localStorage.setItem('roblox_player_xp', this.xp.toString());
        } catch (e) {}
    }

    initDOM() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('hud-level-container')) return;

        const container = document.createElement('div');
        container.id = 'hud-level-container';
        container.style.cssText = `
            position: absolute;
            top: 56px;
            right: 16px;
            background: rgba(18, 22, 32, 0.88);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0, 255, 204, 0.4);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            border-radius: 20px;
            padding: 6px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 45;
            color: #FFF;
            font-family: 'Segoe UI', Arial, sans-serif;
            pointer-events: auto;
        `;

        container.innerHTML = `
            <div style="font-weight:800; font-size:12px; color:#00FFCC; display:flex; align-items:center; gap:4px;">
                ⭐ <span id="hud-level-badge">Lv. 1</span>
            </div>
            <div style="width:70px; background:rgba(255,255,255,0.12); height:6px; border-radius:3px; overflow:hidden;">
                <div id="hud-level-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #00FFCC, #0077FF); transition:width 0.3s ease;"></div>
            </div>
            <div id="hud-level-xp-text" style="font-size:10px; color:#AAA; min-width:45px; text-align:right;">0/80 XP</div>
        `;

        document.body.appendChild(container);
    }

    updateHUD() {
        if (typeof document === 'undefined') return;
        const badge = document.getElementById('hud-level-badge');
        const bar = document.getElementById('hud-level-bar');
        const xpText = document.getElementById('hud-level-xp-text');

        const req = this.getXpRequiredForLevel(this.level);
        const pct = Math.min(100, Math.round((this.xp / req) * 100));

        if (badge) badge.innerText = `Lv. ${this.level}`;
        if (bar) bar.style.width = `${pct}%`;
        if (xpText) xpText.innerText = `${this.xp}/${req} XP`;
    }
}

if (typeof window !== 'undefined') {
    window.RobloxLevelSystem = RobloxLevelSystem;
}
