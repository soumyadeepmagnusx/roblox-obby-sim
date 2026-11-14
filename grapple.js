/**
 * Roblox Grappling Hook & Zip-Line Physics Gear
 * Fires a high-tension neon cable to pull the player across wide gaps to distant platforms.
 * Hotkey [H] or HUD Button.
 */
class RobloxGrappleHook {
    constructor(scene, player, world, sound, particles, ui) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.sound = sound;
        this.particles = particles;
        this.ui = ui;

        this.cooldown = 3.0; // seconds
        this.cooldownTimer = 0;
        this.isGrappling = false;
        this.grappleDuration = 0;
        this.maxGrappleTime = 1.8;
        this.maxDistance = 65;
        this.pullSpeed = 36;

        this.targetPoint = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;
        this.cableLine = null;
        this.anchorMarker = null;

        if (typeof THREE !== 'undefined' && this.scene) {
            this.initVisuals();
        }

        this.bindEvents();
    }

    initVisuals() {
        // Neon tension cable
        const cableGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        const cableMat = new THREE.LineBasicMaterial({
            color: 0x00F0FF,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
        });
        this.cableLine = new THREE.Line(cableGeom, cableMat);
        this.cableLine.visible = false;
        this.scene.add(this.cableLine);

        // Holographic anchor landing reticle
        const reticleGeom = new THREE.RingGeometry(0.6, 0.9, 16);
        const reticleMat = new THREE.MeshBasicMaterial({
            color: 0x00FF88,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75
        });
        this.anchorMarker = new THREE.Mesh(reticleGeom, reticleMat);
        this.anchorMarker.rotation.x = -Math.PI / 2;
        this.anchorMarker.visible = false;
        this.scene.add(this.anchorMarker);
    }

    bindEvents() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused && this.ui.isChatFocused()) return;
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (e.code === 'KeyH') {
                this.activate();
            }
        });
    }

    findTarget() {
        if (!this.player || !this.player.position || typeof THREE === 'undefined') return null;

        const playerPos = this.player.position.clone();
        // Determine player forward facing direction
        const yaw = (this.player.mesh && this.player.mesh.rotation) ? this.player.mesh.rotation.y : 0;
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();

        let bestTarget = null;
        let bestScore = -Infinity;

        // Collect candidate platforms from world
        const candidates = [];
        if (this.world) {
            if (Array.isArray(this.world.checkpoints)) {
                this.world.checkpoints.forEach(cp => {
                    if (cp.position) candidates.push(cp.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
                });
            }
            if (Array.isArray(this.world.platforms)) {
                this.world.platforms.forEach(p => {
                    if (p.position) candidates.push(p.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
                });
            }
            if (Array.isArray(this.world.stages)) {
                this.world.stages.forEach(stg => {
                    if (stg.position) candidates.push(stg.position.clone().add(new THREE.Vector3(0, 2.0, 0)));
                });
            }
        }

        // Search candidates ahead of player
        for (const pt of candidates) {
            const dist = playerPos.distanceTo(pt);
            if (dist < 6 || dist > this.maxDistance) continue;

            const dirToTarget = pt.clone().sub(playerPos).normalize();
            const dot = forward.dot(dirToTarget);
            // Must be roughly in front of player (dot > 0.2) or slightly elevated
            if (dot > 0.25 || (pt.y > playerPos.y + 2 && dist < 35)) {
                const heightBonus = Math.max(0, pt.y - playerPos.y) * 0.4;
                const score = (dot * 2.0) - (dist / this.maxDistance) + heightBonus;
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = pt;
                }
            }
        }

        // Fallback: If no candidate platform directly in front, project forward anchor
        if (!bestTarget) {
            const fallbackDist = 28;
            bestTarget = playerPos.clone().add(forward.clone().multiplyScalar(fallbackDist)).add(new THREE.Vector3(0, 6, 0));
        }

        return bestTarget;
    }

    activate() {
        if (this.cooldownTimer > 0) {
            if (this.ui && this.ui.showToastBanner) {
                this.ui.showToastBanner(`⏳ Grapple cooling down: ${this.cooldownTimer.toFixed(1)}s`);
            }
            return;
        }

        if (this.isGrappling) {
            this.release();
            return;
        }

        const target = this.findTarget();
        if (!target) {
            if (this.ui && this.ui.showToastBanner) {
                this.ui.showToastBanner('⚠️ No grapple anchor in range! Aim toward a platform.');
            }
            return;
        }

        this.targetPoint.copy(target);
        this.isGrappling = true;
        this.grappleDuration = 0;
        this.cooldownTimer = this.cooldown;

        if (this.cableLine) this.cableLine.visible = true;
        if (this.anchorMarker) {
            this.anchorMarker.position.copy(target);
            this.anchorMarker.position.y += 0.05;
            this.anchorMarker.visible = true;
        }

        if (this.sound) {
            if (this.sound.playWindRush) this.sound.playWindRush(1.4);
            if (this.sound.playBoost) this.sound.playBoost();
        }

        if (this.particles && this.particles.spawnJumpPuff) {
            this.particles.spawnJumpPuff(this.player.position);
            this.particles.spawnJumpPuff(target);
        }

        if (this.ui && this.ui.showToastBanner) {
            this.ui.showToastBanner('🪝 Grappling Hook Fired!');
        }

        this.updateHUDButton();
    }

    release() {
        if (!this.isGrappling) return;

        this.isGrappling = false;
        if (this.cableLine) this.cableLine.visible = false;
        if (this.anchorMarker) this.anchorMarker.visible = false;

        // Give player a clean forward-upward vault boost upon release
        if (this.player && this.player.velocity && typeof THREE !== 'undefined') {
            const dir = this.targetPoint.clone().sub(this.player.position).normalize();
            this.player.velocity.x = dir.x * 12;
            this.player.velocity.z = dir.z * 12;
            this.player.velocity.y = Math.max(14, this.player.velocity.y + 10);
        }

        if (this.sound && this.sound.playBounce) {
            this.sound.playBounce();
        }
        if (this.particles && this.particles.spawnJumpPuff) {
            this.particles.spawnJumpPuff(this.player.position);
        }
    }

    update(dt) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
            this.updateHUDButton();
        }

        if (!this.isGrappling) return;

        this.grappleDuration += dt;
        if (this.grappleDuration >= this.maxGrappleTime) {
            this.release();
            return;
        }

        const playerPos = this.player.position;
        const dist = playerPos.distanceTo(this.targetPoint);

        // Close enough to anchor: detach automatically
        if (dist <= 3.2) {
            this.release();
            return;
        }

        // Pull player toward anchor
        const pullDir = this.targetPoint.clone().sub(playerPos).normalize();
        const pullStep = this.pullSpeed * dt;

        if (this.player.velocity) {
            this.player.velocity.x = pullDir.x * this.pullSpeed * 0.75;
            this.player.velocity.y = pullDir.y * this.pullSpeed * 0.75 + 3.0; // Counteract gravity
            this.player.velocity.z = pullDir.z * this.pullSpeed * 0.75;
        }
        playerPos.add(pullDir.multiplyScalar(pullStep));

        // Update 3D tension cable positions
        if (this.cableLine && typeof THREE !== 'undefined') {
            const handPos = playerPos.clone().add(new THREE.Vector3(0.5, 1.8, 0));
            const positions = this.cableLine.geometry.attributes.position;
            if (positions) {
                positions.setXYZ(0, handPos.x, handPos.y, handPos.z);
                positions.setXYZ(1, this.targetPoint.x, this.targetPoint.y, this.targetPoint.z);
                positions.needsUpdate = true;
            }
        }

        // Rotate anchor reticle
        if (this.anchorMarker) {
            this.anchorMarker.rotation.z += dt * 4.0;
        }
    }

    updateHUDButton() {
        if (typeof document === 'undefined') return;
        const btn = document.getElementById('btn-grapple');
        if (!btn) return;

        if (this.cooldownTimer > 0) {
            btn.innerHTML = `🪝 Grapple (${this.cooldownTimer.toFixed(1)}s)`;
            btn.classList.remove('active');
            btn.style.opacity = '0.6';
        } else {
            btn.innerHTML = '🪝 Grapple (H)';
            btn.classList.add('active');
            btn.style.opacity = '1.0';
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxGrappleHook = RobloxGrappleHook;
}
