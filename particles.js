/**
 * Roblox Particle & Visual Effects Engine
 * Manages 3D particle emitters for:
 * - Jump dust puffs
 * - Jetpack flames & smoke
 * - Hoverboard neon ground trails
 * - Coin pickup sparkles
 * - Sword slash trails
 * - Rocket explosion blasts
 * - 3D Floating Combat Damage Numbers
 * - Victory confetti bursts
 */
class RobloxParticleEngine {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.floatingTexts = [];
    }

    /**
     * Spawn dust puff at ground position
     */
    spawnJumpDust(pos) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xDDDDDD,
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 1.2,
                pos.y + 0.1,
                pos.z + (Math.random() - 0.5) * 1.2
            );
            this.scene.add(mesh);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2.0;
            this.particles.push({
                mesh,
                vx: Math.cos(angle) * speed,
                vy: 0.5 + Math.random() * 1.5,
                vz: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 0.4 + Math.random() * 0.3,
                scaleSpeed: -1.2,
                fadeSpeed: 2.0
            });
        }
    }

    /**
     * Spawn Jetpack rocket flames and smoke
     */
    spawnJetpackExhaust(leftPos, rightPos) {
        const positions = [leftPos, rightPos];
        positions.forEach(pos => {
            if (!pos) return;
            // Flame particle
            const flameGeom = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            const isYellow = Math.random() > 0.4;
            const flameMat = new THREE.MeshBasicMaterial({
                color: isYellow ? 0xFFCC00 : 0xFF3300,
                transparent: true,
                opacity: 0.9
            });
            const flameMesh = new THREE.Mesh(flameGeom, flameMat);
            flameMesh.position.copy(pos);
            this.scene.add(flameMesh);

            this.particles.push({
                mesh: flameMesh,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -6.0 - Math.random() * 4.0,
                vz: (Math.random() - 0.5) * 0.8,
                life: 1.0,
                maxLife: 0.25,
                scaleSpeed: -1.5,
                fadeSpeed: 3.5
            });

            // Smoke particle
            if (Math.random() > 0.6) {
                const smokeGeom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
                const smokeMat = new THREE.MeshBasicMaterial({
                    color: 0x555555,
                    transparent: true,
                    opacity: 0.6
                });
                const smokeMesh = new THREE.Mesh(smokeGeom, smokeMat);
                smokeMesh.position.copy(pos);
                this.scene.add(smokeMesh);

                this.particles.push({
                    mesh: smokeMesh,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: -2.0 - Math.random() * 2.0,
                    vz: (Math.random() - 0.5) * 1.2,
                    life: 1.0,
                    maxLife: 0.6,
                    scaleSpeed: 1.5,
                    fadeSpeed: 1.5
                });
            }
        });
    }

    /**
     * Spawn glowing Hoverboard ground trail
     */
    spawnHoverTrail(pos, colorHex = 0x00FFFF) {
        const geom = new THREE.BoxGeometry(0.4, 0.1, 0.8);
        const mat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.85
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(pos.x, pos.y + 0.1, pos.z);
        this.scene.add(mesh);

        this.particles.push({
            mesh,
            vx: 0,
            vy: 0,
            vz: 0,
            life: 1.0,
            maxLife: 0.5,
            scaleSpeed: -1.0,
            fadeSpeed: 2.0
        });
    }

    /**
     * Spawn Coin sparkle burst
     */
    spawnCoinSparkles(pos) {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const geom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.3 ? 0xFFD700 : 0xFFFFFF,
                transparent: true,
                opacity: 1.0
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.copy(pos);
            this.scene.add(mesh);

            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            const speed = 3.0 + Math.random() * 3.5;

            this.particles.push({
                mesh,
                vx: Math.cos(theta) * Math.cos(phi) * speed,
                vy: Math.sin(phi) * speed + 2.0,
                vz: Math.sin(theta) * Math.cos(phi) * speed,
                life: 1.0,
                maxLife: 0.6 + Math.random() * 0.4,
                scaleSpeed: -0.8,
                fadeSpeed: 1.8
            });
        }
    }

    /**
     * Explosive rocket blast
     */
    spawnExplosion(pos) {
        // Core fireball
        const count = 30;
        for (let i = 0; i < count; i++) {
            const size = 0.4 + Math.random() * 0.6;
            const geom = new THREE.BoxGeometry(size, size, size);
            const colors = [0xFF2200, 0xFF7700, 0xFFDD00, 0x333333];
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 0.95
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.copy(pos);
            this.scene.add(mesh);

            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            const speed = 6.0 + Math.random() * 8.0;

            this.particles.push({
                mesh,
                vx: Math.cos(theta) * Math.cos(phi) * speed,
                vy: Math.sin(phi) * speed + 3.0,
                vz: Math.sin(theta) * Math.cos(phi) * speed,
                life: 1.0,
                maxLife: 0.7 + Math.random() * 0.5,
                scaleSpeed: -0.5,
                fadeSpeed: 1.6
            });
        }
    }

    /**
     * Confetti celebration burst
     */
    spawnConfetti(pos) {
        const colors = [0xFF0055, 0x00FF88, 0x0099FF, 0xFFEE00, 0xAA00FF, 0xFF8800];
        for (let i = 0; i < 60; i++) {
            const geom = new THREE.BoxGeometry(0.3, 0.05, 0.3);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 4,
                pos.y + 2 + Math.random() * 3,
                pos.z + (Math.random() - 0.5) * 4
            );
            this.scene.add(mesh);

            this.particles.push({
                mesh,
                vx: (Math.random() - 0.5) * 8.0,
                vy: 5.0 + Math.random() * 8.0,
                vz: (Math.random() - 0.5) * 8.0,
                rotVx: (Math.random() - 0.5) * 10,
                rotVy: (Math.random() - 0.5) * 10,
                life: 1.0,
                maxLife: 2.5 + Math.random() * 1.5,
                scaleSpeed: 0,
                fadeSpeed: 0.4
            });
        }
    }

    /**
     * 3D Floating Combat Text (-25, CRIT -50!) using 2D canvas sprite
     */
    spawnFloatingText(pos, text, isCrit = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.font = isCrit ? 'bold 50px Arial' : 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text stroke
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(text, 128, 64);

        // Text fill
        ctx.fillStyle = isCrit ? '#FFD700' : '#FF3333';
        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
            depthTest: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        const scale = isCrit ? 2.8 : 2.2;
        sprite.scale.set(scale, scale * 0.5, 1);
        sprite.position.set(
            pos.x + (Math.random() - 0.5) * 0.5,
            pos.y + 2.5,
            pos.z + (Math.random() - 0.5) * 0.5
        );
        this.scene.add(sprite);

        this.floatingTexts.push({
            sprite,
            vy: 2.2,
            life: 1.0,
            maxLife: 1.0
        });
    }

    /**
     * Update all active particles and floating combat texts
     */
    update(dt) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt / p.maxLife;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;

            // Gravity on particles
            p.vy -= 9.8 * dt * 0.6;

            if (p.rotVx) p.mesh.rotation.x += p.rotVx * dt;
            if (p.rotVy) p.mesh.rotation.y += p.rotVy * dt;

            if (p.scaleSpeed !== 0) {
                const s = Math.max(0.01, p.mesh.scale.x + p.scaleSpeed * dt);
                p.mesh.scale.set(s, s, s);
            }

            if (p.mesh.material && p.mesh.material.transparent) {
                p.mesh.material.opacity = Math.max(0, p.life);
            }
        }

        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt / ft.maxLife;

            if (ft.life <= 0) {
                this.scene.remove(ft.sprite);
                if (ft.sprite.material.map) ft.sprite.material.map.dispose();
                ft.sprite.material.dispose();
                this.floatingTexts.splice(i, 1);
                continue;
            }

            ft.sprite.position.y += ft.vy * dt;
            ft.sprite.material.opacity = Math.max(0, ft.life);
            ft.sprite.scale.multiplyScalar(1.0 + dt * 0.2);
        }
    }
}
