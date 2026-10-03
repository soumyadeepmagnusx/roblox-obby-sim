/**
 * Roblox Vehicles & Mounts Engine
 * Features:
 * - Cyber Neon Hoverboard (Key 'H') with banking tilt, air spin, and speed boost
 * - Dual Thruster Jetpack (Key 'J') with rocket exhaust, vertical boost, and dynamic fuel
 */
class RobloxVehicleManager {
    constructor(player, scene, particleEngine, sound, ui) {
        this.player = player;
        this.scene = scene;
        this.particleEngine = particleEngine;
        this.sound = sound;
        this.ui = ui;

        // Hoverboard State
        this.hoverboardActive = false;
        this.hoverboardMesh = null;
        this.boardTilt = 0;
        this.airSpin = 0;

        // Jetpack State
        this.jetpackActive = false;
        this.jetpackMesh = null;
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelDrainRate = 22; // % per second
        this.fuelRechargeRate = 45; // % per second
        this.isThrusting = false;

        this.initMeshes();
        this.bindEvents();
    }

    initMeshes() {
        // Build 3D Hoverboard Mesh
        this.hoverboardMesh = new THREE.Group();

        // Deck
        const deckGeom = new THREE.BoxGeometry(1.6, 0.15, 3.4);
        const deckMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const deck = new THREE.Mesh(deckGeom, deckMat);
        deck.castShadow = true;
        this.hoverboardMesh.add(deck);

        // Neon Glow Trim
        const neonGeom = new THREE.BoxGeometry(1.7, 0.08, 3.5);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const neonTrim = new THREE.Mesh(neonGeom, neonMat);
        this.hoverboardMesh.add(neonTrim);

        // Underglow Repulsor Pits
        const repulsorGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
        const repulsorMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
        const frontRep = new THREE.Mesh(repulsorGeom, repulsorMat);
        frontRep.position.set(0, -0.1, -1.0);
        this.hoverboardMesh.add(frontRep);

        const backRep = new THREE.Mesh(repulsorGeom, repulsorMat);
        backRep.position.set(0, -0.1, 1.0);
        this.hoverboardMesh.add(backRep);

        this.hoverboardMesh.visible = false;
        this.scene.add(this.hoverboardMesh);

        // Build 3D Jetpack Mesh (attaches to Torso)
        this.jetpackMesh = new THREE.Group();

        // Main Tanks
        const tankGeom = new THREE.CylinderGeometry(0.22, 0.22, 1.4, 16);
        const tankMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        const nozzleGeom = new THREE.ConeGeometry(0.25, 0.35, 16);
        const nozzleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // Left thruster
        const leftTank = new THREE.Mesh(tankGeom, tankMat);
        leftTank.position.set(-0.45, 0, -0.65);
        const leftNozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
        leftNozzle.position.set(-0.45, -0.8, -0.65);
        leftNozzle.rotation.x = Math.PI;
        this.jetpackMesh.add(leftTank);
        this.jetpackMesh.add(leftNozzle);

        // Right thruster
        const rightTank = new THREE.Mesh(tankGeom, tankMat);
        rightTank.position.set(0.45, 0, -0.65);
        const rightNozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
        rightNozzle.position.set(0.45, -0.8, -0.65);
        rightNozzle.rotation.x = Math.PI;
        this.jetpackMesh.add(rightTank);
        this.jetpackMesh.add(rightNozzle);

        // Cross bracket
        const bracketGeom = new THREE.BoxGeometry(1.1, 0.3, 0.15);
        const bracketMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const bracket = new THREE.Mesh(bracketGeom, bracketMat);
        bracket.position.set(0, 0, -0.58);
        this.jetpackMesh.add(bracket);

        this.jetpackMesh.visible = false;
        if (this.player.torso) {
            this.player.torso.add(this.jetpackMesh);
        }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused()) return;

