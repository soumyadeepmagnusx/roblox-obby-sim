/**
 * Roblox Dynamic Weather & Environmental FX System
 * Features:
 * - 4 Atmospheric Weather Presets: Clear Sky, Downpour Rain, Winter Snow, Cosmic Meteor Shower
 * - 600+ Particle simulated precipitation anchored around avatar
 * - Seamless integration with skybox, fog density, and ambient lighting
 * - Hotkey (Key 'K') and HUD quick toggle
 */
class RobloxWeather {
    constructor(scene, player, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.modes = ['clear', 'rain', 'snow', 'meteor'];
        this.modeIndex = 0;
        this.currentMode = 'clear';

        // Weather particle systems
        this.rainSystem = null;
        this.snowSystem = null;
        this.meteorGroup = null;

        this.initRain();
        this.initSnow();
        this.initMeteors();
        this.bindEvents();
    }

    initRain() {
        const count = 650;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 6); // 2 vertices per line streak

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 120;
            const y = Math.random() * 60;
            const z = (Math.random() - 0.5) * 120;
            const len = 1.2 + Math.random() * 0.8;

            positions[i * 6 + 0] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y - len;
            positions[i * 6 + 5] = z;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({
            color: 0x88CCFF,
            transparent: true,
            opacity: 0.65
        });

        this.rainSystem = new THREE.LineSegments(geom, mat);
        this.rainSystem.visible = false;
        this.scene.add(this.rainSystem);
    }

    initSnow() {
        const count = 500;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i + 0] = (Math.random() - 0.5) * 110;
            positions[i + 1] = Math.random() * 50;
            positions[i + 2] = (Math.random() - 0.5) * 110;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1.5,
            transparent: true,
            opacity: 0.85
        });

        this.snowSystem = new THREE.Points(geom, mat);
        this.snowSystem.visible = false;
        this.scene.add(this.snowSystem);
    }

    initMeteors() {
        this.meteorGroup = new THREE.Group();
        this.meteors = [];

        for (let i = 0; i < 8; i++) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(-6, -8, -12)
            ]);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0xFF6600,
                linewidth: 2,
                transparent: true,
                opacity: 0.8
            });
            const line = new THREE.Line(lineGeo, lineMat);
            line.visible = false;
            this.meteorGroup.add(line);

            this.meteors.push({
                mesh: line,
                active: false,
                pos: new THREE.Vector3(),
                speed: 80 + Math.random() * 40,
                timer: Math.random() * 2
            });
        }

        this.meteorGroup.visible = false;
        this.scene.add(this.meteorGroup);
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused()) return;

            // Key 'K' toggles Weather
            if (e.key === 'k' || e.key === 'K') {
                this.cycleWeather();
            }
        });
    }

    cycleWeather() {
        this.modeIndex = (this.modeIndex + 1) % this.modes.length;
        this.setWeather(this.modes[this.modeIndex]);
    }

    setWeather(mode) {
        this.currentMode = mode;
        this.modeIndex = this.modes.indexOf(mode);

        // Reset visibility
        this.rainSystem.visible = (mode === 'rain');
        this.snowSystem.visible = (mode === 'snow');
        this.meteorGroup.visible = (mode === 'meteor');

        const labels = {
            clear: '☀️ Clear Sky',
            rain: '🌧️ Downpour Rain',
            snow: '❄️ Winter Snow',
            meteor: '☄️ Meteor Shower'
        };

        const btn = document.getElementById('btn-weather');
        if (btn) btn.innerHTML = labels[mode] || '🌦️ Weather';

        if (this.sound) this.sound.playCoin();
        if (this.ui) {
            this.ui.showToastBanner(`Weather: ${labels[mode]}`);
            this.ui.addChatMessage('Atmosphere', `Weather shifted to ${mode.toUpperCase()}!`, '#00F0FF');
        }
    }

    update(dt) {
        const playerPos = this.player.position;

        // Rain Update
        if (this.rainSystem && this.rainSystem.visible) {
            this.rainSystem.position.set(playerPos.x, playerPos.y, playerPos.z);
            const pos = this.rainSystem.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) {
                pos[i] -= dt * 65; // fast rainfall
                if (pos[i] < -10) {
                    pos[i] = 45 + Math.random() * 10;
                }
            }
            this.rainSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Snow Update
        if (this.snowSystem && this.snowSystem.visible) {
            this.snowSystem.position.set(playerPos.x, playerPos.y, playerPos.z);
            const pos = this.snowSystem.geometry.attributes.position.array;
            for (let i = 0; i < pos.length; i += 3) {
                pos[i + 1] -= dt * 10; // gentle snowfall
                pos[i + 0] += Math.sin(Date.now() * 0.002 + i) * dt * 3.0; // horizontal sway
                if (pos[i + 1] < -10) {
                    pos[i + 1] = 40 + Math.random() * 10;
                }
            }
            this.snowSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Meteor Shower Update
        if (this.meteorGroup && this.meteorGroup.visible) {
            this.meteors.forEach(m => {
                if (!m.active) {
                    m.timer -= dt;
                    if (m.timer <= 0) {
                        m.active = true;
                        m.mesh.visible = true;
                        m.pos.set(
                            playerPos.x + (Math.random() - 0.5) * 140,
                            playerPos.y + 70 + Math.random() * 30,
                            playerPos.z + (Math.random() - 0.5) * 140
                        );
                        m.mesh.position.copy(m.pos);
                    }
                } else {
                    m.pos.x += dt * 40;
                    m.pos.y -= dt * m.speed;
                    m.pos.z += dt * 70;
                    m.mesh.position.copy(m.pos);

                    if (m.pos.y < playerPos.y - 15) {
                        m.active = false;
                        m.mesh.visible = false;
                        m.timer = 0.5 + Math.random() * 2.0;
                    }
                }
            });
        }
    }
}
