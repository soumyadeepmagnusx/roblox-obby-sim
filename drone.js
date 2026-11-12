/**
 * Roblox Floating 3D Companion Hover Drone AI
 * Orbiting shoulder assistant that smoothly tracks the player, rotates its thruster rotors,
 * and dynamically changes optic visor color to scan for nearby lava hazards and golden studs.
 */
class RobloxHelperDrone {
    constructor(scene, player, world, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.sound = sound;
        this.ui = ui;

        this.enabled = localStorage.getItem('roblox_drone_enabled') !== 'false';
        this.group = new THREE.Group();
        this.pos = new THREE.Vector3(2, 6, 0);

        this.buildDroneMesh();
        this.scene.add(this.group);
        this.group.visible = this.enabled;

        this.initKeyListeners();
    }

    buildDroneMesh() {
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        const accentMat = new THREE.MeshLambertMaterial({ color: 0xECF0F1 });
        this.visorMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });

        // Main Cubic Hull
        const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), bodyMat);
        this.group.add(hull);

        // Glowing Optic Scanner Visor
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.1), this.visorMat);
        visor.position.set(0, 0.05, 0.45);
        this.group.add(visor);
        this.visorMesh = visor;

        // Dual Wing Thrusters
        const finGeo = new THREE.BoxGeometry(0.25, 0.15, 0.5);
        const leftFin = new THREE.Mesh(finGeo, accentMat);
        leftFin.position.set(-0.6, 0.1, 0);
        const rightFin = new THREE.Mesh(finGeo, accentMat);
        rightFin.position.set(0.6, 0.1, 0);
        this.group.add(leftFin);
        this.group.add(rightFin);

        // Spinning Rotor Blade on Top
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), accentMat);
        antenna.position.set(0, 0.5, 0);
        this.group.add(antenna);

        this.rotor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.14), this.visorMat);
        this.rotor.position.set(0, 0.65, 0);
        this.group.add(this.rotor);
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'o' || e.key === 'O') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.toggle();
            }
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('roblox_drone_enabled', this.enabled.toString());
        this.group.visible = this.enabled;

        const btn = document.getElementById('btn-drone');
        if (btn) {
            btn.classList.toggle('active', this.enabled);
        }

        if (this.sound) this.sound.playSparkle ? this.sound.playSparkle() : this.sound.playCoin();
        if (this.ui) {
            this.ui.showToastBanner(`🤖 Companion Hover Drone: ${this.enabled ? 'ACTIVATED' : 'DOCKED'}`);
            this.ui.addChatMessage('Drone', `Companion Drone ${this.enabled ? 'deployed on shoulder' : 'recalled'}. [Key O]`, '#00E5FF');
        }
    }

    update(dt) {
        if (!this.enabled || !this.player || !this.player.position) return;

        const time = Date.now() * 0.003;

        // Calculate target shoulder hover position relative to player facing angle
        const angle = this.player.facingAngle || 0;
        const offsetX = Math.cos(angle) * 1.8 - Math.sin(angle) * 0.6;
        const offsetZ = -Math.sin(angle) * 1.8 - Math.cos(angle) * 0.6;
        const bobY = 2.8 + Math.sin(time * 2) * 0.3;

        const targetPos = new THREE.Vector3(
            this.player.position.x + offsetX,
            this.player.position.y + bobY,
            this.player.position.z + offsetZ
        );

        // Smooth exponential spring follow
        this.pos.lerp(targetPos, Math.min(1, dt * 6.5));
        this.group.position.copy(this.pos);

        // Face same direction as player
        this.group.rotation.y = angle;

        // Spin top rotor blade
        if (this.rotor) {
            this.rotor.rotation.y += dt * 18;
        }

        // Dynamic Hazard & Coin Scanner Visor Colors
        let scanColor = 0x00E5FF; // Cyan = Safe
        const pPos = this.player.position;

        if (this.world && this.world.hazardBlocks) {
            for (let i = 0; i < this.world.hazardBlocks.length; i++) {
                const hb = this.world.hazardBlocks[i];
                if (hb && hb.position && pPos.distanceTo(hb.position) < 8.5) {
                    scanColor = 0xFF1744; // Crimson Warning = Lava/Killbrick nearby
                    break;
                }
            }
        }

        if (scanColor === 0x00E5FF && this.world && this.world.coins) {
            for (let i = 0; i < this.world.coins.length; i++) {
                const c = this.world.coins[i];
                if (c && !c.collected && c.mesh && pPos.distanceTo(c.mesh.position) < 9.0) {
                    scanColor = 0xFFD700; // Gold = Collectible Treasure nearby
                    break;
                }
            }
        }

        if (this.visorMat) {
            this.visorMat.color.setHex(scanColor);
        }
    }
}

window.RobloxHelperDrone = RobloxHelperDrone;
