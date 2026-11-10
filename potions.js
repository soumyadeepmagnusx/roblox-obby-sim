/**
 * Roblox Power-Up Potion & Consumable Shop
 * Grants temporary physical enhancements: Moon Gravity, Hyper Speed,
 * Coin Magnet, and Lava Protection Shield with visual auras and countdown HUD.
 */
class RobloxPotionShop {
    constructor(player, world, scene, sound, ui, particles) {
        this.player = player;
        this.world = world;
        this.scene = scene;
        this.sound = sound;
        this.ui = ui;
        this.particles = particles;

        this.potions = [
            {
                id: 'moon_gravity',
                name: '🌙 Moon Gravity Elixir',
                desc: 'Reduces gravity by 55% for effortless long-distance floaty leaps.',
                cost: 5,
                duration: 30,
                color: '#00E5FF',
                icon: '🌙'
            },
            {
                id: 'hyper_speed',
                name: '⚡ Hyper Sonic Potion',
                desc: 'Increases sprinting velocity by +80% across straightaways.',
                cost: 5,
                duration: 30,
                color: '#FFEA00',
                icon: '⚡'
            },
            {
                id: 'coin_magnet',
                name: '🧲 Stud Attractor Magnet',
                desc: 'Pulls all uncollected coins and starlight crystals directly toward you.',
                cost: 8,
                duration: 45,
                color: '#E040FB',
                icon: '🧲'
            },
            {
                id: 'lava_shield',
                name: '🛡️ Obsidian Lava Shield',
                desc: 'Protects from lethal lava killbricks and environmental hazards.',
                cost: 10,
                duration: 40,
                color: '#FF3D00',
                icon: '🛡️'
            }
        ];

        this.activeBuffs = {};
        this.originalStats = {
            gravity: this.player ? this.player.gravity : 36.0,
            speed: this.player ? this.player.speed : 13.5
        };

        this.initDOM();
        this.initKeyListeners();
    }

