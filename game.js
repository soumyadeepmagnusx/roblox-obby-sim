/**
 * Roblox Obby Simulator - Master Game Orchestrator
 * Integrates:
 * - Particle & FX Engine (sparks, smoke, floating damage numbers, confetti)
 * - Vehicles & Mounts (Hoverboard & Jetpack)
 * - 3D Pets & Mystery Egg Hatching Pedestal
 * - Collectible 3D Gold Coins & Economy
 * - PvP Combat, Health System & Rocket Launcher
 * - Multi-Room WebSocket Multiplayer & Real-Time Sync
 * - Speedrun Timer & Personal Bests
 */
class RobloxGame {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();

        this.initThree();
        this.initLighting();
        this.initClouds();

        // Core Components
        this.sound = window.soundEngine;
        this.particles = new RobloxParticleEngine(this.scene);
        this.world = new RobloxWorld(this.scene, this.sound);
        this.player = new RobloxPlayer(this.scene, this.sound);
        this.security = new RobloxSecurity(this.player, this.world);
        this.shop = new AvatarShop(this.player, this.scene);
        this.cameraController = new RobloxCamera(this.camera, this.renderer.domElement);
        this.gears = new RobloxGears(this.player, this.scene, this.sound, this.camera);
        this.emotes = new RobloxEmotes(this.player, this.sound);
        this.builder = new RobloxBuilder(this.scene, this.world, this.camera, this.renderer.domElement);
        this.ui = new RobloxUI(this.player, this.cameraController, this.builder, this.sound);
        this.bots = new RobloxBots(this.scene, this.sound, this.ui);
        this.network = new RobloxNetwork(this.player, this.scene, this.ui, this.sound);
        this.music = new RobloxMusicPlayer(this.sound);
        this.physics = new RobloxPhysicsEngine(this.scene, this.world, this.sound);

        // Advanced Systems
        this.speechBubbles = new RobloxSpeechBubbles(this.scene);
        this.vehicles = new RobloxVehicleManager(this.player, this.scene, this.particles, this.sound, this.ui);
        this.pets = new RobloxPetManager(this.player, this.scene, this.particles, this.sound, this.ui);
        this.collectibles = new RobloxCollectibles(this.scene, this.player, this.particles, this.sound, this.ui);
        this.combat = new RobloxCombatSystem(this.player, this.scene, this.particles, this.sound, this.ui, this.network);
        this.voice = new RobloxVoiceChat(this.player, this.scene, this.network, this.ui, this.sound);

        // Speedrun Timer State
        this.speedrunTime = 0;
        this.speedrunActive = false;
        this.speedrunCompleted = false;

