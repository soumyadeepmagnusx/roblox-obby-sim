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
        this.bobTime = 0;

        this.initCoins();
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

    addCoins(amount) {
        this.coins = Math.max(0, this.coins + amount);
        localStorage.setItem('roblox_coins', this.coins.toString());
        this.updateUi();
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
    }
}