    initDOM() {
        // Active Buffs HUD overlay (top right below bar)
        const hud = document.createElement('div');
        hud.id = 'potions-buff-hud';
        hud.style.cssText = `
            position: absolute;
            top: 54px;
            right: 18px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            z-index: 55;
            pointer-events: none;
        `;
        document.body.appendChild(hud);
        this.buffHud = hud;

        // Potion Shop Modal
        const modal = document.createElement('div');
        modal.id = 'potions-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 122;
            align-items: center;
            justify-content: center;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 500px;
            max-width: 92%;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #00D2FF;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            gap: 16px;
            color: #FFFFFF;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                <div style="font-size:20px; font-weight:800; color:#00D2FF; display:flex; align-items:center; gap:8px;">
                    🧪 <span>ALCHEMIST POTION SHOP</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.potions.toggleModal()">✕</span>
            </div>
            <div style="font-size:13px; color:#CCC;">
                Spend collected studs on temporary physical buffs to conquer tough stages and set record speedruns!
            </div>
            <div id="potions-catalog-list" style="display:flex; flex-direction:column; gap:10px;"></div>
            <button class="menu-btn primary" onclick="window.game.potions.toggleModal()" style="width:100%; padding:12px; font-weight:bold; background:#00D2FF; color:#000; border:none; border-radius:8px; cursor:pointer;">
                Close Shop
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;
        this.renderCatalog();
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'y' || e.key === 'Y') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.toggleModal();
            }
        });
    }

    renderCatalog() {
        const list = document.getElementById('potions-catalog-list');
        if (!list) return;

        list.innerHTML = '';
        const playerCoins = this.player ? (this.player.coins || 0) : 0;

        this.potions.forEach(p => {
            const canAfford = playerCoins >= p.cost;
            const isBuffActive = !!this.activeBuffs[p.id];

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid ${isBuffActive ? p.color : 'rgba(255,255,255,0.12)'};
                padding: 12px 16px;
                border-radius: 10px;
            `;

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-size:26px;">${p.icon}</div>
                    <div>
                        <div style="font-weight:bold; font-size:15px; color:${p.color};">${p.name}</div>
                        <div style="font-size:11px; color:#AAA; margin-top:2px;">${p.desc} (${p.duration}s)</div>
                    </div>
                </div>
                <button style="
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: bold;
                    cursor: ${canAfford || playerCoins === 0 ? 'pointer' : 'not-allowed'};
                    background: ${isBuffActive ? '#555' : canAfford ? 'linear-gradient(135deg, #00FF88, #00AA55)' : '#E74C3C'};
                    color: ${isBuffActive ? '#CCC' : '#000'};
                    border: none;
                    white-space: nowrap;
                ">
                    ${isBuffActive ? 'ACTIVE' : `🪙 ${p.cost} Studs`}
                </button>
            `;

            if (!isBuffActive) {
                item.querySelector('button').addEventListener('click', () => {
                    this.buyPotion(p);
                });
            }

            list.appendChild(item);
        });
    }

    buyPotion(potion) {
        if (!this.player) return;

        // Deduct coins if player has them, or allow free trial if starting out
        if ((this.player.coins || 0) >= potion.cost) {
            this.player.coins -= potion.cost;
            const coinEl = document.getElementById('hud-coins');
            if (coinEl) coinEl.innerText = this.player.coins;
        }

        this.applyPotion(potion);
        this.renderCatalog();
        if (this.sound) this.sound.playCoin();
    }

    applyPotion(potion) {
        this.activeBuffs[potion.id] = {
            duration: potion.duration,
            maxDuration: potion.duration,
            color: potion.color,
            name: potion.name,
            icon: potion.icon
        };

        if (potion.id === 'moon_gravity') {
            this.player.gravity = this.originalStats.gravity * 0.45;
        } else if (potion.id === 'hyper_speed') {
            this.player.speed = this.originalStats.speed * 1.8;
        } else if (potion.id === 'lava_shield') {
            this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer || 0, potion.duration);
        }

        if (this.particles && this.particles.spawnCoinSparkles) {
            this.particles.spawnCoinSparkles(this.player.position);
        }

        if (this.ui) {
            this.ui.showToastBanner(`🧪 Drank ${potion.name}! (${potion.duration}s active)`);
            this.ui.addChatMessage('Alchemist', `Active Potion: ${potion.name}`, potion.color);
        }
    }

    update(dt) {
        const buffKeys = Object.keys(this.activeBuffs);
        if (buffKeys.length === 0) {
            if (this.buffHud) this.buffHud.innerHTML = '';
            return;
        }

        // Magnet potion logic: pulls coins and crystals toward player
        if (this.activeBuffs['coin_magnet'] && this.world && this.world.coins) {
            const pPos = this.player.position;
            this.world.coins.forEach(c => {
                if (!c.collected && c.mesh) {
                    const dist = pPos.distanceTo(c.mesh.position);
                    if (dist < 30) {
                        c.mesh.position.lerp(pPos, dt * 6);
                    }
                }
            });
        }

        // Tick durations
        buffKeys.forEach(k => {
            const b = this.activeBuffs[k];
            b.duration -= dt;
            if (b.duration <= 0) {
                // Expired
                this.expireBuff(k);
            }
        });

        this.renderBuffHud();
    }

    expireBuff(id) {
        delete this.activeBuffs[id];

        if (id === 'moon_gravity') {
            this.player.gravity = this.originalStats.gravity;
        } else if (id === 'hyper_speed') {
            this.player.speed = this.originalStats.speed;
        }

        if (this.ui) {
            this.ui.showToastBanner(`⌛ Potion expired.`);
        }
        this.renderCatalog();
    }

    renderBuffHud() {
        if (!this.buffHud) return;
        const keys = Object.keys(this.activeBuffs);
        this.buffHud.innerHTML = keys.map(k => {
            const b = this.activeBuffs[k];
            const pct = Math.max(0, Math.min(100, (b.duration / b.maxDuration) * 100));
            return `
                <div style="background:rgba(15,19,26,0.88); backdrop-filter:blur(6px); border:1px solid ${b.color}; border-radius:8px; padding:6px 12px; width:160px; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                    <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:bold; color:${b.color};">
                        <span>${b.icon} ${b.name.split(' ')[1] || 'Buff'}</span>
                        <span>${Math.ceil(b.duration)}s</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); border-radius:4px; height:4px; margin-top:4px; overflow:hidden;">
                        <div style="background:${b.color}; width:${pct}%; height:100%; transition:width 0.1s linear;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) this.renderCatalog();
    }
}

window.RobloxPotionShop = RobloxPotionShop;
