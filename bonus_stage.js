/**
 * Roblox Starlight Sky Islands & Secret Bonus Realm
 * High-altitude celestial playground featuring floating starlight cloud platforms,
 * low-gravity atmospheric zone, rotating nebula rings, and rare amethyst crystals.
 */
class RobloxSkyIslands {
    constructor(scene, world, player, sound, ui, particles) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.sound = sound;
        this.ui = ui;
        this.particles = particles;

        this.crystals = [];
        this.rotatingRings = [];
        this.launchPads = [];
        this.clouds = [];
        this.inLowGravity = false;

        this.buildSkyIslands();
        this.buildSecretLaunchers();
    }

    buildSkyIslands() {
        const islandGroup = new THREE.Group();

        // Starlight cloud material
        const cloudMat = new THREE.MeshLambertMaterial({
            color: 0xE0F7FA,
            transparent: true,
            opacity: 0.92
        });

        const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
        const neonPurpleMat = new THREE.MeshBasicMaterial({ color: 0xBA68C8 });
        const goldMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

        // Cloud Platform 1: Arrival Island
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), cloudMat);
        p1.position.set(0, 70, 100);
        islandGroup.add(p1);
        this.registerCollider(p1.position, 16, 2, 16);

        // Rotating Galaxy Halo Ring
        const ringGeo = new THREE.TorusGeometry(10, 0.4, 8, 32);
        const ringMesh = new THREE.Mesh(ringGeo, neonCyanMat);
        ringMesh.position.set(0, 72, 100);
        ringMesh.rotation.x = Math.PI / 2;
        islandGroup.add(ringMesh);
        this.rotatingRings.push(ringMesh);

        // Stepping Cloud Pillars across the sky
        const stepCoords = [
            { x: 0, y: 73, z: 120, w: 6, d: 6 },
            { x: -8, y: 76, z: 135, w: 5, d: 5 },
            { x: 8, y: 79, z: 150, w: 5, d: 5 },
            { x: 0, y: 82, z: 165, w: 6, d: 6 },
            { x: 0, y: 85, z: 185, w: 14, d: 14 } // Celestial Shrine
        ];

        stepCoords.forEach((c) => {
            const step = new THREE.Mesh(new THREE.BoxGeometry(c.w, 1.5, c.d), cloudMat);
            step.position.set(c.x, c.y, c.z);
            islandGroup.add(step);
            this.registerCollider(step.position, c.w, 1.5, c.d);

            // Add rare floating crystal on top
            const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
            const crystalMesh = new THREE.Mesh(crystalGeo, neonPurpleMat);
            crystalMesh.position.set(c.x, c.y + 2.5, c.z);
            islandGroup.add(crystalMesh);
            this.crystals.push({
                mesh: crystalMesh,
                baseY: c.y + 2.5,
                collected: false,
                pos: new THREE.Vector3(c.x, c.y + 2.5, c.z)
            });
        });

        // Celestial Shrine Arch
        const archL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 1.5), goldMat);
        archL.position.set(-5, 89, 185);
        const archR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 1.5), goldMat);
        archR.position.set(5, 89, 185);
        const archTop = new THREE.Mesh(new THREE.BoxGeometry(12, 1.5, 1.5), goldMat);
        archTop.position.set(0, 93.5, 185);
        islandGroup.add(archL);
        islandGroup.add(archR);
        islandGroup.add(archTop);

        // Return Portal Pad (transports player safely back to main course)
        const portalPad = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16), neonCyanMat);
        portalPad.position.set(0, 85.8, 185);
        islandGroup.add(portalPad);
        this.returnPortal = portalPad;

        this.scene.add(islandGroup);
        this.islandGroup = islandGroup;
    }

    buildSecretLaunchers() {
        // High-power Super Trampolines in main obby that launch to Sky Realm
        const launcherMat = new THREE.MeshLambertMaterial({ color: 0xFF1493 }); // Deep Pink Launchpad

        // Stage 2 secret launcher: x: 12, y: 9, z: 75
        const pad1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 0.8, 16), launcherMat);
        pad1.position.set(10, 8.8, 70);
        this.scene.add(pad1);
        this.launchPads.push({ mesh: pad1, targetPos: new THREE.Vector3(0, 72, 100) });

        // Add visual bouncing arrow above pad
        const coneGeo = new THREE.ConeGeometry(0.8, 1.6, 8);
        const coneMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
        const arrow = new THREE.Mesh(coneGeo, coneMat);
        arrow.position.set(10, 11, 70);
        this.scene.add(arrow);
        this.launchArrow = arrow;
    }

    registerCollider(pos, w, h, d) {
        if (!this.world || !this.world.colliders) return;
        this.world.colliders.push({
            min: new THREE.Vector3(pos.x - w / 2, pos.y - h / 2, pos.z - d / 2),
            max: new THREE.Vector3(pos.x + w / 2, pos.y + h / 2, pos.z + d / 2)
        });
    }

    update(dt) {
        const time = Date.now() * 0.002;

        // Animate rotating galaxy rings
        this.rotatingRings.forEach(r => {
            r.rotation.z += dt * 0.8;
            r.rotation.y += dt * 0.4;
        });

        // Animate floating crystals
        this.crystals.forEach(c => {
            if (c.collected) return;
            c.mesh.rotation.y += dt * 2.5;
            c.mesh.position.y = c.baseY + Math.sin(time * 2 + c.baseY) * 0.35;

            // Check collection by player
            if (this.player && this.player.position) {
                const dist = this.player.position.distanceTo(c.mesh.position);
                if (dist < 2.4) {
                    this.collectCrystal(c);
                }
            }
        });

        // Animate launch arrow
        if (this.launchArrow) {
            this.launchArrow.position.y = 11 + Math.sin(time * 3) * 0.4;
            this.launchArrow.rotation.y += dt * 2;
        }

        // Check if player steps on Secret Launcher
        if (this.player && this.player.position) {
            this.launchPads.forEach(lp => {
                const p = this.player.position;
                const lpPos = lp.mesh.position;
                if (Math.abs(p.x - lpPos.x) < 2.0 && Math.abs(p.z - lpPos.z) < 2.0 && Math.abs(p.y - lpPos.y) < 2.5) {
                    this.launchPlayerToSky(lp.targetPos);
                }
            });

            // Check Return Portal
            if (this.returnPortal) {
                const p = this.player.position;
                const portalPos = this.returnPortal.position;
                if (Math.abs(p.x - portalPos.x) < 2.8 && Math.abs(p.z - portalPos.z) < 2.8 && Math.abs(p.y - portalPos.y) < 2.0) {
                    this.returnPlayerToObby();
                }
            }

            // Low gravity zone simulation when in the sky
            if (this.player.position.y > 60) {
                if (!this.inLowGravity) {
                    this.inLowGravity = true;
                    this.originalGravity = this.player.gravity;
                    this.player.gravity = 16.0; // Floatier jump
                    if (this.ui) this.ui.showToastBanner('🌌 Entered Low-Gravity Starlight Realm!');
                }
            } else {
                if (this.inLowGravity) {
                    this.inLowGravity = false;
                    this.player.gravity = this.originalGravity || 36.0;
                }
            }
        }
    }

    launchPlayerToSky(targetPos) {
        if (!this.player) return;
        this.player.velocity.set(0, 38, 12);
        if (this.sound) {
            this.sound.playBounce();
            if (this.sound.playWindRush) this.sound.playWindRush(1.5);
        }
        if (this.particles && this.particles.spawnCoinSparkles) {
            this.particles.spawnCoinSparkles(this.player.position);
        }
        if (this.ui) {
            this.ui.showToastBanner('🚀 SUPER BOOST! Entering Starlight Sky Realm...');
            this.ui.addChatMessage('Secret', '🌟 You unlocked the secret Sky Islands shortcut!', '#00E5FF');
        }
    }

    returnPlayerToObby() {
        if (!this.player) return;
        // Warp player smoothly to Stage 5
        this.player.position.set(0, 18, 235);
        this.player.velocity.set(0, 0, 0);
        if (this.sound) this.sound.playCheckpoint();
        if (this.particles && this.particles.spawnCoinSparkles) {
            this.particles.spawnCoinSparkles(this.player.position);
        }
        if (this.ui) {
            this.ui.showToastBanner('✨ Safely returned to Stage 5 with bonus studs!');
        }
    }

    collectCrystal(crystal) {
        crystal.collected = true;
        crystal.mesh.visible = false;
        if (this.sound) this.sound.playCoin();
        if (this.particles && this.particles.spawnCoinSparkles) {
            this.particles.spawnCoinSparkles(crystal.mesh.position);
        }
        if (this.player) {
            this.player.coins = (this.player.coins || 0) + 5;
            const coinEl = document.getElementById('hud-coins');
            if (coinEl) coinEl.innerText = this.player.coins;
        }
        if (this.ui) {
            this.ui.showToastBanner('💎 Rare Amethyst Starlight Crystal! (+5 Studs)');
        }
    }
}

window.RobloxSkyIslands = RobloxSkyIslands;
