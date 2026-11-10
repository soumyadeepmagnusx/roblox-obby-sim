/**
 * Roblox Avatar Title & Rank Progression System
 * Displays prestigious floating rank titles above the avatar's head
 * and allows players to unlock and equip unique titles based on gameplay achievements.
 */
class RobloxTitleSystem {
    constructor(player, sound, ui) {
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.titles = [
            { id: 'noob', name: '🐣 Noob Adventurer', color: '#00FF88', req: 'Default starter title for all new players', check: () => true },
            { id: 'jumper', name: '⚡ Parkour Jumper', color: '#00D2FF', req: 'Reach Stage 2 (Neon Lava Leap)', check: () => (this.player.maxStageReached || this.player.currentStage) >= 2 },
            { id: 'lava_dodger', name: '🔥 Lava Surviver', color: '#FF5722', req: 'Reach Stage 3 (Laser Grid)', check: () => (this.player.maxStageReached || this.player.currentStage) >= 3 },
            { id: 'acrobat', name: '🌀 Obstacle Master', color: '#9B51E0', req: 'Reach Stage 5 (Vanishing Tiles)', check: () => (this.player.maxStageReached || this.player.currentStage) >= 5 },
            { id: 'champion', name: '👑 Obby Champion', color: '#FFD700', req: "Reach Stage 6 (Winner's Peak)", check: () => (this.player.maxStageReached || this.player.currentStage) >= 6 || this.player.hasWon },
            { id: 'coin_hoarder', name: '💰 Stud Collector', color: '#F1C40F', req: 'Collect at least 15 golden studs', check: () => (this.player.coins || 0) >= 15 },
            { id: 'speed_demon', name: '🚀 Speed Demon', color: '#E91E63', req: 'Complete a speedrun attempt under 3 minutes', check: () => localStorage.getItem('roblox_obby_pb') !== null },
            { id: 'roblox_legend', name: '⭐ Roblox Legend', color: '#FFFFFF', req: 'Beat the Obby and collect 30+ studs', check: () => this.player.hasWon && (this.player.coins || 0) >= 30 }
        ];

        this.equippedTitleId = localStorage.getItem('roblox_equipped_title') || 'noob';

        this.initDOM();
        this.updateNameplate();
    }

    getEquippedTitle() {
        return this.titles.find(t => t.id === this.equippedTitleId) || this.titles[0];
    }

    equipTitle(id) {
        const title = this.titles.find(t => t.id === id);
        if (!title) return;

        if (!title.check()) {
            if (this.sound) this.sound.playOof();
            if (this.ui) this.ui.showToastBanner('🔒 Title Locked: ' + title.req);
            return;
        }

        this.equippedTitleId = id;
        localStorage.setItem('roblox_equipped_title', id);
        this.updateNameplate();
        this.renderModal();

        if (this.sound) this.sound.playCoin();
        if (this.ui) {
            this.ui.showToastBanner(`✨ Equipped Title: ${title.name}`);
            this.ui.addChatMessage('System', `Equipped prestige title: ${title.name}`, title.color);
        }
    }

    updateNameplate() {
        if (!this.player || !this.player.nameplate) return;

        const title = this.getEquippedTitle();
        const canvas = document.createElement('canvas');
        canvas.width = 340;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');

        // Dark pill background
        ctx.fillStyle = 'rgba(10, 14, 22, 0.75)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(15, 6, 310, 108, 14);
        } else {
            ctx.rect(15, 6, 310, 108);
        }
        ctx.fill();

        // Border glow
        ctx.strokeStyle = title.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Prestige Title Tag
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = title.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = title.color;
        ctx.shadowBlur = 8;
        ctx.fillText(title.name, 170, 36);
        ctx.shadowBlur = 0; // reset

        // Player Name
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Player1', 170, 68);

        // Health Bar Background
        ctx.fillStyle = '#333333';
        if (ctx.roundRect) {
            ctx.roundRect(35, 82, 270, 16, 5);
        } else {
            ctx.rect(35, 82, 270, 16);
        }
        ctx.fill();

        // Health Fill
        const healthPercent = Math.max(0, Math.min(1, (this.player.health || 100) / 100));
        ctx.fillStyle = healthPercent > 0.3 ? '#2ECC71' : '#E74C3C';
        if (ctx.roundRect) {
            ctx.roundRect(37, 84, Math.max(4, (270 - 4) * healthPercent), 12, 4);
        } else {
            ctx.rect(37, 84, Math.max(4, (270 - 4) * healthPercent), 12);
        }
        ctx.fill();

        // Update Three.js Texture
        const texture = new THREE.CanvasTexture(canvas);
        this.player.nameplate.material.map = texture;
        this.player.nameplate.material.needsUpdate = true;
        this.player.nameplate.scale.set(3.8, 1.35, 1);
    }

    initDOM() {
        const modal = document.createElement('div');
        modal.id = 'titles-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 120;
            align-items: center;
            justify-content: center;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 520px;
            max-width: 92%;
            max-height: 85vh;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #00FF88;
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
                <div style="font-size:20px; font-weight:800; color:#00FF88; display:flex; align-items:center; gap:8px;">
                    🎖️ <span>PRESTIGE TITLES & RANKS</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.titles.toggleModal()">✕</span>
            </div>
            <div style="font-size:13px; color:#CCC;">
                Equip prestigious floating nameplate titles above your character. Complete Obby stages and milestones to unlock rare titles!
            </div>
            <div id="titles-list" style="display:flex; flex-direction:column; gap:10px;"></div>
            <button class="menu-btn primary" onclick="window.game.titles.toggleModal()" style="width:100%; padding:12px; font-weight:bold; background:#00FF88; color:#000; border:none; border-radius:8px; cursor:pointer;">
                Done
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;
        this.renderModal();
    }

    renderModal() {
        const list = document.getElementById('titles-list');
        if (!list) return;

        list.innerHTML = '';
        this.titles.forEach(t => {
            const unlocked = t.check();
            const isEquipped = t.id === this.equippedTitleId;

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: ${isEquipped ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${isEquipped ? '#00FF88' : unlocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'};
                padding: 12px 16px;
                border-radius: 10px;
                opacity: ${unlocked ? '1' : '0.6'};
            `;

            item.innerHTML = `
                <div>
                    <div style="font-weight:bold; font-size:15px; color:${t.color};">${t.name}</div>
                    <div style="font-size:11px; color:#AAA; margin-top:3px;">${t.req}</div>
                </div>
                <button style="
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: ${unlocked ? 'pointer' : 'not-allowed'};
                    background: ${isEquipped ? '#00FF88' : unlocked ? '#3498DB' : '#555'};
                    color: ${isEquipped ? '#000' : '#FFF'};
                    border: none;
                ">
                    ${isEquipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : 'LOCKED 🔒'}
                </button>
            `;

            if (unlocked && !isEquipped) {
                item.querySelector('button').addEventListener('click', () => {
                    this.equipTitle(t.id);
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

window.RobloxTitleSystem = RobloxTitleSystem;
