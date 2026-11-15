/**
 * Roblox Avatar Holographic Auras & Halo Rings
 * Adds equippable cosmetic 3D auras:
 * 1. Golden Angelic Halo (Key Z)
 * 2. Hyper Lightning Orbiters
 * 3. Void Vortex Swirl
 * 4. Glacial Frost Shards
 * 5. Inferno Flame Rings
 */
class RobloxAvatarAuras {
    constructor(scene, player, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.auraTypes = ['none', 'halo', 'lightning', 'void', 'frost', 'fire'];
        this.auraLabels = {
            none: 'None (Clean)',
            halo: '🌟 Golden Angelic Halo',
            lightning: '⚡ Hyper Lightning Orbiters',
            void: '🌌 Cosmic Void Vortex',
            frost: '❄️ Glacial Frost Shards',
            fire: '🔥 Inferno Flame Rings'
        };

        const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem('roblox_equipped_aura') : null;
        this.currentIndex = this.auraTypes.indexOf(saved);
        if (this.currentIndex < 0) this.currentIndex = 1; // Default to Golden Halo

        this.auraGroup = null;
        this.orbiters = [];
        this.time = 0;

        if (typeof THREE !== 'undefined' && this.scene) {
            this.initAuraMesh();
        }

        this.bindEvents();
    }

    initAuraMesh() {
        this.auraGroup = new THREE.Group();
        this.scene.add(this.auraGroup);
        this.applyAura(this.auraTypes[this.currentIndex]);
    }

    bindEvents() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused && this.ui.isChatFocused()) return;
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (e.code === 'KeyZ') {
                this.cycleAura();
            }
        });
    }

    cycleAura() {
        this.currentIndex = (this.currentIndex + 1) % this.auraTypes.length;
        const currentType = this.auraTypes[this.currentIndex];
        try {
            localStorage.setItem('roblox_equipped_aura', currentType);
        } catch (e) {}

        this.applyAura(currentType);

        if (this.sound && this.sound.playClick) {
            this.sound.playClick();
        }
        if (this.ui && this.ui.showToastBanner) {
            this.ui.showToastBanner(`Aura: ${this.auraLabels[currentType] || currentType}`);
        }
    }

    clearCurrentAura() {
        if (!this.auraGroup) return;
        while (this.auraGroup.children.length > 0) {
            const child = this.auraGroup.children[0];
            this.auraGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }
        this.orbiters = [];
    }

    applyAura(type) {
        if (typeof THREE === 'undefined' || !this.auraGroup) return;
        this.clearCurrentAura();

        if (type === 'none') {
            this.auraGroup.visible = false;
            return;
        }

        this.auraGroup.visible = true;

        if (type === 'halo') {
            // Golden Torus Halo hovering above head
            const haloGeom = new THREE.TorusGeometry(0.85, 0.08, 12, 32);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0xFFD700,
                transparent: true,
                opacity: 0.85
            });
            const halo = new THREE.Mesh(haloGeom, haloMat);
            halo.rotation.x = Math.PI / 2;
            halo.position.y = 4.2;
            this.auraGroup.add(halo);
            this.orbiters.push({ mesh: halo, type: 'halo' });

        } else if (type === 'lightning') {
            // 3 Fast Revolving Electric Blue Plasma Spheres
            const orbGeom = new THREE.SphereGeometry(0.24, 12, 12);
            const orbMat = new THREE.MeshBasicMaterial({
                color: 0x00F0FF,
                transparent: true,
                opacity: 0.95
            });
            for (let i = 0; i < 3; i++) {
                const orb = new THREE.Mesh(orbGeom, orbMat);
                this.auraGroup.add(orb);
                this.orbiters.push({ mesh: orb, type: 'orb', offsetAngle: (i / 3) * Math.PI * 2, radius: 2.2, height: 2.2 });
            }

        } else if (type === 'void') {
            // Swirling Purple/Magenta Ground Vortex Ring
            const ringGeom = new THREE.RingGeometry(1.6, 2.5, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x9B59B6,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.65
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.1;
            this.auraGroup.add(ring);
            this.orbiters.push({ mesh: ring, type: 'spin_y' });

        } else if (type === 'frost') {
            // 4 Orbiting Ice Diamond Shards
            const shardGeom = new THREE.OctahedronGeometry(0.28, 0);
            const shardMat = new THREE.MeshBasicMaterial({
                color: 0x70E0FF,
                wireframe: true,
                transparent: true,
                opacity: 0.85
            });
            for (let i = 0; i < 4; i++) {
                const shard = new THREE.Mesh(shardGeom, shardMat);
                this.auraGroup.add(shard);
                this.orbiters.push({ mesh: shard, type: 'orb', offsetAngle: (i / 4) * Math.PI * 2, radius: 2.5, height: 1.8 });
            }

        } else if (type === 'fire') {
            // Dual Counter-Rotating Fiery Torus Rings
            const ringGeom = new THREE.TorusGeometry(1.9, 0.08, 8, 32);
            const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xFF4500, transparent: true, opacity: 0.75 });
            const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xFFA500, transparent: true, opacity: 0.65 });
            const r1 = new THREE.Mesh(ringGeom, ringMat1);
            const r2 = new THREE.Mesh(ringGeom, ringMat2);
            r1.rotation.x = Math.PI / 2.8;
            r2.rotation.x = -Math.PI / 2.8;
            r1.position.y = 1.8;
            r2.position.y = 1.8;
            this.auraGroup.add(r1, r2);
            this.orbiters.push({ mesh: r1, type: 'spin_cw' }, { mesh: r2, type: 'spin_ccw' });
        }
    }

    update(dt) {
        if (!this.player || !this.player.position || !this.auraGroup || !this.auraGroup.visible) return;

        this.time += dt;
        this.auraGroup.position.copy(this.player.position);

        for (const item of this.orbiters) {
            if (item.type === 'halo') {
                item.mesh.position.y = 4.2 + Math.sin(this.time * 3.0) * 0.12;
                item.mesh.rotation.z += dt * 1.5;
            } else if (item.type === 'orb') {
                const angle = this.time * 3.5 + item.offsetAngle;
                item.mesh.position.x = Math.cos(angle) * item.radius;
                item.mesh.position.z = Math.sin(angle) * item.radius;
                item.mesh.position.y = item.height + Math.sin(this.time * 4.0 + item.offsetAngle) * 0.4;
            } else if (item.type === 'spin_y') {
                item.mesh.rotation.z += dt * 2.5;
            } else if (item.type === 'spin_cw') {
                item.mesh.rotation.z += dt * 3.0;
            } else if (item.type === 'spin_ccw') {
                item.mesh.rotation.z -= dt * 3.0;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxAvatarAuras = RobloxAvatarAuras;
}
