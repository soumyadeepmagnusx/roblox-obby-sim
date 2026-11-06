/**
 * Roblox Achievements & Badges System
 * Tracks milestones, awards bonus gold coins, displays iconic Roblox badge popups,
 * and maintains persistent progress across gameplay sessions.
 */
class RobloxAchievements {
    constructor(collectibles, particles, sound, ui) {
        this.collectibles = collectibles;
        this.particles = particles;
        this.sound = sound;
        this.ui = ui;

        this.badgeCatalog = [
            { id: 'first_steps', name: 'First Steps', desc: 'Conquer Stage 1 obstacles.', icon: '👟', reward: 25 },
            { id: 'checkpoint_chaser', name: 'Halfway There', desc: 'Reach Checkpoint Stage 3.', icon: '🚩', reward: 50 },
            { id: 'obby_master', name: 'Obby Champion', desc: 'Conquer the final Stage 6 and touch the Trophy!', icon: '🏆', reward: 200 },
            { id: 'coin_hoarder', name: 'Treasure Hunter', desc: 'Accumulate 150 total Gold Coins.', icon: '🪙', reward: 75 },
            { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete the Obby in under 2 minutes.', icon: '⚡', reward: 150 },
            { id: 'pet_tamer', name: 'Companion Bond', desc: 'Hatch or equip any 3D Pet.', icon: '🐾', reward: 50 },
            { id: 'stargazer', name: 'Night Owl', desc: 'Switch atmosphere to Night or Synthwave.', icon: '🌌', reward: 35 },
            { id: 'hover_rider', name: 'Cyber Surfer', desc: 'Mount and ride the Cyber Hoverboard (H).', icon: '🛹', reward: 30 },
            { id: 'jetpack_aviator', name: 'Rocket Aviator', desc: 'Blast off with the Jetpack (J).', icon: '🚀', reward: 40 },
            { id: 'sword_master', name: 'Gladiator Duelist', desc: 'Engage in PvP sword combat.', icon: '⚔️', reward: 50 }
        ];

        this.unlockedBadges = this.loadUnlockedBadges();
        this.createPopupDOM();
        this.renderBadgeModal();
    }

    loadUnlockedBadges() {
        try {
            return JSON.parse(localStorage.getItem('roblox_unlocked_badges') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveUnlockedBadges() {
        try {
            localStorage.setItem('roblox_unlocked_badges', JSON.stringify(this.unlockedBadges));
        } catch (e) {}
    }

    createPopupDOM() {
        if (document.getElementById('roblox-badge-popup')) return;

        const container = document.createElement('div');
        container.id = 'roblox-badge-popup';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 320px;
            background: linear-gradient(135deg, rgba(20, 24, 33, 0.96), rgba(30, 36, 48, 0.96));
            border: 2px solid #FFD700;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.35);
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            z-index: 9999;
            transform: translateX(400px);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
            pointer-events: none;
            backdrop-filter: blur(8px);
        `;

        container.innerHTML = `
            <div id="badge-popup-icon" style="
                width: 52px;
                height: 52px;
                background: radial-gradient(circle, #FFE259 0%, #FFA751 100%);
                border: 2px solid #FFF;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 26px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                flex-shrink: 0;
            ">🏆</div>
            <div style="flex-grow: 1;">
                <div style="font-size: 10px; font-weight: 800; color: #FFD700; text-transform: uppercase; letter-spacing: 1px;">Badge Unlocked!</div>
                <div id="badge-popup-title" style="font-size: 14px; font-weight: bold; color: #FFF; margin: 2px 0;">Obby Champion</div>
                <div id="badge-popup-desc" style="font-size: 11px; color: #AAA; line-height: 1.2;">Conquered the final stage!</div>
                <div id="badge-popup-reward" style="font-size: 11px; color: #00FF88; font-weight: bold; margin-top: 3px;">+200 Gold Coins</div>
            </div>
        `;

        document.body.appendChild(container);
    }

    unlock(badgeId) {
        if (this.unlockedBadges[badgeId]) return; // Already unlocked

        const badge = this.badgeCatalog.find(b => b.id === badgeId);
        if (!badge) return;

        this.unlockedBadges[badgeId] = {
            unlockedAt: new Date().toISOString()
        };
        this.saveUnlockedBadges();

        // Award bonus coins
        if (this.collectibles && badge.reward) {
            this.collectibles.addCoins(badge.reward);
        }

        // Trigger audio fanfare and particles
        if (this.sound) {
            this.sound.playWin();
        }
        if (this.particles) {
            const playerPos = (window.game && window.game.player) ? window.game.player.position : new THREE.Vector3(0, 5, 0);
            this.particles.spawnConfetti(playerPos);
        }

        // Show badge popup notification
        this.showPopup(badge);

        // Add chat notification
        if (this.ui) {
            this.ui.addChatMessage('Badge Unlocked', `🎖️ "${badge.name}" — ${badge.desc} (+${badge.reward} Coins)`, '#FFD700');
            this.ui.showToastBanner(`🎖️ BADGE UNLOCKED: ${badge.name}!`);
        }

        this.renderBadgeModal();
    }

    showPopup(badge) {
        const popup = document.getElementById('roblox-badge-popup');
        const iconEl = document.getElementById('badge-popup-icon');
        const titleEl = document.getElementById('badge-popup-title');
        const descEl = document.getElementById('badge-popup-desc');
        const rewardEl = document.getElementById('badge-popup-reward');

        if (!popup) return;

        iconEl.textContent = badge.icon;
        titleEl.textContent = badge.name;
        descEl.textContent = badge.desc;
        rewardEl.textContent = `+${badge.reward} Gold Coins`;

        popup.style.transform = 'translateX(0)';
        popup.style.opacity = '1';

        clearTimeout(this._popupTimeout);
        this._popupTimeout = setTimeout(() => {
            popup.style.transform = 'translateX(400px)';
            popup.style.opacity = '0';
        }, 4500);
    }

    renderBadgeModal() {
        const grid = document.getElementById('badges-modal-grid');
        if (!grid) return;

        grid.innerHTML = '';
        let unlockedCount = 0;

        this.badgeCatalog.forEach(badge => {
            const isUnlocked = !!this.unlockedBadges[badge.id];
            if (isUnlocked) unlockedCount++;

            const card = document.createElement('div');
            card.style.cssText = `
                background: ${isUnlocked ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)'};
                border: 1px solid ${isUnlocked ? '#FFD700' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 10px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: ${isUnlocked ? '0 0 10px rgba(255, 215, 0, 0.2)' : 'none'};
            `;

            card.innerHTML = `
                <div style="
                    width: 44px;
                    height: 44px;
                    background: ${isUnlocked ? 'radial-gradient(circle, #FFE259 0%, #FFA751 100%)' : '#333'};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    filter: ${isUnlocked ? 'none' : 'grayscale(100%) opacity(40%)'};
                    flex-shrink: 0;
                ">${badge.icon}</div>
                <div style="flex-grow: 1; text-align: left;">
                    <div style="font-size: 13px; font-weight: bold; color: ${isUnlocked ? '#FFF' : '#777'};">
                        ${badge.name}
                    </div>
                    <div style="font-size: 11px; color: ${isUnlocked ? '#BBB' : '#555'}; margin: 2px 0;">
                        ${badge.desc}
                    </div>
                    <div style="font-size: 10px; font-weight: bold; color: ${isUnlocked ? '#00FF88' : '#777'};">
                        ${isUnlocked ? '✓ UNLOCKED' : `Reward: +${badge.reward} Coins`}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        const countEl = document.getElementById('badges-unlocked-count');
        if (countEl) {
            countEl.textContent = `${unlockedCount} / ${this.badgeCatalog.length}`;
        }
    }

    openModal() {
        const modal = document.getElementById('badges-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderBadgeModal();
        }
    }

    closeModal() {
        const modal = document.getElementById('badges-modal');
        if (modal) modal.style.display = 'none';
    }
}
