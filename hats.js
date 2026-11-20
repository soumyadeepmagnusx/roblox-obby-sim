/**
 * Roblox Avatar Headwear & Shoulder Pets Manager
 * Provides procedural 3D wearable hats and animated shoulder companions:
 * 1. Sheriff Cowboy Stetson (Key N)
 * 2. Mystic Wizard Cone Hat
 * 3. Classic Backward Snapback
 * 4. Cyber Mecha Visor
 * 5. Shoulder Kitty Companion Pet
 */
class RobloxHeadwearManager {
    constructor(scene, player, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.hatTypes = ['none', 'cowboy', 'wizard', 'snapback', 'cyber', 'kitty'];
        this.hatLabels = {
            none: 'None (Default)',
            cowboy: '🤠 Sheriff Cowboy Stetson',
            wizard: '🧙‍♂️ Mystic Wizard Cone Hat',
            snapback: '🧢 Backward Snapback Cap',
            cyber: '🤖 Cyber Mecha Visor',
            kitty: '🐱 Shoulder Kitty Companion'
        };

        const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem('roblox_equipped_hat') : null;
        this.currentIndex = this.hatTypes.indexOf(saved);
        if (this.currentIndex < 0) this.currentIndex = 1; // Default to Cowboy

        this.currentMeshGroup = null;
        this.tailMesh = null;
        this.time = 0;

        if (typeof THREE !== 'undefined' && this.player && this.player.head) {
            this.applyHat(this.hatTypes[this.currentIndex]);
        }

        this.bindEvents();
    }

