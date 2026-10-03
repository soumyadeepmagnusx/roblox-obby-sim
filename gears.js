/**
 * Roblox Gears & Backpack Inventory System
 * Slots:
 * 1: Speed Coil (1.8x speed boost)
 * 2: Gravity Coil (0.42x floaty lunar gravity)
 * 3: Classic Sword (PvP slash attack & damage detection)
 * 4: Grappling Hook (Tether zip pull)
 * 5: Gravity Grab Gun (Physics crate grab/throw)
 * 6: Rocket Launcher (Explosive projectile blast)
 */
class RobloxGears {
    constructor(player, scene, sound, camera) {
        this.player = player;
        this.scene = scene;
        this.sound = sound;
        this.camera = camera;

        this.activeSlot = 0; // 0 = unequipped
        this.currentGearMesh = null;

        // Gear buffs & states
        this.speedMultiplier = 1.0;
        this.gravityMultiplier = 1.0;
        this.isSwingingSword = false;
        this.swordTimer = 0;

        // Grappling state
        this.isGrappling = false;
        this.grappleTarget = new THREE.Vector3();
        this.grappleLine = null;

        // Prebuild 3D Gear models
        this.gearModels = {
            1: this.createCoilMesh(0xFFD700, 0xAA7700), // Speed Coil
            2: this.createCoilMesh(0x00D0FF, 0x0088CC), // Gravity Coil
            3: this.createSwordMesh(),                  // Sword
            4: this.createGrappleMesh()                 // Grappling Hook
        };

        this.initEventListeners();
    }

