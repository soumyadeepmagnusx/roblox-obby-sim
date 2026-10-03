/**
 * Roblox Pets & Egg Hatching System
 * Features:
 * - 3D Bobbing Pets with Spring Follow Physics
 * - 4 Iconic Pets: Neon Doge, Cosmic Dragon, Golden Dominus, Pixel Kitty
 * - 3D Egg Pedestal at Spawn with dynamic hatch animation & rarities
 * - Stat multipliers (Coins, Jump, Speed)
 */
class RobloxPetManager {
    constructor(player, scene, particleEngine, sound, ui) {
        this.player = player;
        this.scene = scene;
        this.particleEngine = particleEngine;
        this.sound = sound;
        this.ui = ui;

        this.equippedPet = null;
        this.petMesh = null;
        this.petTargetPos = new THREE.Vector3();
        this.bobTime = 0;

        // Inventory: petId -> count/unlocked
        this.unlockedPets = JSON.parse(localStorage.getItem('roblox_pets') || '["doge"]');
        this.activePetId = localStorage.getItem('roblox_active_pet') || 'doge';

        // Pet Catalog
        this.PETS = {
            'doge': {
                name: 'Neon Doge',
                rarity: 'Common',
                color: 0xF1C40F,
                coinMulti: 1.25,
                jumpMulti: 1.0,
                speedMulti: 1.0,
                desc: '+25% Extra Gold Coins'
            },
            'kitty': {
                name: 'Pixel Kitty',
                rarity: 'Rare',
                color: 0xFF69B4,
                coinMulti: 1.35,
                jumpMulti: 1.0,
                speedMulti: 1.1,
                desc: '+35% Coins, +10% Speed'
            },
            'dragon': {
                name: 'Cosmic Dragon',
                rarity: 'Epic',
                color: 0x9B59B6,
                coinMulti: 1.5,
                jumpMulti: 1.25,
                speedMulti: 1.1,
                desc: '+50% Coins, +25% Super Jump'
            },
            'dominus': {
                name: 'Golden Dominus',
                rarity: 'Legendary',
                color: 0xF39C12,
                coinMulti: 2.0,
                jumpMulti: 1.3,
                speedMulti: 1.3,
                desc: '2x Gold, +30% Speed & Jump!'
            }
        };

        this.createEggPedestal();
        if (this.activePetId && this.PETS[this.activePetId]) {
            this.equipPet(this.activePetId, false);
        }
    }

