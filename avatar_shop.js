/**
 * Roblox Avatar Customizer & Accessories Shop
 * Manages hats, skins, faces, and cosmetic particle trails
 */
class AvatarShop {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;

        this.currentHat = 'none';
        this.currentSkin = 'noob';
        this.currentFace = 'smile';
        this.currentTrail = 'none';

        this.hatMesh = null;
        this.trailParticles = null;
        this.trailHistory = [];

        // Predefined styles
        this.skins = {
            noob: { head: 0xFFDE00, torso: 0x0D69AB, arm: 0xFFDE00, leg: 0x00A859, name: 'Classic Noob' },
            ninja: { head: 0x222222, torso: 0x111111, arm: 0x222222, leg: 0x111111, name: 'Midnight Ninja' },
            guest: { head: 0xE74C3C, torso: 0x2C3E50, arm: 0xE74C3C, leg: 0x1A252F, name: 'Guest 666' },
            gold: { head: 0xFFD700, torso: 0xDAA520, arm: 0xFFD700, leg: 0xB8860B, name: 'Golden Legend' },
            cyber: { head: 0x00FFFF, torso: 0x8E44AD, arm: 0x00FFFF, leg: 0x2C3E50, name: 'Cyber Neon' }
        };
    }

    // Apply Hat mesh to head
    equipHat(hatType) {
        this.currentHat = hatType;
        if (this.hatMesh) {
            this.player.head.remove(this.hatMesh);
            this.hatMesh = null;
        }

        if (hatType === 'tophat') {
            const group = new THREE.Group();
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.15, 16), new THREE.MeshLambertMaterial({ color: 0x111111 }));
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.4, 16), new THREE.MeshLambertMaterial({ color: 0x111111 }));
            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.87, 0.87, 0.3, 16), new THREE.MeshLambertMaterial({ color: 0xE74C3C }));
            crown.position.y = 0.7;
            band.position.y = 0.25;
            group.add(brim, crown, band);
            group.position.set(0, 0.65, 0);
            this.hatMesh = group;
            this.player.head.add(this.hatMesh);
        } else if (hatType === 'hardhat') {
            const geo = new THREE.CylinderGeometry(0.9, 1.1, 0.65, 16);
            const mat = new THREE.MeshLambertMaterial({ color: 0xF39C12 });
            const group = new THREE.Group();
            const dome = new THREE.Mesh(geo, mat);
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 16), mat);
            brim.position.y = -0.3;
            group.add(dome, brim);
            group.position.set(0, 0.75, 0);
            this.hatMesh = group;
            this.player.head.add(this.hatMesh);
        } else if (hatType === 'viking') {
            const group = new THREE.Group();
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x7F8C8D }));
            const hornGeo = new THREE.ConeGeometry(0.25, 0.9, 8);
            const hornMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
            const hornL = new THREE.Mesh(hornGeo, hornMat);
            hornL.position.set(-0.85, 0.4, 0);
            hornL.rotation.z = 0.6;
            const hornR = new THREE.Mesh(hornGeo, hornMat);
            hornR.position.set(0.85, 0.4, 0);
            hornR.rotation.z = -0.6;
            group.add(cap, hornL, hornR);
            group.position.set(0, 0.65, 0);
            this.hatMesh = group;
            this.player.head.add(this.hatMesh);
        } else if (hatType === 'headphones') {
            const group = new THREE.Group();
            const bandGeo = new THREE.TorusGeometry(0.85, 0.1, 8, 16, Math.PI);
            const band = new THREE.Mesh(bandGeo, new THREE.MeshLambertMaterial({ color: 0x111111 }));
            band.rotation.z = Math.PI;
            band.position.y = 0.5;

            const earMat = new THREE.MeshStandardMaterial({ color: 0x00FF88, emissive: 0x008844 });
            const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16), earMat);
            earL.position.set(-0.7, 0, 0);
            earL.rotation.z = Math.PI / 2;
            const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16), earMat);
            earR.position.set(0.7, 0, 0);
            earR.rotation.z = Math.PI / 2;

            group.add(band, earL, earR);
            group.position.set(0, 0.2, 0);
            this.hatMesh = group;
            this.player.head.add(this.hatMesh);
        }
    }

    // Apply color skin preset
    equipSkin(skinKey) {
        if (!this.skins[skinKey]) return;
        this.currentSkin = skinKey;
        const s = this.skins[skinKey];

        // Update body parts materials
        this.player.torso.material = new THREE.MeshLambertMaterial({ color: s.torso });
        this.player.leftArm.material = new THREE.MeshLambertMaterial({ color: s.arm });
        this.player.rightArm.material = new THREE.MeshLambertMaterial({ color: s.arm });
        this.player.leftLeg.material = new THREE.MeshLambertMaterial({ color: s.leg });
        this.player.rightLeg.material = new THREE.MeshLambertMaterial({ color: s.leg });

        // Update head side materials
        const headMats = this.player.head.material;
        if (Array.isArray(headMats)) {
            const hMat = new THREE.MeshLambertMaterial({ color: s.head });
            for (let i = 0; i < headMats.length; i++) {
                if (i !== 4) headMats[i] = hMat; // preserve face decal on front
            }
        }
    }

    // Apply Face Decal
    equipFace(faceType) {
        this.currentFace = faceType;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background head color
        const skinColor = this.skins[this.currentSkin] ? this.skins[this.currentSkin].head : 0xFFDE00;
        ctx.fillStyle = '#' + skinColor.toString(16).padStart(6, '0');
        ctx.fillRect(0, 0, 256, 256);

        if (faceType === 'smile') {
            // Classic Roblox Smile
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.ellipse(80, 95, 14, 20, 0, 0, Math.PI * 2);
            ctx.ellipse(176, 95, 14, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(84, 88, 5, 0, Math.PI * 2);
            ctx.arc(180, 88, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#111';
            ctx.beginPath();
            ctx.arc(128, 140, 52, 0.15 * Math.PI, 0.85 * Math.PI, false);
            ctx.stroke();
        } else if (faceType === 'epic') {
            // "Epic Face" smile with wide grin & tongue
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(75, 90, 18, 0, Math.PI * 2);
            ctx.arc(181, 90, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(75, 86, 7, 0, Math.PI * 2);
            ctx.arc(181, 86, 7, 0, Math.PI * 2);
            ctx.fill();
            // Huge open grin
            ctx.fillStyle = '#990000';
            ctx.beginPath();
            ctx.arc(128, 130, 60, 0, Math.PI, false);
            ctx.fill();
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#111';
            ctx.stroke();
            // Tongue
            ctx.fillStyle = '#FF5588';
            ctx.beginPath();
            ctx.arc(128, 175, 24, 0, Math.PI, true);
            ctx.fill();
        } else if (faceType === 'shades') {
            // Cool Sunglasses
            ctx.fillStyle = '#111';
            ctx.fillRect(45, 80, 70, 45);
            ctx.fillRect(141, 80, 70, 45);
            ctx.fillRect(115, 88, 26, 8);
            // Glare
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.moveTo(55, 115); ctx.lineTo(100, 85); ctx.lineTo(90, 85); ctx.lineTo(48, 115);
            ctx.fill();
            // Smirk
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(145, 160, 30, 0.1 * Math.PI, 0.6 * Math.PI, false);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        if (Array.isArray(this.player.head.material)) {
            this.player.head.material[4] = new THREE.MeshLambertMaterial({ map: tex });
        }
    }

    // Equip particle motion trail
    equipTrail(trailType) {
        this.currentTrail = trailType;
        if (this.trailParticles) {
            this.scene.remove(this.trailParticles);
            this.trailParticles = null;
        }

        if (trailType === 'none') return;

        const count = 40;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = this.player.position.x;
            positions[i * 3 + 1] = this.player.position.y;
            positions[i * 3 + 2] = this.player.position.z;

            if (trailType === 'rainbow') {
                const col = new THREE.Color().setHSL(i / count, 1, 0.5);
                colors[i * 3] = col.r;
                colors[i * 3 + 1] = col.g;
                colors[i * 3 + 2] = col.b;
            } else if (trailType === 'fire') {
                colors[i * 3] = 1;
                colors[i * 3 + 1] = (i % 2 === 0) ? 0.3 : 0.8;
                colors[i * 3 + 2] = 0;
            } else if (trailType === 'sparkle') {
                colors[i * 3] = 0;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 0.9;
            }
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const pMat = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.85
        });

        this.trailParticles = new THREE.Points(pGeo, pMat);
        this.scene.add(this.trailParticles);
        this.trailHistory = [];
    }

    update(dt) {
        if (!this.trailParticles || this.currentTrail === 'none') return;

        this.trailHistory.unshift(this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (this.trailHistory.length > 40) this.trailHistory.pop();

        const posAttr = this.trailParticles.geometry.attributes.position;
        for (let i = 0; i < this.trailHistory.length; i++) {
            const p = this.trailHistory[i];
            posAttr.setXYZ(i, p.x, p.y, p.z);
        }
        posAttr.needsUpdate = true;
    }
}

window.AvatarShop = AvatarShop;
