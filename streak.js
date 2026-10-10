/**
 * Roblox Obby Simulator - Daily Login Streak & Rewards System
 * Encourages recurring daily gameplay with persistent streak tracking,
 * progressive coin multipliers, and victory particle celebrations.
 */
class RobloxDailyStreakManager {
    constructor(collectibles, particles, sound, ui) {
        this.collectibles = collectibles;
        this.particles = particles;
        this.sound = sound;
        this.ui = ui;

        this.rewardTiers = [
            { day: 1, coins: 50, label: 'Day 1' },
            { day: 2, coins: 100, label: 'Day 2' },
            { day: 3, coins: 150, label: 'Day 3' },
            { day: 4, coins: 200, label: 'Day 4' },
            { day: 5, coins: 300, label: 'Day 5' },
            { day: 6, coins: 400, label: 'Day 6' },
            { day: 7, coins: 600, label: 'Day 7 Jackpot' }
        ];

        this.streak = parseInt(localStorage.getItem('roblox_daily_streak_count') || '0', 10);
        this.lastClaimDate = localStorage.getItem('roblox_daily_streak_date') || '';

        this.canClaim = false;
        this.checkStreakStatus();
        this.initUI();
    }

    checkStreakStatus() {
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        if (!this.lastClaimDate) {
            // First time ever
            this.canClaim = true;
            this.streak = 1;
        } else if (this.lastClaimDate === todayStr) {
            // Already claimed today
            this.canClaim = false;
        } else {
            // Check if consecutive day
            const lastDate = new Date(this.lastClaimDate);
            const today = new Date(todayStr);
            const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Perfect streak continuation!
                this.streak = (this.streak >= 7) ? 1 : this.streak + 1;
                this.canClaim = true;
            } else {
                // Streak broken (>1 day missed)
                this.streak = 1;
                this.canClaim = true;
            }
        }
    }

    initUI() {
        this.updateTopbarPill();
        this.renderModal();

        // Proactively open streak modal on first load if reward is ready to claim
        if (this.canClaim) {
            setTimeout(() => {
                this.openModal();
            }, 1200);
        }
    }

    updateTopbarPill() {
        const pill = document.getElementById('topbar-streak-btn');
        if (pill) {
            const count = this.canClaim ? this.streak : Math.max(1, this.streak);
            pill.innerHTML = `🔥 Streak: Day ${count} ${this.canClaim ? '<span style="background:#FF3366; color:#FFF; font-size:10px; padding:2px 6px; border-radius:10px; margin-left:4px; animation:pulse 1.5s infinite;">CLAIM</span>' : '✓'}`;
        }
    }

    renderModal() {
        const grid = document.getElementById('streak-rewards-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.rewardTiers.forEach((tier) => {
            const isCompleted = !this.canClaim ? tier.day <= this.streak : tier.day < this.streak;
            const isCurrent = this.canClaim && tier.day === this.streak;
            const isLocked = !isCompleted && !isCurrent;

            const card = document.createElement('div');
            card.className = 'streak-card';
            card.style.cssText = `
                background: ${isCurrent ? 'linear-gradient(135deg, rgba(255,165,0,0.25), rgba(255,69,0,0.35))' : isCompleted ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)'};
                border: 2px solid ${isCurrent ? '#FF8C00' : isCompleted ? '#2ECC71' : 'rgba(255,255,255,0.1)'};
                border-radius: 10px;
                padding: 10px 8px;
                text-align: center;
                flex: 1 1 12%;
                min-width: 80px;
                box-shadow: ${isCurrent ? '0 0 15px rgba(255,140,0,0.5)' : 'none'};
                position: relative;
            `;

            card.innerHTML = `
                <div style="font-size: 11px; font-weight: bold; color: ${isCurrent ? '#FFA500' : isCompleted ? '#2ECC71' : '#AAA'}; margin-bottom: 4px;">
                    ${tier.label}
                </div>
                <div style="font-size: 22px; margin: 4px 0;">
                    ${tier.day === 7 ? '👑' : '🪙'}
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #FFD700;">
                    +${tier.coins}
                </div>
                <div style="font-size: 10px; margin-top: 6px; font-weight: bold; color: ${isCurrent ? '#FFD700' : isCompleted ? '#2ECC71' : '#666'};">
                    ${isCompleted ? '✓ CLAIMED' : isCurrent ? '⚡ READY' : '🔒 LOCKED'}
                </div>
            `;
            grid.appendChild(card);
        });

        const claimBtn = document.getElementById('streak-claim-btn');
        if (claimBtn) {
            if (this.canClaim) {
                claimBtn.disabled = false;
                claimBtn.textContent = `🎁 Claim Day ${this.streak} (+${this.rewardTiers[this.streak - 1].coins} Coins)`;
                claimBtn.style.opacity = '1';
                claimBtn.style.cursor = 'pointer';
            } else {
                claimBtn.disabled = true;
                claimBtn.textContent = `✓ Day ${this.streak} Claimed! Next Reward Tomorrow`;
                claimBtn.style.opacity = '0.6';
                claimBtn.style.cursor = 'not-allowed';
            }
        }
    }

    claimReward() {
        if (!this.canClaim) return;

        const currentReward = this.rewardTiers[this.streak - 1];
        if (!currentReward) return;

        // Award Coins
        if (this.collectibles) {
            this.collectibles.addCoins(currentReward.coins);
        }

        // Save State
        const todayStr = new Date().toISOString().split('T')[0];
        this.lastClaimDate = todayStr;
        this.canClaim = false;
        localStorage.setItem('roblox_daily_streak_date', todayStr);
        localStorage.setItem('roblox_daily_streak_count', this.streak.toString());

        // Confetti & Audio
        if (this.particles) {
            this.particles.spawnConfetti(window.game && window.game.player ? window.game.player.position : new THREE.Vector3(0, 5, 0));
        }
        if (this.sound) {
            this.sound.playWin();
        }

        // Toasts & Chat
        if (this.ui) {
            this.ui.showToastBanner(`🔥 DAILY STREAK: DAY ${this.streak} CLAIMED! +${currentReward.coins} COINS!`);
            this.ui.addChatMessage('Streak', `🔥 Claimed Day ${this.streak} login reward: +${currentReward.coins} Gold Coins! Keep the streak going!`, '#FF8C00');
        }

        this.updateTopbarPill();
        this.renderModal();
    }

    openModal() {
        const modal = document.getElementById('daily-streak-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderModal();
        }
    }

    closeModal() {
        const modal = document.getElementById('daily-streak-modal');
        if (modal) modal.style.display = 'none';
    }
}
