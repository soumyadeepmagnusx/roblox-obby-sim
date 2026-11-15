/**
 * Roblox Interactive Physics Trampolines & Super Booster Launchers
 * Adds spring-loaded super trampolines and directional booster launch pads
 * with compression animations, radial shockwaves, and high-flying impulse physics.
 */
class RobloxLaunchers {
    constructor(scene, world, player, sound, particles) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.sound = sound;
        this.particles = particles;

        this.launchers = [];
        this.cooldowns = new Map();

        if (typeof THREE !== 'undefined' && this.scene) {
            this.initLaunchers();
        }
    }

    initLaunchers() {
        // 1. Spawn Island Super Spring Trampoline
        this.createTrampoline(8, 0.5, 8, 28, 0x00FF88);

        // 2. Stage 2 High Chasm Launcher
        this.createTrampoline(0, 3.5, -95, 30, 0xFF0055);

        // 3. Stage 4 Long-Gap Super Booster
        this.createDirectionalBooster(12, 10.5, -210, new THREE.Vector3(0, 22, -18), 0x00F0FF);
    }

    createTrampoline(x, y, z, bouncePower, colorHex) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Circular Rim Base
        const rimGeom = new THREE.CylinderGeometry(2.4, 2.6, 0.4, 20);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x22252A,
            roughness: 0.4,
            metalness: 0.8
        });
        const rim = new THREE.Mesh(rimGeom, rimMat);
        group.add(rim);

        // Coiled Spring Pillar
        const springGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12);
        const springMat = new THREE.MeshStandardMaterial({
            color: 0xFFDE00,
            metalness: 0.9,
            roughness: 0.2
        });
        const spring = new THREE.Mesh(springGeom, springMat);
        spring.position.y = 0.6;
        group.add(spring);

        // Glowing Bouncy Pad
        const padGeom = new THREE.CylinderGeometry(2.1, 2.1, 0.3, 20);
        const padMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.9
        });
        const pad = new THREE.Mesh(padGeom, padMat);
        pad.position.y = 1.35;
        group.add(pad);

        // Pulsing Chevron Target Decal
        const chevronGeom = new THREE.RingGeometry(0.8, 1.3, 16);
        const chevronMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75
        });
        const chevron = new THREE.Mesh(chevronGeom, chevronMat);
        chevron.rotation.x = -Math.PI / 2;
        chevron.position.y = 1.52;
        group.add(chevron);

        this.scene.add(group);

        this.launchers.push({
            type: 'trampoline',
            group,
            pad,
            spring,
            chevron,
            basePadY: 1.35,
            pos: new THREE.Vector3(x, y, z),
            radius: 2.4,
            bouncePower,
            compressTimer: 0
        });
    }

    createDirectionalBooster(x, y, z, impulseVec, colorHex) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Angled launch platform
        const baseGeom = new THREE.BoxGeometry(4.0, 0.6, 4.0);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1A1D24,
            metalness: 0.7,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.rotation.x = 0.25;
        group.add(base);

        // Glowing Chevron Arrows
        const padGeom = new THREE.BoxGeometry(3.6, 0.2, 3.6);
        const padMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.85
        });
        const pad = new THREE.Mesh(padGeom, padMat);
        pad.position.y = 0.35;
        pad.rotation.x = 0.25;
        group.add(pad);

        this.scene.add(group);

        this.launchers.push({
            type: 'booster',
            group,
            pad,
            pos: new THREE.Vector3(x, y, z),
            radius: 2.5,
            impulse: impulseVec,
            compressTimer: 0
        });
    }

    update(dt) {
        if (!this.player || !this.player.position || typeof THREE === 'undefined') return;

        const playerPos = this.player.position;

        for (let i = 0; i < this.launchers.length; i++) {
            const l = this.launchers[i];
            const dx = playerPos.x - l.pos.x;
            const dz = playerPos.z - l.pos.z;
            const dist = Math.hypot(dx, dz);
            const dy = playerPos.y - l.pos.y;

            // Check collision when player steps on launcher
            if (dist < l.radius && dy >= -0.5 && dy <= 2.2) {
                const cooldown = this.cooldowns.get(i) || 0;
                if (cooldown <= 0) {
                    this.cooldowns.set(i, 0.7);
                    l.compressTimer = 0.35;

                    if (l.type === 'trampoline') {
                        // High vertical launch
                        if (this.player.velocity) {
                            this.player.velocity.y = l.bouncePower;
                            this.player.isGrounded = false;
                        }
                        if (this.sound && this.sound.playBounce) {
                            this.sound.playBounce();
                        }
                    } else if (l.type === 'booster') {
                        // Directional high-speed launch
                        if (this.player.velocity) {
                            this.player.velocity.x = l.impulse.x;
                            this.player.velocity.y = l.impulse.y;
                            this.player.velocity.z = l.impulse.z;
                            this.player.isGrounded = false;
                        }
                        if (this.sound) {
                            if (this.sound.playBoost) this.sound.playBoost();
                            if (this.sound.playWindRush) this.sound.playWindRush(1.6);
                        }
                    }

                    // Visual shockwave particles
                    if (this.particles && this.particles.spawnLandingShockwave) {
                        this.particles.spawnLandingShockwave(l.pos);
                    }
                    if (this.particles && this.particles.spawnJumpDust) {
                        this.particles.spawnJumpDust(playerPos);
                    }
                    if (window.game && window.game.ui && window.game.ui.showToastBanner) {
                        window.game.ui.showToastBanner('🚀 SUPER LAUNCH!');
                    }
                }
            }

            // Animate compression rebound
            if (l.compressTimer > 0) {
                l.compressTimer -= dt;
                const ratio = Math.max(0, l.compressTimer / 0.35);
                const squish = Math.sin(ratio * Math.PI) * 0.45;
                if (l.pad && l.basePadY) {
                    l.pad.position.y = l.basePadY - squish;
                }
                if (l.spring) {
                    l.spring.scale.y = 1.0 - squish * 0.6;
                }
            } else if (l.pad && l.basePadY) {
                l.pad.position.y = l.basePadY;
                if (l.spring) l.spring.scale.y = 1.0;
            }

            // Rotate target chevron on trampolines
            if (l.chevron) {
                l.chevron.rotation.z += dt * 2.0;
            }
        }

        // Decrement cooldowns
        for (const [idx, cd] of this.cooldowns.entries()) {
            if (cd > 0) {
                this.cooldowns.set(idx, Math.max(0, cd - dt));
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxLaunchers = RobloxLaunchers;
}
