/**
 * Roblox Dynamic Celestial Atmosphere & Lighting Engine
 * Controls multi-preset environmental lighting: Noon, Sunset, Midnight Starfield,
 * Synthwave Neon, and Cherry Blossom Dawn with dynamic sun/moon celestial meshes and fog transitions.
 */
class RobloxLightingEngine {
    constructor(scene, dirLight, ambientLight, ui) {
        this.scene = scene;
        this.dirLight = dirLight;
        this.ambientLight = ambientLight;
        this.ui = ui;

        this.presets = [
            {
                id: 'day',
                name: '☀️ Vibrant Noon',
                skyColor: 0x7EC0EE,
                fogColor: 0x7EC0EE,
                ambientColor: 0xFFFFFF,
                ambientIntensity: 0.65,
                sunColor: 0xFFF5E6,
                sunIntensity: 0.95,
                sunPos: { x: 50, y: 120, z: 40 }
            },
            {
                id: 'sunset',
                name: '🌅 Golden Sunset',
                skyColor: 0xFF7043,
                fogColor: 0xFF8A65,
                ambientColor: 0xFFAB91,
                ambientIntensity: 0.55,
                sunColor: 0xFFA000,
                sunIntensity: 0.85,
                sunPos: { x: 100, y: 35, z: 60 }
            },
            {
                id: 'midnight',
                name: '🌌 Midnight Starfield',
                skyColor: 0x0A0E1A,
                fogColor: 0x0A0E1A,
                ambientColor: 0x1A237E,
                ambientIntensity: 0.40,
                sunColor: 0x00E5FF,
                sunIntensity: 0.55,
                sunPos: { x: -40, y: 90, z: -50 }
            },
            {
                id: 'synthwave',
                name: '👾 Synthwave Neon',
                skyColor: 0x3F0071,
                fogColor: 0x2A0845,
                ambientColor: 0xFF007F,
                ambientIntensity: 0.60,
                sunColor: 0x00F0FF,
                sunIntensity: 0.90,
                sunPos: { x: 60, y: 70, z: -30 }
            },
            {
                id: 'dawn',
                name: '🌸 Cherry Blossom Dawn',
                skyColor: 0xF8BBD0,
                fogColor: 0xF48FB1,
                ambientColor: 0xFFCDD2,
                ambientIntensity: 0.65,
                sunColor: 0xFF80AB,
                sunIntensity: 0.85,
                sunPos: { x: -80, y: 45, z: 70 }
            }
        ];

        this.currentIndex = 0;
        this.initCelestialBodies();
        this.initKeyListeners();
    }

    initCelestialBodies() {
        // Celestial Sun Mesh
        const sunGeo = new THREE.SphereGeometry(6, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFF176 });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.position.set(50, 120, 40);
        this.scene.add(sunMesh);
        this.sunMesh = sunMesh;

        // Celestial Moon / Crescent Mesh
        const moonGeo = new THREE.SphereGeometry(4.5, 16, 16);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xE0F7FA });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(-50, 100, -40);
        this.scene.add(moonMesh);
        this.moonMesh = moonMesh;
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'l' || e.key === 'L') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.cyclePreset();
            }
        });
    }

    cyclePreset() {
        this.currentIndex = (this.currentIndex + 1) % this.presets.length;
        this.applyPreset(this.presets[this.currentIndex]);
    }

    applyPreset(preset) {
        if (!preset) return;

        // Apply scene background and fog
        if (this.scene) {
            this.scene.background = new THREE.Color(preset.skyColor);
            if (this.scene.fog) {
                this.scene.fog.color = new THREE.Color(preset.fogColor);
            }
        }

        // Apply ambient light
        if (this.ambientLight) {
            this.ambientLight.color = new THREE.Color(preset.ambientColor);
            this.ambientLight.intensity = preset.ambientIntensity;
        }

        // Apply directional sun
        if (this.dirLight) {
            this.dirLight.color = new THREE.Color(preset.sunColor);
            this.dirLight.intensity = preset.sunIntensity;
            this.dirLight.position.set(preset.sunPos.x, preset.sunPos.y, preset.sunPos.z);
        }

        // Position celestial body
        if (this.sunMesh) {
            this.sunMesh.position.set(preset.sunPos.x * 1.5, preset.sunPos.y * 1.5, preset.sunPos.z * 1.5);
            this.sunMesh.visible = preset.id !== 'midnight';
        }
        if (this.moonMesh) {
            this.moonMesh.position.set(-preset.sunPos.x * 1.4, preset.sunPos.y * 1.3, -preset.sunPos.z * 1.4);
            this.moonMesh.visible = preset.id === 'midnight' || preset.id === 'synthwave';
        }

        // Update button text in HUD if present
        const btn = document.getElementById('btn-atmosphere');
        if (btn) {
            btn.innerHTML = `${preset.name.split(' ')[0]} ${preset.name.split(' ')[1]}`;
        }

        if (this.ui) {
            this.ui.showToastBanner(`Atmosphere: ${preset.name}`);
            this.ui.addChatMessage('Atmosphere', `Changed lighting preset to ${preset.name}`, '#00D2FF');
        }
    }

    update(dt) {
        // Slow celestial drift
        if (this.sunMesh) {
            this.sunMesh.rotation.y += dt * 0.1;
        }
    }
}

window.RobloxLightingEngine = RobloxLightingEngine;
