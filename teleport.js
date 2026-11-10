/**
 * Roblox Checkpoint Teleporter & Stage Navigator
 * Allows players to navigate and instantly teleport between any unlocked Obby stages,
 * spawn points, and bonus sky islands.
 */
class RobloxStageNavigator {
    constructor(player, scene, sound, ui, particles) {
        this.player = player;
        this.scene = scene;
        this.sound = sound;
        this.ui = ui;
        this.particles = particles;

        this.stages = [
            { num: 0, name: 'Spawn Island', desc: 'The starting hub, Pet Egg Pedestal & Wardrobe.', pos: { x: 0, y: 5, z: 0 }, icon: '🏠' },
            { num: 1, name: 'Stage 1: Rainbow Steps', desc: 'Vibrant elevated rainbow stepping platforms.', pos: { x: 0, y: 3.5, z: 18 }, icon: '🌈' },
            { num: 2, name: 'Stage 2: Neon Lava Leap', desc: 'Deadly sea of crimson lava with stone pillars.', pos: { x: 0, y: 8.5, z: 62 }, icon: '🔥' },
            { num: 3, name: 'Stage 3: Laser Grid', desc: 'Pulsing laser beams and high-altitude walkways.', pos: { x: 0, y: 12.0, z: 114 }, icon: '⚡' },
            { num: 4, name: 'Stage 4: Spinning Beams', desc: 'Rotating obstacle arms and moving platforms.', pos: { x: 0, y: 14.5, z: 175 }, icon: '⚙️' },
            { num: 5, name: 'Stage 5: Vanishing Tiles', desc: 'Disappearing ghost stepping stones and speed boosts.', pos: { x: 0, y: 15.0, z: 232 }, icon: '👻' },
            { num: 6, name: "Stage 6: Winner's Peak", desc: 'The golden champion trophy and mega sky slide!', pos: { x: 0, y: 34.5, z: 290 }, icon: '🏆' },
            { num: 7, name: 'Bonus: Starlight Sky Realm', desc: 'Secret celestial islands in the clouds with rare gems!', pos: { x: 0, y: 72, z: 100 }, icon: '🌌' }
        ];

        this.maxUnlockedStage = parseInt(localStorage.getItem('roblox_max_stage') || '1', 10);
        this.renderStagesModal();
    }

    recordStageUnlock(stageNum) {
        if (stageNum > this.maxUnlockedStage) {
            this.maxUnlockedStage = stageNum;
            localStorage.setItem('roblox_max_stage', stageNum.toString());
            this.renderStagesModal();
        }
    }

    teleportTo(stageNum) {
        const stage = this.stages.find(s => s.num === stageNum);
        if (!stage) return;

        if (stageNum > this.maxUnlockedStage && stageNum !== 0) {
            if (this.sound) this.sound.playOof();
            if (this.ui) this.ui.showToastBanner('🔒 Stage Locked! Reach this stage in the Obby first.');
            return;
        }

        // Apply Teleportation
        this.player.position.set(stage.pos.x, stage.pos.y, stage.pos.z);
        this.player.velocity.set(0, 0, 0);
        this.player.checkpointPos.set(stage.pos.x, stage.pos.y, stage.pos.z);
        this.player.currentStage = stageNum;

        // Visual & Audio Effects
        if (this.particles) {
            this.particles.spawnCoinSparkles(this.player.position);
        }
        if (this.sound) {
            this.sound.playCheckpoint();
        }

        const hudStage = document.getElementById('hud-stage');
        if (hudStage) hudStage.textContent = `${stageNum}/6`;

        if (this.ui) {
            this.ui.showToastBanner(`🌀 Teleported to ${stage.name}!`);
            this.ui.addChatMessage('Teleport', `🌀 Teleported to ${stage.name}!`, '#00FF88');
        }

        this.closeModal();
    }

    renderStagesModal() {
        const grid = document.getElementById('stages-modal-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.stages.forEach(s => {
            const isUnlocked = s.num <= this.maxUnlockedStage || s.num === 0;
            const isCurrent = this.player.currentStage === s.num;

            const card = document.createElement('div');
            card.style.cssText = `
                background: ${isCurrent ? 'rgba(0, 240, 255, 0.15)' : isUnlocked ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)'};
                border: 2px solid ${isCurrent ? '#00F0FF' : isUnlocked ? '#2ECC71' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 10px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
                opacity: ${isUnlocked ? '1' : '0.5'};
                transition: transform 0.15s ease;
            `;

            card.innerHTML = `
                <div style="font-size: 28px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 8px;">
                    ${s.icon}
                </div>
                <div style="flex-grow: 1; text-align: left;">
                    <div style="font-size: 13px; font-weight: bold; color: ${isUnlocked ? '#FFF' : '#777'};">
                        ${s.name} ${isCurrent ? '<span style="color:#00F0FF; font-size:10px;">(CURRENT)</span>' : ''}
                    </div>
                    <div style="font-size: 11px; color: ${isUnlocked ? '#AAA' : '#555'}; margin: 2px 0;">
                        ${s.desc}
                    </div>
                    <div style="font-size: 10px; font-weight: bold; color: ${isUnlocked ? '#2ECC71' : '#E74C3C'};">
                        ${isUnlocked ? '✓ UNLOCKED (CLICK TO WARP)' : '🔒 LOCKED (REACH STAGE FIRST)'}
                    </div>
                </div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.teleportTo(s.num);
                });
            }

            grid.appendChild(card);
        });
    }

    openModal() {
        const modal = document.getElementById('stages-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderStagesModal();
        }
    }

    closeModal() {
        const modal = document.getElementById('stages-modal');
        if (modal) modal.style.display = 'none';
    }
}
