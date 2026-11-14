/**
 * Roblox Checkpoint FX & 3D Stage Billboard System
 * Adds ascending translucent neon beacon light pillars, rotating halo ground rings,
 * and high-resolution 3D stage billboards with floating Bobbing animations.
 */
class RobloxCheckpointFX {
    constructor(scene, world, player, sound, particles, ui) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.sound = sound;
        this.particles = particles;
        this.ui = ui;

        this.stageNames = {
            0: "🏁 SPAWN ISLAND",
            1: "⚡ STAGE 1: NEON JUMPS",
            2: "🔥 STAGE 2: LAVA LABYRINTH",
            3: "🪩 STAGE 3: DISCO DISKS",
            4: "🧩 STAGE 4: TRICKY TILES",
            5: "🌧️ STAGE 5: ACID RAIN",
            6: "👑 STAGE 6: SUMMIT OF VICTORY"
        };

        this.pillars = [];
        this.billboards = [];
        this.lastActivatedStage = -1;
        this.time = 0;

        if (typeof THREE !== 'undefined' && this.scene && this.world) {
            this.initFX();
        }
    }

    createStageTexture(text) {
        if (typeof document === 'undefined') return null;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Gradient Background Badge
        const grad = ctx.createLinearGradient(0, 0, 512, 128);
        grad.addColorStop(0, 'rgba(10, 15, 25, 0.92)');
        grad.addColorStop(1, 'rgba(20, 30, 48, 0.92)');
        ctx.fillStyle = grad;

        // Rounded badge
        const r = 24;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(512 - r, 0);
        ctx.quadraticCurveTo(512, 0, 512, r);
        ctx.lineTo(512, 128 - r);
        ctx.quadraticCurveTo(512, 128, 512 - r, 128);
        ctx.lineTo(r, 128);
        ctx.quadraticCurveTo(0, 128, 0, 128 - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();

        // Neon border
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 12;
        ctx.fillText(text, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        return tex;
    }

    initFX() {
        if (!this.world || !Array.isArray(this.world.checkpoints)) return;

        this.world.checkpoints.forEach(cp => {
            if (!cp.pos) return;

            const group = new THREE.Group();
            group.position.copy(cp.pos);

            // Vertical Ascending Light Pillar Cylinder
            const pillarHeight = 32;
            const pillarGeom = new THREE.CylinderGeometry(1.4, 1.8, pillarHeight, 16, 1, true);
            const pillarMat = new THREE.MeshBasicMaterial({
                color: cp.stage === 0 ? 0x00FF88 : 0x00F0FF,
                transparent: true,
                opacity: 0.22,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.y = pillarHeight / 2;
            group.add(pillar);

            // Rotating Ground Ring
            const ringGeom = new THREE.RingGeometry(2.2, 2.7, 24);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00FF88,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.55,
                depthWrite: false
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.08;
            group.add(ring);

            // 3D Overhead Floating Stage Billboard
            const name = this.stageNames[cp.stage] || `STAGE ${cp.stage}`;
            const tex = this.createStageTexture(name);
            let sprite = null;
            if (tex) {
                const sprMat = new THREE.SpriteMaterial({
                    map: tex,
                    transparent: true,
                    opacity: 0.95
                });
                sprite = new THREE.Sprite(sprMat);
                sprite.position.y = 6.2;
                sprite.scale.set(7.5, 1.875, 1);
                group.add(sprite);
            }

            this.scene.add(group);
            this.pillars.push({
                stage: cp.stage,
                group,
                pillar,
                ring,
                sprite,
                baseY: cp.pos.y,
                pulseTimer: 0
            });
        });
    }

    triggerActivation(stageNum) {
        const item = this.pillars.find(p => p.stage === stageNum);
        if (!item) return;

        item.pulseTimer = 2.5;
        if (item.pillar) {
            item.pillar.material.color.setHex(0xFFD700);
            item.pillar.material.opacity = 0.65;
        }
        if (item.ring) {
            item.ring.material.color.setHex(0xFFD700);
        }

        const name = this.stageNames[stageNum] || `STAGE ${stageNum}`;
        if (this.ui && this.ui.showToastBanner) {
            this.ui.showToastBanner(`✨ CHECKPOINT SAVED: ${name}!`);
        }
        if (this.sound && this.sound.playCheckpoint) {
            this.sound.playCheckpoint();
        }
        if (this.particles && this.particles.spawnSparkles && this.player) {
            this.particles.spawnSparkles(this.player.position, 25);
        }
    }

    update(dt) {
        this.time += dt;

        // Check if player stage unlocked
        if (this.player && this.player.currentStage !== undefined) {
            if (this.player.currentStage !== this.lastActivatedStage) {
                if (this.lastActivatedStage !== -1) {
                    this.triggerActivation(this.player.currentStage);
                }
                this.lastActivatedStage = this.player.currentStage;
            }
        }

        for (const item of this.pillars) {
            // Animate Ground Ring Rotation
            if (item.ring) {
                item.ring.rotation.z += dt * 1.5;
            }

            // Animate Light Pillar Pulse
            if (item.pillar) {
                if (item.pulseTimer > 0) {
                    item.pulseTimer -= dt;
                    const scalePulse = 1.0 + Math.sin(item.pulseTimer * 8.0) * 0.3;
                    item.pillar.scale.set(scalePulse, 1.0, scalePulse);
                    if (item.pulseTimer <= 0) {
                        item.pillar.material.color.setHex(0x00FF88);
                        item.pillar.material.opacity = 0.22;
                        item.pillar.scale.set(1, 1, 1);
                    }
                } else {
                    // Idle breathing pulse
                    const breath = 0.18 + Math.sin(this.time * 2.0 + item.stage) * 0.06;
                    item.pillar.material.opacity = breath;
                }
            }

            // Animate Floating Billboard Bobbing
            if (item.sprite) {
                item.sprite.position.y = 6.2 + Math.sin(this.time * 1.8 + item.stage) * 0.3;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxCheckpointFX = RobloxCheckpointFX;
}
