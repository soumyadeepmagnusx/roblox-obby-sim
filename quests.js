/**
 * Roblox Obby Quest Board & Live HUD Tracker
 * Tracks milestone missions, displays progress bars on HUD, and rewards coins.
 */
class RobloxQuestManager {
    constructor(player, sound, ui, particles) {
        this.player = player;
        this.sound = sound;
        this.ui = ui;
        this.particles = particles;

        this.claimedIds = JSON.parse(localStorage.getItem('roblox_claimed_quests') || '[]');

        this.quests = [
            {
                id: 'warm_up_studs',
                title: '🪙 Stud Hunter',
                desc: 'Collect at least 5 Golden Studs across the Obby.',
                reward: 10,
                target: 5,
                getProgress: () => Math.min(5, this.player ? (this.player.coins || 0) : 0)
            },
            {
                id: 'lava_stage',
                title: '🔥 Lava Leap Survivor',
                desc: 'Advance to Stage 2: Neon Lava Leap.',
                reward: 15,
                target: 2,
                getProgress: () => Math.min(2, this.player ? (this.player.maxStageReached || this.player.currentStage || 1) : 1)
            },
            {
                id: 'cloud_jumper',
                title: '🌌 Cloud & Sky Explorer',
                desc: 'Reach Stage 4 OR enter the secret Starlight Sky Realm.',
                reward: 25,
                target: 1,
                getProgress: () => {
                    if (!this.player) return 0;
                    const high = (this.player.position && this.player.position.y > 60) || (this.player.currentStage >= 4);
                    return high ? 1 : 0;
                }
            },
            {
                id: 'alchemist',
                title: '🧪 Alchemist Initiate',
                desc: 'Activate any Power-Up Potion from the Potion Shop (Key Y).',
                reward: 15,
                target: 1,
                getProgress: () => {
                    const potions = window.game && window.game.potions;
                    return (potions && Object.keys(potions.activeBuffs).length > 0) ? 1 : 0;
                }
            },
            {
                id: 'fashion_icon',
                title: '🎩 Robloxian Stylist',
                desc: 'Equip any cosmetic accessory in Wardrobe (Key U) or a Particle Trail.',
                reward: 20,
                target: 1,
                getProgress: () => {
                    const acc = localStorage.getItem('roblox_equipped_accessories');
                    const trail = localStorage.getItem('roblox_equipped_trail');
                    return (acc || trail) ? 1 : 0;
                }
            }
        ];

        // Sticky completion memory so completed quests remain claimable
        this.completedIds = JSON.parse(localStorage.getItem('roblox_completed_quests') || '[]');

        this.initDOM();
        this.initKeyListeners();
    }

