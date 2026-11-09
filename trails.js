/**
 * Roblox Avatar Trail & Particle Aura System
 * Features:
 * - 5 Vibrant Cosmetic Avatar Trails (Rainbow, Blaze Inferno, Neon Cyber, Cosmic Stardust, Midas Gold)
 * - Dynamic 3D Ribbon / Particle trail rendering following avatar movement
 * - Persistent equipped trail state in localStorage
 * - In-game Trail Wardrobe Modal with instant equip
 */
class RobloxTrails {
    constructor(scene, player, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.trailCatalog = [
            { id: 'none', name: 'None (Default)', desc: 'No cosmetic trail.', color: '#888', icon: '⚪', price: 0 },
            { id: 'rainbow', name: 'Rainbow Ribbon', desc: 'Flowing vibrant multi-colored spectrum.', color: '#FF3366', icon: '🌈', price: 50 },
            { id: 'fire', name: 'Blaze Inferno', desc: 'Fiery flames and embers bursting from feet.', color: '#FF5500', icon: '🔥', price: 80 },
            { id: 'electric', name: 'Neon Cyber', desc: 'High-voltage electric cyan lightning sparks.', color: '#00FFFF', icon: '⚡', price: 100 },
            { id: 'stardust', name: 'Cosmic Stardust', desc: 'Shimmering celestial purple starlight.', color: '#9B59B6', icon: '✨', price: 120 },
            { id: 'gold', name: 'Midas Gold', desc: 'Golden coin shimmer and royal aura.', color: '#FFD700', icon: '👑', price: 150 }
        ];

        this.activeTrailId = localStorage.getItem('roblox_active_trail') || 'none';
        this.history = [];
        this.maxHistory = 24;
        this.meshGroup = new THREE.Group();
        this.scene.add(this.meshGroup);

        this.rainbowColors = [
            0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3
        ];
        this.colorStep = 0;

        this.renderTrailsModal();
    }

    setTrail(id) {
        const item = this.trailCatalog.find(t => t.id === id);
        if (!item) return;

        this.activeTrailId = id;
        localStorage.setItem('roblox_active_trail', id);
        this.clearMeshes();

        if (this.sound) this.sound.playCoin();
        if (this.ui) {
            this.ui.showToastBanner(`✨ Trail Equipped: ${item.name}!`);
            this.ui.addChatMessage('Wardrobe', `✨ Equipped ${item.name} Trail!`, item.color);
        }

        this.renderTrailsModal();
    }

    clearMeshes() {
        while (this.meshGroup.children.length > 0) {
            const obj = this.meshGroup.children[0];
            this.meshGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
        this.history = [];
    }

    update(dt) {
        if (this.activeTrailId === 'none') {
            if (this.meshGroup.children.length > 0) this.clearMeshes();
            return;
        }

        const playerPos = this.player.position;
        const vel = this.player.velocity;
        const speed = Math.hypot(vel.x, vel.z);

        // Add history point when avatar is moving or in mid-air
        if (speed > 1.0 || Math.abs(vel.y) > 2.0) {
            this.history.unshift({
                x: playerPos.x,
                y: playerPos.y + 0.4,
                z: playerPos.z,
                age: 0
            });
        }

        // Age existing trail points
        for (let i = this.history.length - 1; i >= 0; i--) {
            this.history[i].age += dt * 3.2;
            if (this.history[i].age >= 1.0) {
                this.history.splice(i, 1);
            }
        }

        if (this.history.length > this.maxHistory) {
            this.history.length = this.maxHistory;
        }

        this.renderTrailGeometry();
    }

    renderTrailGeometry() {
        // Clear previous visual segments
        while (this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children[0];
            this.meshGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }

        if (this.history.length < 2) return;

        this.colorStep = (this.colorStep + 0.05) % this.rainbowColors.length;

        // Build continuous tapered segments
        for (let i = 0; i < this.history.length - 1; i++) {
            const p1 = this.history[i];
            const p2 = this.history[i + 1];
            const alpha = 1.0 - (i / this.history.length);
            const width = Math.max(0.1, 0.7 * alpha);

            let segmentColor = 0xFFFFFF;
            if (this.activeTrailId === 'rainbow') {
                const colorIdx = Math.floor((i + this.colorStep) % this.rainbowColors.length);
                segmentColor = this.rainbowColors[colorIdx];
            } else if (this.activeTrailId === 'fire') {
                segmentColor = i % 2 === 0 ? 0xFF3300 : 0xFFCC00;
            } else if (this.activeTrailId === 'electric') {
                segmentColor = i % 2 === 0 ? 0x00FFFF : 0x0088FF;
            } else if (this.activeTrailId === 'stardust') {
                segmentColor = i % 2 === 0 ? 0x9B59B6 : 0xFF00FF;
            } else if (this.activeTrailId === 'gold') {
                segmentColor = 0xFFD700;
            }

            const geom = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                p1.x, p1.y - width, p1.z,
                p1.x, p1.y + width, p1.z,
                p2.x, p2.y - width * 0.8, p2.z,

                p1.x, p1.y + width, p1.z,
                p2.x, p2.y + width * 0.8, p2.z,
                p2.x, p2.y - width * 0.8, p2.z
            ]);
            geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

            const mat = new THREE.MeshBasicMaterial({
                color: segmentColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: alpha * 0.75,
                depthWrite: false
            });

            const mesh = new THREE.Mesh(geom, mat);
            this.meshGroup.add(mesh);
        }
    }

    renderTrailsModal() {
        const grid = document.getElementById('trails-modal-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.trailCatalog.forEach(trail => {
            const isEquipped = this.activeTrailId === trail.id;
            const card = document.createElement('div');
            card.style.cssText = `
                background: ${isEquipped ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                border: 2px solid ${isEquipped ? '#00FF88' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 10px;
                padding: 12px;
                text-align: center;
                cursor: pointer;
                transition: transform 0.15s ease, border-color 0.15s ease;
            `;

            card.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 4px;">${trail.icon}</div>
                <div style="font-size: 13px; font-weight: bold; color: ${trail.color};">${trail.name}</div>
                <div style="font-size: 11px; color: #AAA; margin: 4px 0;">${trail.desc}</div>
                <button class="tool-chip" style="width: 100%; margin-top: 6px; background: ${isEquipped ? '#00FF88' : 'rgba(255,255,255,0.1)'}; color: ${isEquipped ? '#000' : '#FFF'}; font-weight: bold;">
                    ${isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
            `;

            card.addEventListener('click', () => {
                this.setTrail(trail.id);
            });

            grid.appendChild(card);
        });
    }

    openModal() {
        const modal = document.getElementById('trails-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderTrailsModal();
        }
    }

    closeModal() {
        const modal = document.getElementById('trails-modal');
        if (modal) modal.style.display = 'none';
    }
}