    createCoilMesh(colorHex, emissiveHex) {
        const group = new THREE.Group();
        const curvePoints = [];
        const turns = 4;
        const count = 50;
        const radius = 0.35;
        const height = 1.2;

        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const angle = t * Math.PI * 2 * turns;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (t - 0.5) * height;
            curvePoints.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.09, 8, false);
        const mat = new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.8,
            roughness: 0.2,
            emissive: emissiveHex,
            emissiveIntensity: 0.3
        });
        const coilMesh = new THREE.Mesh(tubeGeo, mat);
        group.add(coilMesh);

        // Core central rod
        const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
        const rodMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const rod = new THREE.Mesh(rodGeo, rodMat);
        group.add(rod);

        group.position.set(0, -0.6, 0);
        return group;
    }

    createSwordMesh() {
        const group = new THREE.Group();

        // Blade
        const bladeGeo = new THREE.BoxGeometry(0.12, 1.8, 0.3);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            metalness: 0.9,
            roughness: 0.1
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 1.0;
        group.add(blade);

        // Guard
        const guardGeo = new THREE.BoxGeometry(0.2, 0.1, 0.8);
        const guardMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.y = 0.1;
        group.add(guard);

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
        const handleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.y = -0.25;
        group.add(handle);

        group.position.set(0, -0.6, -0.2);
        group.rotation.x = Math.PI / 4;
        return group;
    }

    createGrappleMesh() {
        const group = new THREE.Group();

        // Gun Body
        const bodyGeo = new THREE.BoxGeometry(0.3, 0.4, 1.0);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        barrelGeo.rotateX(Math.PI / 2);
        const barrelMat = new THREE.MeshLambertMaterial({ color: 0x7F8C8D });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.z = -0.6;
        group.add(barrel);

        // Hook prongs
        const hookGeo = new THREE.ConeGeometry(0.15, 0.3, 3);
        hookGeo.rotateX(-Math.PI / 2);
        const hookMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
        const hook = new THREE.Mesh(hookGeo, hookMat);
        hook.position.z = -0.95;
        group.add(hook);

        group.position.set(0, -0.6, -0.4);
        return group;
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Keys 1, 2, 3, 4, 5, 6 for inventory hotbar
            if (['1', '2', '3', '4', '5', '6'].includes(e.key) && document.activeElement.tagName !== 'INPUT') {
                const slot = parseInt(e.key);
                this.equipSlot(this.activeSlot === slot ? 0 : slot);
            }
        });

        // Left click to use active gear
        window.addEventListener('pointerdown', (e) => {
            if (e.button === 0 && !window.game.builder.active) {
                this.useActiveGear();
            }
        });
    }

    equipSlot(slotNumber) {
        // Unequip current gear
        if (this.currentGearMesh) {
            this.player.rightArm.remove(this.currentGearMesh);
            this.currentGearMesh = null;
        }

        // Deactivate Rocket Launcher mesh if unequipped
        if (window.game && window.game.combat) {
            window.game.combat.equipRocketLauncher(false);
        }

        // Reset multipliers
        this.speedMultiplier = 1.0;
        this.gravityMultiplier = 1.0;
        this.player.gravity = 36.0;

        if (this.activeSlot === slotNumber || slotNumber === 0) {
            this.activeSlot = 0;
            this.updateHotbarUI();
            return;
        }

        this.activeSlot = slotNumber;

        if (slotNumber >= 1 && slotNumber <= 4) {
            const model = this.gearModels[slotNumber];
            if (model) {
                this.currentGearMesh = model;
                this.player.rightArm.add(this.currentGearMesh);
            }
        } else if (slotNumber === 6) {
            // Slot 6: Rocket Launcher
            if (window.game && window.game.combat) {
                window.game.combat.equipRocketLauncher(true);
            }
        }

        // Apply passives
        if (slotNumber === 1) {
            // Speed Coil: 1.8x speed
            this.speedMultiplier = 1.8;
            this.sound.playBoost();
        } else if (slotNumber === 2) {
            // Gravity Coil: 0.42x gravity
            this.gravityMultiplier = 0.42;
            this.player.gravity = 15.0;
            this.sound.playCheckpoint();
        } else if (slotNumber === 3) {
            // Sword: ready to slash
            this.sound.playStep();
        } else if (slotNumber === 5) {
            // Grab Gun
            this.sound.playStep();
        } else if (slotNumber === 6) {
            // Rocket Launcher
            this.sound.playBoost();
        }

        this.updateHotbarUI();
    }

    useActiveGear() {
        if (this.activeSlot === 3 && !this.isSwingingSword) {
            // Sword Slash attack!
            this.isSwingingSword = true;
            this.swordTimer = 0;
            this.sound.playJump();

            // Forward sword lunge impulse
            const yaw = this.player.facingAngle;
            this.player.velocity.x += Math.sin(yaw) * 14;
            this.player.velocity.z += Math.cos(yaw) * 14;
            if (this.player.isGrounded) this.player.velocity.y = 8;

            // Trigger PvP combat melee strike
            if (window.game && window.game.combat) {
                const bots = window.game.bots;
                const remotePlayers = window.game.network ? window.game.network.remotePlayers : null;
                window.game.combat.performSwordAttack(bots, remotePlayers);
            }

        } else if (this.activeSlot === 4 && !this.isGrappling) {
            // Grapple Shot
            this.fireGrapple();
        } else if (this.activeSlot === 5) {
            // Grab Gun trigger
            if (window.game && window.game.physicsObjects) {
                window.game.physicsObjects.toggleGrab(this.player, this.camera);
            }
        } else if (this.activeSlot === 6) {
            // Rocket Launcher Shot
            if (window.game && window.game.combat) {
                const dir = new THREE.Vector3();
                this.camera.getWorldDirection(dir);
                window.game.combat.fireRocket(dir);
            }
        }
    }

    fireGrapple() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const colliders = window.game.world.colliders.map(c => c.mesh);
        const hits = raycaster.intersectObjects(colliders, false);

        if (hits.length > 0 && hits[0].distance < 75) {
            this.isGrappling = true;
            this.grappleTarget.copy(hits[0].point);
            this.sound.playBoost();

            // Create visible tether line
            const lineMat = new THREE.LineBasicMaterial({ color: 0x00FF88, linewidth: 3 });
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                this.player.position,
                this.grappleTarget
            ]);
            this.grappleLine = new THREE.Line(lineGeo, lineMat);
            this.scene.add(this.grappleLine);
        }
    }

    updateHotbarUI() {
        for (let i = 1; i <= 6; i++) {
            const slotEl = document.getElementById(`hotbar-slot-${i}`);
            if (slotEl) {
                if (this.activeSlot === i) slotEl.classList.add('active');
                else slotEl.classList.remove('active');
            }
        }
    }

    update(dt) {
        // Sword slash swing animation
        if (this.isSwingingSword) {
            this.swordTimer += dt * 14;
            const swingAngle = Math.sin(this.swordTimer) * 1.6;
            this.player.rightArmPivot.rotation.x = -swingAngle - 0.5;
            this.player.rightArmPivot.rotation.z = -swingAngle * 0.5;

            if (this.swordTimer >= Math.PI) {
                this.isSwingingSword = false;
                this.player.rightArmPivot.rotation.set(0, 0, 0);
            }
        }

        // Grappling pull physics
        if (this.isGrappling) {
            const toTarget = new THREE.Vector3().subVectors(this.grappleTarget, this.player.position);
            const dist = toTarget.length();

            if (dist > 2.0) {
                toTarget.normalize();
                this.player.velocity.copy(toTarget.multiplyScalar(35));
                this.player.isGrounded = false;

                // Update line mesh
                if (this.grappleLine) {
                    const linePos = this.grappleLine.geometry.attributes.position;
                    linePos.setXYZ(0, this.player.position.x, this.player.position.y + 1.5, this.player.position.z);
                    linePos.setXYZ(1, this.grappleTarget.x, this.grappleTarget.y, this.grappleTarget.z);
                    linePos.needsUpdate = true;
                }
            } else {
                // Reached target
                this.isGrappling = false;
                if (this.grappleLine) {
                    this.scene.remove(this.grappleLine);
                    this.grappleLine.geometry.dispose();
                    this.grappleLine = null;
                }
            }
        }
    }
}

window.RobloxGears = RobloxGears;