            if (e.key === 'h' || e.key === 'H') {
                this.toggleHoverboard();
            } else if (e.key === 'j' || e.key === 'J') {
                this.toggleJetpack();
            }
        });
    }

    toggleHoverboard() {
        this.hoverboardActive = !this.hoverboardActive;
        this.hoverboardMesh.visible = this.hoverboardActive;

        if (this.hoverboardActive) {
            // Speed boost
            this.player.speedMultiplier = 2.2;
            this.sound.playCoin();
            this.ui.addChatMessage('Vehicle', '🛹 Cyber Hoverboard EQUIPPED! (Speed: 2.2x, Press H to unequip)', '#00FFFF');
        } else {
            this.player.speedMultiplier = 1.0;
            this.ui.addChatMessage('Vehicle', '🛹 Hoverboard unequipped.', '#AAAAAA');
        }

        const btn = document.getElementById('btn-hoverboard');
        if (btn) {
            btn.classList.toggle('active', this.hoverboardActive);
        }
    }

    toggleJetpack() {
        this.jetpackActive = !this.jetpackActive;
        this.jetpackMesh.visible = this.jetpackActive;

        if (this.jetpackActive) {
            this.sound.playCoin();
            this.ui.addChatMessage('Vehicle', '🚀 Dual Jetpack EQUIPPED! (Hold SPACE in mid-air to fly, Press J to unequip)', '#FF5500');
        } else {
            this.ui.addChatMessage('Vehicle', '🚀 Jetpack unequipped.', '#AAAAAA');
        }

        const btn = document.getElementById('btn-jetpack');
        if (btn) {
            btn.classList.toggle('active', this.jetpackActive);
        }

        // Show/hide fuel bar HUD
        const fuelContainer = document.getElementById('jetpack-fuel-container');
        if (fuelContainer) {
            fuelContainer.style.display = this.jetpackActive ? 'block' : 'none';
        }
    }

    update(dt, keys) {
        // 1. Hoverboard Update
        if (this.hoverboardActive) {
            // Anchor under player's feet
            this.hoverboardMesh.position.set(
                this.player.position.x,
                this.player.position.y - 1.25,
                this.player.position.z
            );

            // Follow player's horizontal rotation
            this.hoverboardMesh.rotation.y = this.player.mesh.rotation.y;

            // Bank/Tilt when steering
            let targetTilt = 0;
            if (keys['KeyA'] || keys['ArrowLeft']) targetTilt = 0.35;
            if (keys['KeyD'] || keys['ArrowRight']) targetTilt = -0.35;
            this.boardTilt = THREE.MathUtils.lerp(this.boardTilt, targetTilt, 10 * dt);
            this.hoverboardMesh.rotation.z = this.boardTilt;

            // Air spin trick when jumping high
            if (!this.player.isGrounded && Math.abs(this.player.velocity.y) > 4) {
                this.airSpin += dt * 6;
                this.hoverboardMesh.rotation.y += this.airSpin;
            } else {
                this.airSpin = 0;
            }

            // Neon trail particles
            if (Math.abs(this.player.velocity.x) > 1 || Math.abs(this.player.velocity.z) > 1) {
                if (Math.random() > 0.4) {
                    this.particleEngine.spawnHoverTrail(this.hoverboardMesh.position, 0x00FFFF);
                }
            }
        }

        // 2. Jetpack Thrusters Update
        if (this.jetpackActive) {
            const wantsThrust = keys['Space'] && !this.player.isGrounded;

            if (wantsThrust && this.fuel > 0) {
                this.isThrusting = true;
                this.fuel = Math.max(0, this.fuel - this.fuelDrainRate * dt);

                // Apply upward velocity
                this.player.velocity.y = Math.min(22, this.player.velocity.y + 35 * dt);

                // Forward boost if moving
                if (keys['KeyW'] || keys['ArrowUp']) {
                    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
                    this.player.position.addScaledVector(forward, 15 * dt);
                }

                // Exhaust particles
                const leftPos = new THREE.Vector3(-0.45, -1.0, -0.65).applyMatrix4(this.player.torso.matrixWorld);
                const rightPos = new THREE.Vector3(0.45, -1.0, -0.65).applyMatrix4(this.player.torso.matrixWorld);
                this.particleEngine.spawnJetpackExhaust(leftPos, rightPos);

            } else {
                this.isThrusting = false;
                // Recharge fuel when grounded
                if (this.player.isGrounded) {
                    this.fuel = Math.min(this.maxFuel, this.fuel + this.fuelRechargeRate * dt);
                }
            }

            // Update fuel bar HUD
            const fuelFill = document.getElementById('jetpack-fuel-fill');
            const fuelVal = document.getElementById('jetpack-fuel-val');
            if (fuelFill && fuelVal) {
                const pct = Math.round(this.fuel);
                fuelFill.style.width = `${pct}%`;
                fuelVal.textContent = `${pct}%`;
            }
        }
    }
}