    createEggPedestal() {
        // 3D Egg Pedestal at Spawn Point (x: 0, y: 1, z: 12)
        this.pedestalGroup = new THREE.Group();
        this.pedestalGroup.position.set(0, 0, 14);

        // Stone Base
        const baseGeom = new THREE.CylinderGeometry(2.5, 2.8, 0.6, 16);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.3;
        this.pedestalGroup.add(base);

        // Glowing Rune Ring
        const ringGeom = new THREE.TorusGeometry(2.2, 0.08, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.62;
        this.pedestalGroup.add(ring);

        // Giant Golden Mystery Egg
        const eggGeom = new THREE.SphereGeometry(1.2, 16, 16);
        eggGeom.scale(1.0, 1.45, 1.0);
        const eggMat = new THREE.MeshStandardMaterial({
            color: 0xF1C40F,
            metalness: 0.6,
            roughness: 0.2
        });
        this.eggMesh = new THREE.Mesh(eggGeom, eggMat);
        this.eggMesh.position.y = 2.4;
        this.pedestalGroup.add(this.eggMesh);

        // Overhead Billboard Text
        this.createEggBillboard();

        this.scene.add(this.pedestalGroup);
    }

    createEggBillboard() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 122);

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('🥚 MYSTERY PET EGG', 256, 50);

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('COST: 50 COINS [CLICK / E]', 256, 95);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(0, 4.8, 0);
        sprite.scale.set(5.5, 1.4, 1);
        this.pedestalGroup.add(sprite);
    }

    buildPetMesh(type) {
        const group = new THREE.Group();
        const info = this.PETS[type];

        if (type === 'doge') {
            // Doge Cube Body
            const bodyGeom = new THREE.BoxGeometry(0.9, 0.9, 1.1);
            const bodyMat = new THREE.MeshLambertMaterial({ color: 0xF1C40F });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            group.add(body);

            // Snout
            const snoutGeom = new THREE.BoxGeometry(0.5, 0.35, 0.4);
            const snoutMat = new THREE.MeshLambertMaterial({ color: 0xFFEAA7 });
            const snout = new THREE.Mesh(snoutGeom, snoutMat);
            snout.position.set(0, -0.15, -0.65);
            group.add(snout);

            // Nose
            const noseGeom = new THREE.BoxGeometry(0.18, 0.12, 0.1);
            const noseMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
            const nose = new THREE.Mesh(noseGeom, noseMat);
            nose.position.set(0, -0.05, -0.87);
            group.add(nose);

            // Ears
            const earGeom = new THREE.ConeGeometry(0.2, 0.4, 4);
            const earMat = new THREE.MeshLambertMaterial({ color: 0xD4AC0D });
            const leftEar = new THREE.Mesh(earGeom, earMat);
            leftEar.position.set(-0.35, 0.6, -0.2);
            const rightEar = leftEar.clone();
            rightEar.position.x = 0.35;
            group.add(leftEar);
            group.add(rightEar);

            // Tail
            const tailGeom = new THREE.BoxGeometry(0.15, 0.3, 0.15);
            const tail = new THREE.Mesh(tailGeom, earMat);
            tail.position.set(0, 0.3, 0.6);
            tail.rotation.x = 0.5;
            group.add(tail);

        } else if (type === 'kitty') {
            // Kitty Body
            const bodyGeom = new THREE.BoxGeometry(0.85, 0.85, 1.0);
            const bodyMat = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            group.add(body);

            // Ears
            const earGeom = new THREE.ConeGeometry(0.22, 0.4, 4);
            const earMat = new THREE.MeshLambertMaterial({ color: 0xFF1493 });
            const leftEar = new THREE.Mesh(earGeom, earMat);
            leftEar.position.set(-0.3, 0.55, -0.2);
            const rightEar = leftEar.clone();
            rightEar.position.x = 0.3;
            group.add(leftEar);
            group.add(rightEar);

            // Heart Bow
            const bowGeom = new THREE.BoxGeometry(0.3, 0.2, 0.1);
            const bowMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const bow = new THREE.Mesh(bowGeom, bowMat);
            bow.position.set(0, 0.35, -0.52);
            group.add(bow);

        } else if (type === 'dragon') {
            // Dragon Body
            const bodyGeom = new THREE.BoxGeometry(1.0, 1.0, 1.3);
            const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8E44AD });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            group.add(body);

            // Horns
            const hornGeom = new THREE.ConeGeometry(0.15, 0.5, 4);
            const hornMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
            const leftHorn = new THREE.Mesh(hornGeom, hornMat);
            leftHorn.position.set(-0.35, 0.65, -0.3);
            leftHorn.rotation.x = -0.4;
            const rightHorn = leftHorn.clone();
            rightHorn.position.x = 0.35;
            group.add(leftHorn);
            group.add(rightHorn);

            // Wings
            const wingGeom = new THREE.BoxGeometry(0.8, 0.06, 0.5);
            const wingMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF, side: THREE.DoubleSide });
            const leftWing = new THREE.Mesh(wingGeom, wingMat);
            leftWing.position.set(-0.8, 0.3, 0);
            leftWing.rotation.z = 0.3;
            const rightWing = leftWing.clone();
            rightWing.position.x = 0.8;
            rightWing.rotation.z = -0.3;
            group.add(leftWing);
            group.add(rightWing);
            group.userData.leftWing = leftWing;
            group.userData.rightWing = rightWing;

        } else if (type === 'dominus') {
            // Legendary Golden Dominus Hood
            const hoodGeom = new THREE.BoxGeometry(1.1, 1.1, 1.1);
            const hoodMat = new THREE.MeshLambertMaterial({ color: 0xF39C12 });
            const hood = new THREE.Mesh(hoodGeom, hoodMat);
            group.add(hood);

            // Shadow Face & Glowing Golden Eyes
            const faceGeom = new THREE.BoxGeometry(0.8, 0.8, 0.1);
            const faceMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const face = new THREE.Mesh(faceGeom, faceMat);
            face.position.set(0, 0, -0.56);
            group.add(face);

            const eyeGeom = new THREE.BoxGeometry(0.18, 0.12, 0.05);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
            leftEye.position.set(-0.2, 0.1, -0.62);
            const rightEye = leftEye.clone();
            rightEye.position.x = 0.2;
            group.add(leftEye);
            group.add(rightEye);

            // Angel Wings
            const wingGeom = new THREE.BoxGeometry(1.2, 0.08, 0.6);
            const wingMat = new THREE.MeshBasicMaterial({ color: 0xFFEE55 });
            const leftWing = new THREE.Mesh(wingGeom, wingMat);
            leftWing.position.set(-1.0, 0.4, 0.2);
            leftWing.rotation.z = 0.4;
            const rightWing = leftWing.clone();
            rightWing.position.x = 1.0;
            rightWing.rotation.z = -0.4;
            group.add(leftWing);
            group.add(rightWing);
        }

        return group;
    }

    equipPet(type, announce = true) {
        if (!this.PETS[type]) return;

        // Remove old pet mesh
        if (this.petMesh) {
            this.scene.remove(this.petMesh);
            this.petMesh = null;
        }

        this.activePetId = type;
        localStorage.setItem('roblox_active_pet', type);

        this.petMesh = this.buildPetMesh(type);
        this.petTargetPos.copy(this.player.position);
        this.scene.add(this.petMesh);

        const info = this.PETS[type];
        if (announce) {
            this.sound.playCoin();
            this.ui.addChatMessage('Pet Shop', `🐾 Equipped ${info.name}! [${info.desc}]`, '#00FF88');
        }

        // Apply Pet buffs
        if (this.player) {
            this.player.petCoinMulti = info.coinMulti;
            this.player.jumpMultiplier = info.jumpMulti;
        }
    }

    hatchEgg(collectibles) {
        if (!collectibles || collectibles.coins < 50) {
            this.sound.playOof();
            this.ui.addChatMessage('Pet Shop', '❌ Not enough coins! Mystery Egg costs 50 Coins.', '#FF3333');
            return;
        }

        // Deduct 50 coins
        collectibles.addCoins(-50);

        // Roll Pet Rarity:
        // Doge: 50%, Kitty: 30%, Dragon: 15%, Dominus: 5%
        const rand = Math.random() * 100;
        let petId = 'doge';
        if (rand < 5) petId = 'dominus';
        else if (rand < 20) petId = 'dragon';
        else if (rand < 50) petId = 'kitty';

        const info = this.PETS[petId];

        // Egg Hatch Animation
        this.sound.playPowerup();
        this.particleEngine.spawnConfetti(this.pedestalGroup.position);

        if (!this.unlockedPets.includes(petId)) {
            this.unlockedPets.push(petId);
            localStorage.setItem('roblox_pets', JSON.stringify(this.unlockedPets));
        }

        this.equipPet(petId, false);
        this.ui.showToastBanner(`🎉 HATCHED ${info.rarity.toUpperCase()} PET: ${info.name}!`);
        this.ui.addChatMessage('System', `🌟 Hatched a ${info.rarity} [${info.name}]! (${info.desc})`, '#FFD700');
    }

    update(dt) {
        this.bobTime += dt * 3.5;

        // 1. Idle rotation on Spawn Pedestal Egg
        if (this.eggMesh) {
            this.eggMesh.rotation.y += dt * 0.8;
            this.eggMesh.position.y = 2.4 + Math.sin(this.bobTime * 0.6) * 0.2;
        }

        // 2. Active Pet Spring Follow Physics
        if (this.petMesh && this.player && this.player.position) {
            const facing = (this.player.facingAngle !== undefined) ? this.player.facingAngle : (this.player.group ? this.player.group.rotation.y : 0);

            // Target position: Hover over right shoulder
            const shoulderOffset = new THREE.Vector3(1.8, 1.2, 1.2);
            shoulderOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), facing);
            const target = this.player.position.clone().add(shoulderOffset);

            // Add cute vertical bobbing
            target.y += Math.sin(this.bobTime) * 0.25;

            // Spring interpolation
            this.petMesh.position.lerp(target, 8 * dt);

            // Look towards player direction
            this.petMesh.rotation.y = THREE.MathUtils.lerp(this.petMesh.rotation.y, facing, 6 * dt);

            // Dragon wings flapping animation
            if (this.petMesh.userData && this.petMesh.userData.leftWing) {
                const flap = Math.sin(this.bobTime * 4) * 0.4;
                this.petMesh.userData.leftWing.rotation.z = 0.3 + flap;
                this.petMesh.userData.rightWing.rotation.z = -0.3 - flap;
            }
        }
    }
}
