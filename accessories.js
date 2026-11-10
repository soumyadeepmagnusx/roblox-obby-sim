/**
 * Roblox Avatar Accessories & Cosmetic Wardrobe
 * Adds 3D wearable accessories (Fedora Hat, Golden Crown, Cyber Wings,
 * Dual Ninja Katanas, DJ Headphones) that attach dynamically to the player avatar rig.
 */
class RobloxAccessoryManager {
    constructor(scene, player, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.accessories = [
            { id: 'fedora', name: '🎩 Classic Noir Fedora', slot: 'head', desc: 'The quintessential retro Roblox fedora with silk ribbon.', icon: '🎩' },
            { id: 'crown', name: '👑 Golden King Crown', slot: 'head', desc: 'Radiant golden royal crown encrusted with ruby gems.', icon: '👑' },
            { id: 'headphones', name: '🎧 Cyberpunk DJ Headphones', slot: 'head', desc: 'Over-ear neon audio headphones with bass lights.', icon: '🎧' },
            { id: 'wings', name: '🪽 Celestial Angel Wings', slot: 'back', desc: 'Feathered angelic wings that flutter as you leap.', icon: '🪽' },
            { id: 'katanas', name: '⚔️ Dual Ninja Katanas', slot: 'back', desc: 'Twin crossed samurai steel swords mounted on back.', icon: '⚔️' }
        ];

        this.equipped = JSON.parse(localStorage.getItem('roblox_equipped_accessories') || '{"head":"fedora","back":"wings"}');
        this.meshInstances = {};

        this.initAccessories();
        this.initDOM();
        this.initKeyListeners();
    }

    initAccessories() {
        if (!this.player || !this.player.group) return;

        // Find or create attachment points on player
        this.headNode = this.player.head || this.player.group;
        this.torsoNode = this.player.torso || this.player.group;

        // Build 3D accessory meshes
        this.buildFedora();
        this.buildCrown();
        this.buildHeadphones();
        this.buildWings();
        this.buildKatanas();

        // Apply saved equips
        this.applyEquipped();
    }

