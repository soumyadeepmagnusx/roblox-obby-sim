/**
 * Roblox PvP Combat, Health & Rocket Launcher System
 * Features:
 * - Dynamic 100 HP Health Bar with Regen
 * - PvP Sword Melee Hit Detection & Knockback Physics
 * - Floating Combat Damage Numbers (-25, CRIT -50!)
 * - Slot 6: Rocket Launcher with Projectile Physics & AOE Explosions
 * - Elimination Announcements, Oof Ragdoll, and Coin Bounties
 */
class RobloxCombatSystem {
    constructor(player, scene, particleEngine, sound, ui, network) {
        this.player = player;
        this.scene = scene;
        this.particleEngine = particleEngine;
        this.sound = sound;
        this.ui = ui;
        this.network = network;

        this.hp = 100;
        this.maxHp = 100;
        this.regenRate = 5; // HP per second out of combat
        this.timeSinceDamage = 0;
        this.invulnerable = false;

        this.rockets = [];
        this.rocketCooldown = 0;

        this.initRocketLauncherMesh();
        this.updateHealthBar();
    }

    initRocketLauncherMesh() {
        // Rocket Launcher 3D Model (Held in Right Arm for Slot 6)
        this.launcherMesh = new THREE.Group();

        // Barrel tube
        const barrelGeom = new THREE.CylinderGeometry(0.2, 0.2, 2.2, 16);
        barrelGeom.rotateX(Math.PI / 2);
        const barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const barrel = new THREE.Mesh(barrelGeom, barrelMat);
        this.launcherMesh.add(barrel);

        // Exhaust chamber
        const exhaustGeom = new THREE.ConeGeometry(0.3, 0.5, 16);
        exhaustGeom.rotateX(-Math.PI / 2);
        const exhaustMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
        exhaust.position.z = 1.2;
        this.launcherMesh.add(exhaust);

        // Grip handle
        const gripGeom = new THREE.BoxGeometry(0.12, 0.5, 0.15);
        const gripMat = new THREE.MeshLambertMaterial({ color: 0x990000 });
        const grip = new THREE.Mesh(gripGeom, gripMat);
        grip.position.set(0, -0.3, 0);
        this.launcherMesh.add(grip);

        this.launcherMesh.visible = false;
        if (this.player.rightArm) {
            this.launcherMesh.position.set(0, -0.8, -0.4);
            this.player.rightArm.add(this.launcherMesh);
        }
    }

    equipRocketLauncher(active) {
        if (this.launcherMesh) {
            this.launcherMesh.visible = active;
        }
    }

    /**
     * Fire an explosive rocket from player towards camera direction
     */
    fireRocket(cameraDir) {
        if (this.rocketCooldown > 0) return;
        this.rocketCooldown = 0.8; // 800ms cooldown

        // Rocket Mesh
        const rocketGroup = new THREE.Group();

        // Body
        const bodyGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
        bodyGeom.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, metalness: 0.6 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        rocketGroup.add(body);

        // Cone Tip
        const coneGeom = new THREE.ConeGeometry(0.15, 0.4, 12);
        coneGeom.rotateX(Math.PI / 2);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.z = 0.55;
        rocketGroup.add(cone);

        // Spawn position: in front of player
        const spawnPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(cameraDir, 1.5);
        rocketGroup.position.copy(spawnPos);
        rocketGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cameraDir);

        this.scene.add(rocketGroup);

        this.rockets.push({
            mesh: rocketGroup,
            dir: cameraDir.clone().normalize(),
            speed: 40.0, // studs/sec
            life: 4.0,
            shooter: 'me'
        });

        // Audio
        this.sound.playSwordSlash();

