/**
 * Roblox Collectibles & Economy System
 * Manages 40+ animated 3D Gold Coins across all Obby stages, Sky Slide, and Floating Islands
 * Features persistent coin balance, pet multiplier, sparkle bursts, and audio chime
 */
class RobloxCollectibles {
    constructor(scene, player, particleEngine, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.particleEngine = particleEngine;
        this.sound = sound;
        this.ui = ui;

        this.coins = parseInt(localStorage.getItem('roblox_coins') || '100', 10);
        this.coinMeshes = [];
        this.relics = [];
        this.collectedRelics = JSON.parse(localStorage.getItem('roblox_collected_relics') || '[]');
        this.bobTime = 0;

        this.initCoins();
        this.initRelics();
        this.updateUi();
    }

    initCoins() {
        // Shared geometry and materials
        const coinGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
        coinGeom.rotateX(Math.PI / 2); // face forward

        const coinMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });

        // 40+ Coin Coordinates across Obby Stages, Slide, and Islands
        const locations = [
            // Stage 1 (Floating Stepping Stones)
            { x: 0, y: 1.5, z: 2 },
            { x: 2, y: 2.0, z: -6 },
            { x: -2, y: 2.5, z: -14 },
            { x: 2, y: 3.0, z: -22 },
            { x: 0, y: 3.5, z: -30 },

            // Stage 2 (Lava Jumpers)
            { x: -3, y: 2.5, z: -45 },
            { x: 3, y: 3.0, z: -55 },
            { x: -3, y: 3.5, z: -65 },
            { x: 0, y: 4.0, z: -75 },

            // Stage 3 (Laser Grid)
            { x: 0, y: 3.0, z: -92 },
            { x: 2, y: 3.0, z: -105 },
            { x: -2, y: 3.0, z: -118 },
            { x: 0, y: 3.5, z: -130 },

            // Stage 4 (Rotating Spinning Beams)
            { x: 0, y: 4.5, z: -150 },
            { x: 3, y: 5.0, z: -165 },
            { x: -3, y: 5.5, z: -180 },
            { x: 0, y: 6.0, z: -195 },

            // Stage 5 (Disappearing Vanishing Tiles)
            { x: -2, y: 5.0, z: -215 },
            { x: 2, y: 5.5, z: -230 },
            { x: 0, y: 6.0, z: -245 },
            { x: -2, y: 6.5, z: -260 },

            // Stage 6 (Mega Sky Slide Downrush)
            { x: 0, y: 28, z: -290 },
            { x: 0, y: 22, z: -320 },
            { x: 0, y: 16, z: -350 },
            { x: 0, y: 10, z: -380 },
            { x: 0, y: 4, z: -410 },

            // Zero-G Purple Cosmic Zone
            { x: -10, y: 25, z: -180 },
            { x: 10, y: 32, z: -180 },
            { x: 0, y: 38, z: -180 },
            { x: -8, y: 45, z: -180 },

            // Floating Island 1: Celestial Isle (x: 45, y: 45, z: -70)
            { x: 45, y: 47, z: -70 },
            { x: 48, y: 48, z: -66 },
            { x: 42, y: 48, z: -74 },

            // Floating Island 2: Astral Peak (x: -50, y: 65, z: -140)
            { x: -50, y: 67, z: -140 },
            { x: -46, y: 68, z: -136 },
            { x: -54, y: 68, z: -144 },

            // Floating Island 3: Sky Sanctum (x: 0, y: 90, z: -220)
            { x: 0, y: 93, z: -220 },
            { x: 5, y: 94, z: -215 },
            { x: -5, y: 94, z: -225 },
            { x: 0, y: 95, z: -210 }
        ];

        locations.forEach((loc, idx) => {
            const mesh = new THREE.Mesh(coinGeom, coinMat);
            mesh.position.set(loc.x, loc.y, loc.z);
            mesh.castShadow = true;

            this.scene.add(mesh);
            this.coinMeshes.push({
                mesh,
                baseY: loc.y,
                active: true,
                respawnTime: 0,
                id: idx
            });
        });
    }

    initRelics() {
        if (typeof THREE === 'undefined' || !this.scene) return;

        const relicSpots = [
            { id: 'relic_fire', name: '🔥 Relic of Fire', x: 12, y: 8, z: 125, color: 0xFF2200 },
            { id: 'relic_storms', name: '⚡ Relic of Storms', x: -14, y: 16, z: 235, color: 0x00F0FF },
            { id: 'relic_starlight', name: '⭐ Relic of Starlight', x: 0, y: 44, z: 368, color: 0xFFD700 },
            { id: 'relic_void', name: '🌋 Relic of the Caldera', x: -15, y: 64, z: 574, color: 0xFF4500 },
            { id: 'relic_titans', name: '👑 Relic of the Titans', x: 0, y: 92, z: 686, color: 0x9933FF },
            { id: 'relic_antimatter', name: '🌌 Relic of Anti-Matter', x: 8, y: 112, z: 804, color: 0x00FFCC }
        ];

        const relicGeo = new THREE.OctahedronGeometry(0.85, 0);

        relicSpots.forEach(s => {
            const isAlreadyCollected = this.collectedRelics.includes(s.id);
            const mat = new THREE.MeshStandardMaterial({
                color: s.color,
                emissive: s.color,
                emissiveIntensity: 0.85,
                roughness: 0.15
            });
            const mesh = new THREE.Mesh(relicGeo, mat);
            mesh.position.set(s.x, s.y, s.z);
            mesh.visible = !isAlreadyCollected;
            this.scene.add(mesh);

            this.relics.push({
                ...s,
                mesh,
                baseY: s.y,
                collected: isAlreadyCollected
            });
        });
    }

    addCoins(amount) {
        this.coins = Math.max(0, this.coins + amount);
        localStorage.setItem('roblox_coins', this.coins.toString());
        this.updateUi();

        if (typeof window !== 'undefined' && window.game && window.game.vfxOverlay) {
            window.game.vfxOverlay.triggerReward();
        }

        if (this.coins >= 150 && window.game && window.game.achievements) {
            window.game.achievements.unlock('coin_hoarder');
        }
    }

    updateUi() {
        const coinDisplay = document.getElementById('stat-coins');
        if (coinDisplay) {
            coinDisplay.textContent = this.coins;
        }
    }

    update(dt) {
        this.bobTime += dt * 3.0;

        const playerPos = this.player.position;
        const pMulti = this.player.petCoinMulti || 1.0;

        for (let i = 0; i < this.coinMeshes.length; i++) {
            const c = this.coinMeshes[i];

            // Respawn timer
            if (!c.active) {
                c.respawnTime -= dt;
                if (c.respawnTime <= 0) {
                    c.active = true;
                    c.mesh.visible = true;
                }
                continue;
            }

            // Spin & Bob
            c.mesh.rotation.z += dt * 3.5;
            c.mesh.position.y = c.baseY + Math.sin(this.bobTime + c.id) * 0.35;

            // Collision check with player
            const dx = playerPos.x - c.mesh.position.x;
            const dy = (playerPos.y + 0.8) - c.mesh.position.y;
            const dz = playerPos.z - c.mesh.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < 4.0) { // Within 2 studs
                c.active = false;
                c.mesh.visible = false;
                c.respawnTime = 45; // Respawns after 45 seconds

                const gain = Math.round(1 * pMulti);
                this.addCoins(gain);

                // Audio & visual FX
                this.sound.playCoin();
                this.particleEngine.spawnCoinSparkles(c.mesh.position);
                this.particleEngine.spawnFloatingText(c.mesh.position, `+${gain} Gold`, false);
            }
        }

        // Update Relics
        for (let i = 0; i < this.relics.length; i++) {
            const r = this.relics[i];
            if (r.collected) continue;

            r.mesh.rotation.x += dt * 1.5;
            r.mesh.rotation.y += dt * 2.0;
            r.mesh.position.y = r.baseY + Math.sin(this.bobTime * 2.5) * 0.35;

            const dx = playerPos.x - r.mesh.position.x;
            const dy = (playerPos.y + 0.8) - r.mesh.position.y;
            const dz = playerPos.z - r.mesh.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < 5.0) {
                r.collected = true;
                r.mesh.visible = false;
                this.collectedRelics.push(r.id);
                try {
                    localStorage.setItem('roblox_collected_relics', JSON.stringify(this.collectedRelics));
                } catch (e) {}

                this.addCoins(50);
                if (this.sound) this.sound.playWin();
                if (this.particleEngine) {
                    this.particleEngine.spawnConfetti(r.mesh.position);
                    this.particleEngine.spawnFloatingText(r.mesh.position, `+50 Studs! ${r.name}`, true);
                }
                if (this.ui) {
                    this.ui.showToastBanner(`🏺 ANCIENT RELIC DISCOVERED: ${r.name}! (+50 Studs)`);
                    this.ui.addChatMessage('Relic', `🏺 Discovered ancient secret: ${r.name}! (+50 Gold Studs)`, '#FFD700');
                }
                if (typeof window !== 'undefined' && window.game && window.game.levelSystem) {
                    window.game.levelSystem.addXP(100, 'Relic Discovered');
                }
            }
        }
    }
}