    buildFedora() {
        const group = new THREE.Group();
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xEEEEEE });

        // Brim
        const brimGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.1, 24);
        const brim = new THREE.Mesh(brimGeo, blackMat);
        group.add(brim);

        // Crown/Dome
        const domeGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.7, 24);
        const dome = new THREE.Mesh(domeGeo, blackMat);
        dome.position.y = 0.35;
        group.add(dome);

        // White Ribbon
        const ribbonGeo = new THREE.CylinderGeometry(0.96, 0.96, 0.15, 24);
        const ribbon = new THREE.Mesh(ribbonGeo, whiteMat);
        ribbon.position.y = 0.15;
        group.add(ribbon);

        group.position.set(0, 0.95, 0);
        group.visible = false;
        this.headNode.add(group);
        this.meshInstances['fedora'] = group;
    }

    buildCrown() {
        const group = new THREE.Group();
        const goldMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const rubyMat = new THREE.MeshBasicMaterial({ color: 0xFF1744 });

        // Crown circlet
        const ringGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.4, 16, 1, true);
        const ring = new THREE.Mesh(ringGeo, goldMat);
        group.add(ring);

        // Crown spikes
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const spikeGeo = new THREE.ConeGeometry(0.2, 0.5, 4);
            const spike = new THREE.Mesh(spikeGeo, goldMat);
            spike.position.set(Math.sin(angle) * 0.9, 0.45, Math.cos(angle) * 0.9);
            group.add(spike);

            // Ruby gem on front spike
            if (i === 0) {
                const gem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15), rubyMat);
                gem.position.set(Math.sin(angle) * 0.95, 0.25, Math.cos(angle) * 0.95);
                group.add(gem);
            }
        }

        group.position.set(0, 1.0, 0);
        group.visible = false;
        this.headNode.add(group);
        this.meshInstances['crown'] = group;
    }

    buildHeadphones() {
        const group = new THREE.Group();
        const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

        // Headband arch
        const bandGeo = new THREE.TorusGeometry(0.95, 0.08, 8, 24, Math.PI);
        const band = new THREE.Mesh(bandGeo, darkMat);
        band.rotation.z = Math.PI;
        group.add(band);

        // Ear cups
        const cupGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 16);
        const leftCup = new THREE.Mesh(cupGeo, cyanMat);
        leftCup.rotation.z = Math.PI / 2;
        leftCup.position.set(-0.95, 0, 0);

        const rightCup = new THREE.Mesh(cupGeo, cyanMat);
        rightCup.rotation.z = Math.PI / 2;
        rightCup.position.set(0.95, 0, 0);

        group.add(leftCup);
        group.add(rightCup);

        group.position.set(0, 0.4, 0);
        group.visible = false;
        this.headNode.add(group);
        this.meshInstances['headphones'] = group;
    }

    buildWings() {
        const group = new THREE.Group();
        const wingMat = new THREE.MeshBasicMaterial({
            color: 0x00FFCC,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });

        // Left wing panel
        const leftWing = new THREE.Group();
        const feather1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.08), wingMat);
        feather1.position.set(-0.9, 0.5, 0);
        feather1.rotation.z = 0.3;
        const feather2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.08), wingMat);
        feather2.position.set(-0.8, 0.1, 0);
        feather2.rotation.z = 0.1;
        leftWing.add(feather1);
        leftWing.add(feather2);
        leftWing.position.set(-0.6, 0.5, -0.6);

        // Right wing panel
        const rightWing = leftWing.clone();
        rightWing.scale.x = -1;
        rightWing.position.set(0.6, 0.5, -0.6);

        group.add(leftWing);
        group.add(rightWing);
        group.visible = false;

        this.leftWing = leftWing;
        this.rightWing = rightWing;

        this.torsoNode.add(group);
        this.meshInstances['wings'] = group;
    }

    buildKatanas() {
        const group = new THREE.Group();
        const scabbardMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const hiltMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const wrapMat = new THREE.MeshLambertMaterial({ color: 0xE74C3C });

        // Katana 1 (diagonal across back)
        const k1 = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.06), scabbardMat);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.25), hiltMat);
        guard.position.y = 0.9;
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.08), wrapMat);
        hilt.position.y = 1.3;
        k1.add(blade);
        k1.add(guard);
        k1.add(hilt);
        k1.rotation.z = 0.6;
        k1.position.set(-0.1, 0.2, -0.6);

        // Katana 2 (crossing other direction)
        const k2 = k1.clone();
        k2.rotation.z = -0.6;

        group.add(k1);
        group.add(k2);
        group.visible = false;

        this.torsoNode.add(group);
        this.meshInstances['katanas'] = group;
    }

    applyEquipped() {
        // Hide all first
        Object.keys(this.meshInstances).forEach(id => {
            this.meshInstances[id].visible = false;
        });

        // Show equipped
        if (this.equipped.head && this.meshInstances[this.equipped.head]) {
            this.meshInstances[this.equipped.head].visible = true;
        }
        if (this.equipped.back && this.meshInstances[this.equipped.back]) {
            this.meshInstances[this.equipped.back].visible = true;
        }
    }

    toggleEquip(id) {
        const item = this.accessories.find(a => a.id === id);
        if (!item) return;

        if (this.equipped[item.slot] === id) {
            // Unequip
            this.equipped[item.slot] = null;
        } else {
            // Equip
            this.equipped[item.slot] = id;
            if (this.sound) this.sound.playCoin();
        }

        localStorage.setItem('roblox_equipped_accessories', JSON.stringify(this.equipped));
        this.applyEquipped();
        this.renderWardrobe();

        if (this.ui) {
            this.ui.showToastBanner(`🎩 Wardrobe: ${this.equipped[item.slot] ? 'Equipped ' + item.name : 'Unequipped ' + item.name}`);
        }
    }

    update(dt) {
        // Animate fluttering wings
        if (this.leftWing && this.rightWing && this.meshInstances['wings'] && this.meshInstances['wings'].visible) {
            const flap = Math.sin(Date.now() * 0.008) * 0.35;
            this.leftWing.rotation.y = flap;
            this.rightWing.rotation.y = -flap;
        }
    }

    initDOM() {
        const modal = document.createElement('div');
        modal.id = 'accessories-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 125;
            align-items: center;
            justify-content: center;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 520px;
            max-width: 92%;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #FF007F;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            gap: 16px;
            color: #FFFFFF;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                <div style="font-size:20px; font-weight:800; color:#FF007F; display:flex; align-items:center; gap:8px;">
                    🎩 <span>AVATAR COSMETIC WARDROBE</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.accessories.toggleModal()">✕</span>
            </div>
            <div style="font-size:13px; color:#CCC;">
                Customize your blocky 3D avatar with hats, wings, royal crowns, and ninja katanas!
            </div>
            <div id="accessories-list" style="display:flex; flex-direction:column; gap:10px;"></div>
            <button class="menu-btn primary" onclick="window.game.accessories.toggleModal()" style="width:100%; padding:12px; font-weight:bold; background:#FF007F; color:#FFF; border:none; border-radius:8px; cursor:pointer;">
                Done
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;
        this.renderWardrobe();
    }

    renderWardrobe() {
        const list = document.getElementById('accessories-list');
        if (!list) return;

        list.innerHTML = '';
        this.accessories.forEach(a => {
            const isEquipped = this.equipped[a.slot] === a.id;

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: ${isEquipped ? 'rgba(255, 0, 127, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${isEquipped ? '#FF007F' : 'rgba(255,255,255,0.12)'};
                padding: 12px 16px;
                border-radius: 10px;
            `;

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-size:28px;">${a.icon}</div>
                    <div>
                        <div style="font-weight:bold; font-size:15px; color:#FFF;">${a.name}</div>
                        <div style="font-size:11px; color:#AAA; margin-top:2px;">Slot: ${a.slot.toUpperCase()} • ${a.desc}</div>
                    </div>
                </div>
                <button style="
                    padding: 8px 18px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: bold;
                    cursor: pointer;
                    background: ${isEquipped ? '#FF007F' : 'rgba(255,255,255,0.15)'};
                    color: #FFF;
                    border: none;
                ">
                    ${isEquipped ? 'EQUIPPED ✓' : 'EQUIP'}
                </button>
            `;

            item.querySelector('button').addEventListener('click', () => {
                this.toggleEquip(a.id);
            });

            list.appendChild(item);
        });
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'u' || e.key === 'U') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.toggleModal();
            }
        });
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) this.renderWardrobe();
    }
}

window.RobloxAccessoryManager = RobloxAccessoryManager;
