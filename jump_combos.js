/**
 * Roblox Jump Combo & Momentum Multiplier System
 * Chains consecutive fluid parkour jumps to build multipliers, award bonus studs,
 * and display animated floating combo banners with audio feedback.
 */
class RobloxJumpComboSystem {
    constructor(player, sound, particles, ui, collectibles) {
        this.player = player;
        this.sound = sound;
        this.particles = particles;
        this.ui = ui;
        this.collectibles = collectibles;

        this.combo = 0;
        this.maxCombo = parseInt(localStorage.getItem('roblox_max_jump_combo') || '0', 10);
        this.comboTimer = 0;
        this.comboTimeout = 2.4; // seconds allowed between jumps
        this.lastGrounded = true;

        this.badgeEl = null;
        if (typeof document !== 'undefined') {
            this.initUI();
        }
    }

    initUI() {
        this.badgeEl = document.createElement('div');
        this.badgeEl.id = 'jump-combo-badge';
        this.badgeEl.style.cssText = `
            position: absolute;
            top: 56px;
            left: 20px;
            display: none;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, rgba(255, 107, 0, 0.9), rgba(255, 30, 80, 0.9));
            color: #FFFFFF;
            font-family: "Segoe UI", Roboto, sans-serif;
            font-weight: 900;
            font-size: 14px;
            padding: 6px 14px;
            border-radius: 20px;
            box-shadow: 0 0 16px rgba(255, 107, 0, 0.7);
            border: 2px solid #FFDE00;
            pointer-events: none;
            z-index: 20;
            transform-origin: left center;
            transition: transform 0.15s ease-out;
        `;
        document.body.appendChild(this.badgeEl);
    }

    onJump() {
        if (!this.player || this.player.isDead) return;

        this.combo++;
        this.comboTimer = this.comboTimeout;

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            try {
                localStorage.setItem('roblox_max_jump_combo', this.maxCombo.toString());
            } catch (e) {}
        }

        // Award bonus studs and particle sparks at combo milestones
        if (this.combo >= 3) {
            let bonusCoins = 1;
            let tierName = '🔥 COMBO';
            if (this.combo >= 10) {
                bonusCoins = 5;
                tierName = '👑 GODLIKE COMBO';
            } else if (this.combo >= 6) {
                bonusCoins = 3;
                tierName = '⚡ SUPER COMBO';
            }

            if (this.collectibles && this.collectibles.addCoins) {
                this.collectibles.addCoins(bonusCoins);
            }

            if (this.particles && this.particles.spawnSparkles && this.player.position) {
                this.particles.spawnSparkles(this.player.position, 12);
            }

            if (this.sound && this.sound.playSparkle) {
                this.sound.playSparkle();
            }

            if (this.ui && this.ui.showToastBanner && (this.combo === 3 || this.combo === 6 || this.combo === 10)) {
                this.ui.showToastBanner(`${tierName}: ${this.combo}x! (+${bonusCoins} Studs)`);
            }
        }

        this.updateBadge();
    }

    resetCombo() {
        if (this.combo === 0) return;
        this.combo = 0;
        this.comboTimer = 0;
        if (this.badgeEl) {
            this.badgeEl.style.display = 'none';
        }
    }

    updateBadge() {
        if (!this.badgeEl) return;
        if (this.combo < 2) {
            this.badgeEl.style.display = 'none';
            return;
        }

        const tierEmoji = this.combo >= 10 ? '👑' : this.combo >= 6 ? '⚡' : '🔥';
        this.badgeEl.innerHTML = `${tierEmoji} <span>${this.combo}x JUMP COMBO</span> <span style="font-size:11px; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:10px;">${this.comboTimer.toFixed(1)}s</span>`;
        this.badgeEl.style.display = 'flex';
        this.badgeEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            if (this.badgeEl) this.badgeEl.style.transform = 'scale(1.0)';
        }, 120);
    }

    update(dt) {
        if (!this.player) return;

        // Reset combo on death or falling into void
        if (this.player.isDead || (this.player.position && this.player.position.y < -15)) {
            this.resetCombo();
            return;
        }

        // Decrement combo countdown timer
        if (this.combo > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            } else if (this.badgeEl && this.combo >= 2) {
                const timeSpan = this.badgeEl.querySelector('span:last-child');
                if (timeSpan) {
                    timeSpan.textContent = `${Math.max(0, this.comboTimer).toFixed(1)}s`;
                }
            }
        }

        this.lastGrounded = this.player.isGrounded;
    }
}

if (typeof window !== 'undefined') {
    window.RobloxJumpComboSystem = RobloxJumpComboSystem;
}
