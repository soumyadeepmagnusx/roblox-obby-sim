/**
 * Roblox Gears & Backpack Inventory System
 * Slots 1-4: Speed Coil, Gravity Coil, Classic Sword, and Grappling Hook
 */
class RobloxGears {
    constructor(player, scene, sound, camera) {
        this.player = player;
        this.scene = scene;
        this.sound = sound;
        this.camera = camera;

        this.activeSlot = 0; // 0 = unequipped, 1 = Speed Coil, 2 = Gravity Coil, 3 = Sword, 4 = Grapple
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
            emissiveIntensity: 0.4
        });
        const mesh = new THREE.Mesh(tubeGeo, mat);
        group.add(mesh);

        // Core handle
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        group.add(handle);

        group.rotation.x = Math.PI / 2;
        group.position.set(0, -0.9, 0.5);
        return group;
    }

    createSwordMesh() {
        const group = new THREE.Group();

        // Silver Blade
        const bladeGeo = new THREE.BoxGeometry(0.2, 2.2, 0.05);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, metalness: 0.9, roughness: 0.1 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 1.0;
        group.add(blade);

        // Crossguard
        const guardGeo = new THREE.BoxGeometry(0.7, 0.1, 0.15);
        const guardMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.y = -0.1;
        group.add(guard);

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        const handleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.y = -0.45;
        group.add(handle);

        // Pommel
        const pommelGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const pommelMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8 });
        const pommel = new THREE.Mesh(pommelGeo, pommelMat);
        pommel.position.y = -0.8;
        group.add(pommel);

        group.rotation.x = Math.PI / 2;
        group.position.set(0, -0.9, 0.6);
        return group;
    }

    createGrappleMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        const hook = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 4), new THREE.MeshStandardMaterial({ color: 0xFF9900 }));
        hook.position.y = 0.6;
        group.add(body, hook);

        group.rotation.x = Math.PI / 2;
        group.position.set(0, -0.9, 0.5);
        return group;
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Keys 1, 2, 3, 4 for inventory hotbar
            if (['1', '2', '3', '4'].includes(e.key) && document.activeElement.tagName !== 'INPUT') {
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
        const model = this.gearModels[slotNumber];
        if (model) {
            this.currentGearMesh = model;
            this.player.rightArm.add(this.currentGearMesh);
        }

        // Apply passives
        if (slotNumber === 1) {
            // Speed Coil: 1.8x speed
            this.speedMultiplier = 1.8;
            this.sound.playBoost();
        } else if (slotNumber === 2) {
            // Gravity Coil: 0.4x gravity for huge floaty leaps
            this.gravityMultiplier = 0.42;
            this.player.gravity = 15.0;
            this.sound.playCheckpoint();
        } else if (slotNumber === 3) {
            // Sword: ready to slash
            this.sound.playStep();
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
        } else if (this.activeSlot === 4 && !this.isGrappling) {
            // Grapple Shot
            this.fireGrapple();
        }
    }

    fireGrapple() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const colliders = window.game.world.colliders.map(c => c.mesh);
        const hits = raycaster.intersectObjects(colliders, false);

        if (hits.length > 0 && hits[0].distance < 60) {
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
        for (let i = 1; i <= 4; i++) {
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
                this.player.velocity.copy(toTarget.multiplyScalar(32));
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