    initDOM() {
        // Floating Compact Tracker Widget (top-left below chat)
        const tracker = document.createElement('div');
        tracker.id = 'quest-tracker-hud';
        tracker.style.cssText = `
            position: absolute;
            top: 56px;
            left: 16px;
            width: 240px;
            background: rgba(18, 22, 32, 0.84);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 215, 0, 0.45);
            border-radius: 12px;
            padding: 10px 12px;
            color: #FFF;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 45;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
            transition: transform 0.2s ease;
        `;
        tracker.title = 'Click to open Full Quest Board (Key Q)';
        tracker.addEventListener('click', () => this.toggleModal());
        document.body.appendChild(tracker);
        this.tracker = tracker;

        // Quest Board Modal
        const modal = document.createElement('div');
        modal.id = 'quests-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 128;
            align-items: center;
            justify-content: center;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 520px;
            max-width: 92%;
            max-height: 85vh;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #FFD700;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            color: #FFFFFF;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                <div style="font-size:20px; font-weight:800; color:#FFD700; display:flex; align-items:center; gap:8px;">
                    📜 <span>OBBY QUEST BOARD</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.quests.toggleModal()">✕</span>
            </div>
            <div style="font-size:13px; color:#CCC;">
                Complete missions to earn bonus golden studs and accelerate your progression!
            </div>
            <div id="quests-list" style="display:flex; flex-direction:column; gap:10px;"></div>
            <button class="menu-btn primary" onclick="window.game.quests.toggleModal()" style="width:100%; padding:12px; font-weight:bold; background:#FFD700; color:#000; border:none; border-radius:8px; cursor:pointer;">
                Close Quests
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'q' || e.key === 'Q') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.toggleModal();
            }
        });
    }

    isQuestComplete(q) {
        if (this.completedIds.includes(q.id)) return true;
        const prog = q.getProgress();
        if (prog >= q.target) {
            this.completedIds.push(q.id);
            localStorage.setItem('roblox_completed_quests', JSON.stringify(this.completedIds));
            if (this.ui) {
                this.ui.showToastBanner(`📜 Quest Complete: ${q.title}! Click Quests [Q] to claim +${q.reward} Studs!`);
            }
            return true;
        }
        return false;
    }

    claimReward(id) {
        if (this.claimedIds.includes(id)) return;
        const q = this.quests.find(item => item.id === id);
        if (!q || !this.isQuestComplete(q)) return;

        this.claimedIds.push(id);
        localStorage.setItem('roblox_claimed_quests', JSON.stringify(this.claimedIds));

        if (this.player) {
            this.player.coins = (this.player.coins || 0) + q.reward;
            const coinEl = document.getElementById('hud-coins');
            const statEl = document.getElementById('stat-coins');
            if (coinEl) coinEl.innerText = this.player.coins;
            if (statEl) statEl.innerText = this.player.coins;
        }

        if (this.sound) this.sound.playVictory();
        if (this.particles && this.particles.spawnCoinSparkles && this.player) {
            this.particles.spawnCoinSparkles(this.player.position);
        }
        if (this.ui) {
            this.ui.showToastBanner(`🎉 Claimed +${q.reward} Studs from ${q.title}!`);
            this.ui.addChatMessage('Quest', `Completed & Claimed: ${q.title} (+${q.reward}🪙)`, '#FFD700');
        }

        this.renderModal();
        this.updateTrackerHUD();
    }

    update() {
        // Throttled check during loop (~every 30 frames or simply lightweight)
        if (!this._frameCount) this._frameCount = 0;
        this._frameCount++;
        if (this._frameCount % 30 !== 0) return;

        this.quests.forEach(q => this.isQuestComplete(q));
        this.updateTrackerHUD();
    }

    updateTrackerHUD() {
        if (!this.tracker) return;

        // Find first unclaimed quest
        const active = this.quests.find(q => !this.claimedIds.includes(q.id));
        if (!active) {
            this.tracker.innerHTML = `
                <div style="font-size:12px; font-weight:bold; color:#00FF88;">🏆 ALL QUESTS COMPLETED!</div>
                <div style="font-size:10px; color:#AAA; margin-top:2px;">You conquered the entire Obby Quest Board!</div>
            `;
            return;
        }

        const isDone = this.isQuestComplete(active);
        const prog = isDone ? active.target : active.getProgress();
        const pct = Math.min(100, Math.round((prog / active.target) * 100));

        this.tracker.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; font-weight:bold; color:${isDone ? '#00FF88' : '#FFD700'};">
                <span>${active.title}</span>
                <span>${isDone ? 'CLAIM! 🎁' : `${prog}/${active.target}`}</span>
            </div>
            <div style="font-size:10px; color:#CCC; margin:3px 0 5px 0; line-height:1.2;">${active.desc}</div>
            <div style="background:rgba(255,255,255,0.12); height:5px; border-radius:4px; overflow:hidden;">
                <div style="background:${isDone ? '#00FF88' : '#FFD700'}; width:${pct}%; height:100%; transition:width 0.3s ease;"></div>
            </div>
        `;
    }

    renderModal() {
        const list = document.getElementById('quests-list');
        if (!list) return;

        list.innerHTML = '';
        this.quests.forEach(q => {
            const isClaimed = this.claimedIds.includes(q.id);
            const isDone = this.isQuestComplete(q);
            const prog = isDone ? q.target : q.getProgress();

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: ${isClaimed ? 'rgba(0, 255, 136, 0.08)' : isDone ? 'rgba(255, 215, 0, 0.14)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${isClaimed ? 'rgba(0, 255, 136, 0.3)' : isDone ? '#FFD700' : 'rgba(255,255,255,0.12)'};
                padding: 12px 16px;
                border-radius: 10px;
                opacity: ${isClaimed ? '0.65' : '1'};
            `;

            item.innerHTML = `
                <div>
                    <div style="font-weight:bold; font-size:15px; color:${isDone && !isClaimed ? '#FFD700' : '#FFF'};">${q.title}</div>
                    <div style="font-size:11px; color:#AAA; margin-top:2px;">${q.desc} (${prog}/${q.target})</div>
                </div>
                <button style="
                    padding: 7px 14px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: ${isDone && !isClaimed ? 'pointer' : 'default'};
                    background: ${isClaimed ? '#2ECC71' : isDone ? 'linear-gradient(135deg, #FFD700, #F39C12)' : 'rgba(255,255,255,0.1)'};
                    color: ${isClaimed || isDone ? '#000' : '#AAA'};
                    border: none;
                    white-space: nowrap;
                ">
                    ${isClaimed ? 'CLAIMED ✓' : isDone ? `CLAIM +${q.reward} 🪙` : `Reward: ${q.reward} 🪙`}
                </button>
            `;

            if (isDone && !isClaimed) {
                item.querySelector('button').addEventListener('click', () => {
                    this.claimReward(q.id);
                });
            }

            list.appendChild(item);
        });
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) this.renderModal();
    }
}

window.RobloxQuestManager = RobloxQuestManager;