        // Interaction Key 'E': Physics Grab or Egg Hatching
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused()) return;

            if (e.key === 'e' || e.key === 'E') {
                // Check if near Mystery Egg Pedestal
                if (this.pets && this.pets.pedestalGroup) {
                    const distToEgg = this.player.position.distanceTo(this.pets.pedestalGroup.position);
                    if (distToEgg < 6.0) {
                        this.pets.hatchEgg(this.collectibles);
                        return;
                    }
                }

                // Otherwise, physics crate grab / throw
                const action = this.physics.interactGrab(this.camera, this.player);
                if (action === 'grabbed') {
                    this.ui.addChatMessage('Physics', '📦 Grabbed physics crate! Press E or Click to THROW!', '#00FF88');
                } else if (action === 'thrown') {
                    this.ui.addChatMessage('Physics', '🚀 Launched crate with high momentum!', '#FFD700');
                }
            }
        });

        // Day / Night Atmosphere state: 'day', 'sunset', 'night'
        this.timeOfDay = 'day';

        // Load any saved custom creations
        this.builder.loadCustomBlocks();

        // Events
        window.addEventListener('resize', () => this.onResize());

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x7EC0EE); // Classic Roblox sky blue
        this.scene.fog = new THREE.FogExp2(0x7EC0EE, 0.0035);

        this.camera = new THREE.PerspectiveCamera(
            65,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);
    }

    initLighting() {
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.65);
        this.scene.add(ambientLight);

        this.sun = new THREE.DirectionalLight(0xFFF6D5, 0.85);
        this.sun.position.set(40, 90, 40);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 400;

        const d = 120;
        this.sun.shadow.camera.left = -d;
        this.sun.shadow.camera.right = d;
        this.sun.shadow.camera.top = d;
        this.sun.shadow.camera.bottom = -d;

        this.scene.add(this.sun);
    }

    initClouds() {
        const cloudGroup = new THREE.Group();
        const cloudMat = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.85
        });

        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 500;
            const y = 80 + Math.random() * 40;
            const z = Math.random() * 450 - 50;

            const w = 20 + Math.random() * 30;
            const h = 4 + Math.random() * 4;
            const d = 15 + Math.random() * 20;

            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cloudMat);
            mesh.position.set(x, y, z);
            cloudGroup.add(mesh);
        }

        this.clouds = cloudGroup;
        this.scene.add(cloudGroup);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate);

        let dt = this.clock.getDelta();
        if (dt > 0.1) dt = 0.1; // clamp lag spikes

        // Slowly drift clouds
        if (this.clouds) {
            this.clouds.children.forEach(c => {
                c.position.x += dt * 1.5;
                if (c.position.x > 250) c.position.x = -250;
            });
        }

        // Keep sun shadow following player
        this.sun.position.x = this.player.position.x + 40;
        this.sun.position.z = this.player.position.z + 40;
        this.sun.target.position.copy(this.player.position);
        this.sun.target.updateMatrixWorld();

        // Speedrun Timer Logic
        if (this.player.currentStage > 0 && !this.speedrunCompleted) {
            this.speedrunActive = true;
            this.speedrunTime += dt;
            const m = Math.floor(this.speedrunTime / 60);
            const s = Math.floor(this.speedrunTime % 60);
            const ms = Math.floor((this.speedrunTime * 100) % 100);
            const timerEl = document.getElementById('stat-timer');
            if (timerEl) {
                timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
            }

            // Check if player completed final stage (Stage 6)
            if (this.player.currentStage >= 6 && !this.speedrunCompleted) {
                this.speedrunCompleted = true;
                this.particles.spawnConfetti(this.player.position);
                this.sound.playWin();
                this.ui.showToastBanner(`🏆 OBBY COMPLETED IN ${timerEl ? timerEl.textContent : ''}!`);
                this.ui.addChatMessage('Speedrun', `🏆 Finished the Obby in ${timerEl ? timerEl.textContent : ''}! Congratulations!`, '#FFD700');
            }
        }

        try {
            // Update player & camera
            this.player.update(dt, this.ui.inputState, this.cameraController.yaw, this.world);
            this.cameraController.update(this.player.position, dt);

            // Update world hazards & stages
            this.world.update(dt, this.player);

            // Update advanced systems safely
            if (this.particles) this.particles.update(dt);
            if (this.speechBubbles) this.speechBubbles.update(dt);
            if (this.vehicles) this.vehicles.update(dt, this.ui.inputState);
            if (this.pets) this.pets.update(dt);
            if (this.collectibles) this.collectibles.update(dt);
            if (this.combat) this.combat.update(dt, this.physics ? this.physics.crates : null);
            if (this.voice) this.voice.update(dt);

            // Update standard subsystems safely
            if (this.shop) this.shop.update(dt);
            if (this.bots) this.bots.update(dt);
            if (this.gears) this.gears.update(dt);
            if (this.network) this.network.update(dt);
            if (this.physics) this.physics.update(dt, this.player, this.camera);
            if (this.ui) this.ui.update(dt);
        } catch (e) {
            console.error('[RobloxGame] Animation update error caught safely:', e);
        }

        // Always render scene to canvas - never pitch black!
        this.renderer.render(this.scene, this.camera);
    }

    setAtmosphere(mode) {
        this.timeOfDay = mode;
        if (mode === 'day') {
            this.scene.background = new THREE.Color(0x7EC0EE);
            this.scene.fog.color = new THREE.Color(0x7EC0EE);
            this.sun.color = new THREE.Color(0xFFF6D5);
            this.sun.intensity = 0.85;
        } else if (mode === 'sunset') {
            this.scene.background = new THREE.Color(0xFF7043);
            this.scene.fog.color = new THREE.Color(0xFF8A65);
            this.sun.color = new THREE.Color(0xFFAB91);
            this.sun.intensity = 0.65;
        } else if (mode === 'night') {
            this.scene.background = new THREE.Color(0x0F111A);
            this.scene.fog.color = new THREE.Color(0x0F111A);
            this.sun.color = new THREE.Color(0x5C6BC0);
            this.sun.intensity = 0.25;
        }
    }
}

// Auto start when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new RobloxGame();
});