    bindEvents() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused && this.ui.isChatFocused()) return;
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (e.code === 'KeyN') {
                this.cycleHat();
            }
        });
    }

    cycleHat() {
        this.currentIndex = (this.currentIndex + 1) % this.hatTypes.length;
        const currentType = this.hatTypes[this.currentIndex];
        try {
            localStorage.setItem('roblox_equipped_hat', currentType);
        } catch (e) {}

        this.applyHat(currentType);

        if (this.sound && this.sound.playClick) {
            this.sound.playClick();
        }
        if (this.ui && this.ui.showToastBanner) {
            this.ui.showToastBanner(`Headwear: ${this.hatLabels[currentType] || currentType}`);
        }
    }

    clearCurrentHat() {
        if (this.currentMeshGroup) {
            if (this.currentMeshGroup.parent) {
                this.currentMeshGroup.parent.remove(this.currentMeshGroup);
            }
            this.currentMeshGroup = null;
        }
        this.tailMesh = null;
    }

    applyHat(type) {
        if (typeof THREE === 'undefined' || !this.player || !this.player.head) return;
        this.clearCurrentHat();

        if (type === 'none') return;

        const group = new THREE.Group();

        if (type === 'cowboy') {
            // Brown Curved Brim
            const brimGeom = new THREE.CylinderGeometry(1.4, 1.4, 0.12, 16);
            const brimMat = new THREE.MeshStandardMaterial({ color: 0x6E4720, roughness: 0.7 });
            const brim = new THREE.Mesh(brimGeom, brimMat);
            brim.position.y = 0.65;
            group.add(brim);

            // Crown Dome
            const crownGeom = new THREE.CylinderGeometry(0.75, 0.9, 0.8, 16);
            const crown = new THREE.Mesh(crownGeom, brimMat);
            crown.position.y = 1.05;
            group.add(crown);

            // Gold Sheriff Star
            const starGeom = new THREE.OctahedronGeometry(0.18, 0);
            const starMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const star = new THREE.Mesh(starGeom, starMat);
            star.position.set(0, 0.95, 0.88);
            group.add(star);

            this.player.head.add(group);
            this.currentMeshGroup = group;

        } else if (type === 'wizard') {
            // Indigo Wizard Cone Hat
            const coneGeom = new THREE.ConeGeometry(1.1, 2.2, 16);
            const coneMat = new THREE.MeshStandardMaterial({ color: 0x2C1B4D, roughness: 0.6 });
            const cone = new THREE.Mesh(coneGeom, coneMat);
            cone.position.y = 1.6;
            cone.rotation.z = -0.15; // slight jaunty angle
            group.add(cone);

            // Gold Crescent Moon Badge
            const moonGeom = new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI * 1.4);
            const moonMat = new THREE.MeshBasicMaterial({ color: 0xFFDE00 });
            const moon = new THREE.Mesh(moonGeom, moonMat);
            moon.position.set(0, 1.2, 0.85);
            moon.rotation.y = Math.PI / 2;
            group.add(moon);

            this.player.head.add(group);
            this.currentMeshGroup = group;

        } else if (type === 'snapback') {
            // Red Baseball Cap Body
            const capGeom = new THREE.SphereGeometry(0.85, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
            const capMat = new THREE.MeshStandardMaterial({ color: 0xCC1122, roughness: 0.5 });
            const cap = new THREE.Mesh(capGeom, capMat);
            cap.position.y = 0.6;
            group.add(cap);

            // White Flat Visor turned backwards
            const visorGeom = new THREE.BoxGeometry(1.1, 0.08, 0.8);
            const visorMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
            const visor = new THREE.Mesh(visorGeom, visorMat);
            visor.position.set(0, 0.6, -0.9);
            group.add(visor);

            this.player.head.add(group);
            this.currentMeshGroup = group;

        } else if (type === 'cyber') {
            // Neon Cyan Holographic Visor
            const visorGeom = new THREE.BoxGeometry(1.3, 0.35, 0.35);
            const visorMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.85 });
            const visor = new THREE.Mesh(visorGeom, visorMat);
            visor.position.set(0, 0.15, 0.72);
            group.add(visor);

            // Dual Cyber Antennas
            const antGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
            const antMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
            const a1 = new THREE.Mesh(antGeom, antMat);
            a1.position.set(-0.7, 0.7, 0);
            a1.rotation.z = 0.3;
            const a2 = new THREE.Mesh(antGeom, antMat);
            a2.position.set(0.7, 0.7, 0);
            a2.rotation.z = -0.3;
            group.add(a1, a2);

            this.player.head.add(group);
            this.currentMeshGroup = group;

        } else if (type === 'kitty') {
            // Cute Shoulder Kitty on left shoulder
            const bodyGeom = new THREE.BoxGeometry(0.6, 0.5, 0.8);
            const furMat = new THREE.MeshStandardMaterial({ color: 0xF39C12, roughness: 0.7 });
            const body = new THREE.Mesh(bodyGeom, furMat);

            const headGeom = new THREE.BoxGeometry(0.5, 0.45, 0.45);
            const head = new THREE.Mesh(headGeom, furMat);
            head.position.set(0, 0.35, 0.35);

            // Eyes
            const eyeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.04);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2ECC71 });
            const e1 = new THREE.Mesh(eyeGeom, eyeMat);
            e1.position.set(-0.14, 0.04, 0.24);
            const e2 = new THREE.Mesh(eyeGeom, eyeMat);
            e2.position.set(0.14, 0.04, 0.24);
            head.add(e1, e2);

            // Wiggling Tail
            const tailGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8);
            const tail = new THREE.Mesh(tailGeom, furMat);
            tail.position.set(0, 0.2, -0.45);
            tail.rotation.x = -0.8;
            this.tailMesh = tail;

            group.add(body, head, tail);
            group.position.set(-1.45, 1.95, 0); // Perched on left shoulder
            if (this.player.group) {
                this.player.group.add(group);
                this.currentMeshGroup = group;
            }
        }
    }

    update(dt) {
        if (!this.currentMeshGroup) return;

        this.time += dt;

        // Animate kitty tail wiggle
        if (this.tailMesh) {
            this.tailMesh.rotation.z = Math.sin(this.time * 4.0) * 0.45;
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxHeadwearManager = RobloxHeadwearManager;
}