        // Broadcast to multiplayer server
        if (this.network && this.network.connected) {
            this.network.sendRocketFire(spawnPos, cameraDir);
        }
    }

    /**
     * Sword melee attack hit check against bots & remote players
     */
    performSwordAttack(bots, remotePlayers) {
        const attackRange = 5.0; // studs
        const playerPos = this.player.position;
        const facing = (this.player.facingAngle !== undefined) ? this.player.facingAngle : (this.player.group ? this.player.group.rotation.y : 0);
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facing);

        let hitSomeone = false;

        // 1. Check AI Bots
        if (bots && bots.bots) {
            bots.bots.forEach(bot => {
                if (bot.dead) return;
                const dist = playerPos.distanceTo(bot.pos);
                if (dist < attackRange) {
                    const isCrit = Math.random() < 0.25;
                    const dmg = isCrit ? 50 : 25;

                    this.damageBot(bot, dmg, isCrit, forward);
                    hitSomeone = true;
                }
            });
        }

        // 2. Check Remote Real Players
        if (remotePlayers) {
            remotePlayers.forEach((rp, id) => {
                if (!rp.rig) return;
                const dist = playerPos.distanceTo(rp.rig.position);
                if (dist < attackRange) {
                    const isCrit = Math.random() < 0.25;
                    const dmg = isCrit ? 50 : 25;

                    // Send combat hit packet to server
                    if (this.network && this.network.connected) {
                        this.network.sendCombatHit(id, dmg, isCrit, forward);
                    }

                    // Local visual effects
                    this.particleEngine.spawnFloatingText(rp.rig.position, isCrit ? `CRIT -${dmg}!` : `-${dmg}`, isCrit);
                    hitSomeone = true;
                }
            });
        }

        if (hitSomeone) {
            this.sound.playSwordSlash();
        }
    }

    damageBot(bot, dmg, isCrit, knockbackDir) {
        bot.hp = (bot.hp || 100) - dmg;
        this.particleEngine.spawnFloatingText(bot.pos, isCrit ? `CRIT -${dmg}!` : `-${dmg}`, isCrit);

        // Knockback bot
        bot.pos.addScaledVector(knockbackDir, 2.5);

        if (bot.hp <= 0) {
            bot.dead = true;
            this.sound.playOof();
            this.particleEngine.spawnConfetti(bot.pos);
            this.ui.addChatMessage('Combat', `⚔️ You eliminated bot [${bot.name}]! (+100 Coins Bounty)`, '#FFD700');

            if (window.game && window.game.collectibles) {
                window.game.collectibles.addCoins(100);
            }

            // Respawn bot after 8 seconds
            setTimeout(() => {
                bot.hp = 100;
                bot.dead = false;
                bot.pos.set(0, 2, 0);
            }, 8000);
        }
    }

    takeDamage(amount, isCrit = false, attackerName = 'Unknown') {
        if (this.invulnerable || this.hp <= 0) return;

        this.hp = Math.max(0, this.hp - amount);
        this.timeSinceDamage = 0;
        this.updateHealthBar();

        this.sound.playOof();
        this.particleEngine.spawnFloatingText(this.player.position, isCrit ? `CRIT -${amount}!` : `-${amount}`, isCrit);

        // Flash red screen vignette
        this.flashDamageOverlay();

        if (this.hp <= 0) {
            this.onEliminated(attackerName);
        }
    }

    flashDamageOverlay() {
        let overlay = document.getElementById('damage-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'damage-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.pointerEvents = 'none';
            overlay.style.boxShadow = 'inset 0 0 80px rgba(255, 0, 0, 0.7)';
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.zIndex = '50';
            document.body.appendChild(overlay);
        }
        overlay.style.opacity = '1';
        setTimeout(() => { overlay.style.opacity = '0'; }, 300);
    }

    onEliminated(attackerName) {
        this.ui.showToastBanner(`💀 ELIMINATED BY ${attackerName.toUpperCase()}!`);
        this.ui.addChatMessage('Combat', `💀 You were defeated by ${attackerName}! Respawning...`, '#FF3333');

        // Trigger ragdoll explosion
        this.player.die();

        // Respawn with full health & brief invulnerability
        setTimeout(() => {
            this.hp = 100;
            this.updateHealthBar();
            this.invulnerable = true;
            this.ui.addChatMessage('System', '🛡️ Spawn protection active for 3 seconds.', '#00FF88');
            setTimeout(() => { this.invulnerable = false; }, 3000);
        }, 1500);
    }

    updateHealthBar() {
        const fill = document.querySelector('.health-bar-fill');
        if (fill) {
            const pct = Math.max(0, Math.min(100, this.hp));
            fill.style.width = `${pct}%`;

            if (pct > 50) {
                fill.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
            } else if (pct > 25) {
                fill.style.background = 'linear-gradient(90deg, #F39C12, #E67E22)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #E74C3C, #C0392B)';
            }
        }
    }

    update(dt, crates) {
        // Cooldowns
        if (this.rocketCooldown > 0) this.rocketCooldown -= dt;

        // Health Regeneration
        this.timeSinceDamage += dt;
        if (this.timeSinceDamage > 4.0 && this.hp < this.maxHp && this.hp > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
            this.updateHealthBar();
        }

        // Rocket Projectiles Update
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.life -= dt;

            // Move rocket
            const step = r.dir.clone().multiplyScalar(r.speed * dt);
            r.mesh.position.add(step);

            // Smoke particle trail
            if (Math.random() > 0.3) {
                this.particleEngine.spawnJetpackExhaust(r.mesh.position, null);
            }

            // Check collision with ground/crates
            let exploded = false;

            // Hit ground/void
            if (r.mesh.position.y < 0.5) exploded = true;

            // Hit pushable crates
            if (crates) {
                crates.forEach(crate => {
                    if (r.mesh.position.distanceTo(crate.mesh.position) < 2.5) {
                        exploded = true;
                        // Radial explosion impulse on crate
                        const pushDir = crate.mesh.position.clone().sub(r.mesh.position).normalize();
                        crate.velocity.addScaledVector(pushDir, 18.0);
                        crate.velocity.y += 8.0;
                    }
                });
            }

            // Hit lifetime limit or obstacle
            if (r.life <= 0) exploded = true;

            if (exploded) {
                this.particleEngine.spawnExplosion(r.mesh.position);
                this.sound.playOof();

                // Player splash damage if near explosion
                const distToMe = this.player.position.distanceTo(r.mesh.position);
                if (distToMe < 8.0) {
                    const splashDmg = Math.round((1.0 - distToMe / 8.0) * 45);
                    this.takeDamage(splashDmg, false, 'Explosion');
                    // Knockback
                    const push = this.player.position.clone().sub(r.mesh.position).normalize();
                    this.player.velocity.addScaledVector(push, 16.0);
                    this.player.velocity.y += 10.0;
                }

                // Cleanup rocket mesh
                this.scene.remove(r.mesh);
                this.rockets.splice(i, 1);
            }
        }
    }
}
