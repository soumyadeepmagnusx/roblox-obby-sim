/**
 * Roblox World Engine
 * Builds the 3D Obby Course, stages, moving hazards, AABB collisions & collectibles
 */
class RobloxWorld {
    constructor(scene, soundEngine) {
        this.scene = scene;
        this.sound = soundEngine;

        // Static solid collision boxes
        this.colliders = [];
        // Interactive / Dynamic elements
        this.hazardBlocks = []; // Lava / Killbricks
        this.bouncePads = [];   // Trampolines
        this.boostPads = [];    // Speed boost strips
        this.movingPlatforms = [];
        this.spinningHazards = [];
        this.disappearingBlocks = [];
        this.coins = [];
        this.checkpoints = [];

        // Particles for victory / celebration
        this.confettiParticles = null;

        // Materials cache
        this.initMaterials();

        // Build the entire Obby level
        this.buildObby();
    }

    initMaterials() {
        // Procedural stud / grid canvas texture for classic Roblox block feel
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(64, 64, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(60, 60, 26, 0, Math.PI * 2);
        ctx.fill();
        const studTex = new THREE.CanvasTexture(canvas);
        studTex.wrapS = THREE.RepeatWrapping;
        studTex.wrapT = THREE.RepeatWrapping;

        this.mats = {
            stud: new THREE.MeshLambertMaterial({ map: studTex }),
            grass: new THREE.MeshLambertMaterial({ color: 0x48B02C }),
            stone: new THREE.MeshLambertMaterial({ color: 0x7F8C8D }),
            darkStone: new THREE.MeshLambertMaterial({ color: 0x34495E }),
            wood: new THREE.MeshLambertMaterial({ color: 0xA0522D }),
            gold: new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 }),
            lava: new THREE.MeshStandardMaterial({
                color: 0xFF1100,
                emissive: 0xEE2200,
                emissiveIntensity: 0.7,
                roughness: 0.2
            }),
            bounce: new THREE.MeshStandardMaterial({
                color: 0xFFDD00,
                emissive: 0xAA9900,
                emissiveIntensity: 0.6
            }),
            boost: new THREE.MeshStandardMaterial({
                color: 0x00F0FF,
                emissive: 0x0088CC,
                emissiveIntensity: 0.8
            }),
            checkpointInactive: new THREE.MeshStandardMaterial({
                color: 0x888888,
                emissive: 0x222222,
                roughness: 0.5
            }),
            checkpointActive: new THREE.MeshStandardMaterial({
                color: 0x00FF66,
                emissive: 0x00CC44,
                emissiveIntensity: 0.9,
                roughness: 0.2
            }),
            rainbow: [
                new THREE.MeshLambertMaterial({ color: 0xE74C3C }), // Red
                new THREE.MeshLambertMaterial({ color: 0xE67E22 }), // Orange
                new THREE.MeshLambertMaterial({ color: 0xF1C40F }), // Yellow
                new THREE.MeshLambertMaterial({ color: 0x2ECC71 }), // Green
                new THREE.MeshLambertMaterial({ color: 0x1ABC9C }), // Teal
                new THREE.MeshLambertMaterial({ color: 0x3498DB }), // Blue
                new THREE.MeshLambertMaterial({ color: 0x9B59B6 })  // Purple
            ]
        };
    }

    // Helper: Add static box collider
    addBlock(x, y, z, w, h, d, material, tag = 'solid') {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const collider = {
            mesh,
            min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
            max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
            tag
        };

        if (tag === 'solid') {
            this.colliders.push(collider);
        } else if (tag === 'lava') {
            this.hazardBlocks.push(collider);
        } else if (tag === 'bounce') {
            this.bouncePads.push(collider);
            this.colliders.push(collider);
        } else if (tag === 'boost') {
            this.boostPads.push(collider);
            this.colliders.push(collider);
        }

        return collider;
    }

    // Add Checkpoint Pad
    addCheckpoint(stageNum, x, y, z, size = 6) {
        const padGeo = new THREE.CylinderGeometry(size / 2, size / 2, 0.4, 24);
        const mesh = new THREE.Mesh(padGeo, this.mats.checkpointInactive);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Add a floating glowing stage billboard above checkpoint
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(10, 5, 236, 54, 8);
        ctx.fill();
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillStyle = '#00FF88';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${stageNum}`, 128, 40);

        const tex = new THREE.CanvasTexture(canvas);
        const sprMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(sprMat);
        sprite.position.set(x, y + 2.5, z);
        sprite.scale.set(4, 1, 1);
        this.scene.add(sprite);

        // Solid foundation underneath
        this.addBlock(x, y - 0.5, z, size + 1, 1, size + 1, this.mats.darkStone);

        const cp = {
            stage: stageNum,
            mesh,
            sprite,
            pos: new THREE.Vector3(x, y + 0.5, z),
            activated: false,
            radius: size / 2 + 0.5
        };
        this.checkpoints.push(cp);
        return cp;
    }

    // Add Spinning Hazard Beams
    addSpinningHazard(x, y, z, length, speed = 1.5, axis = 'y') {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Glowing red neon bar
        const barGeo = new THREE.BoxGeometry(length, 0.8, 0.8);
        const bar = new THREE.Mesh(barGeo, this.mats.lava);
        bar.castShadow = true;
        group.add(bar);

        // Central hub
        const hubGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
        const hub = new THREE.Mesh(hubGeo, this.mats.darkStone);
        group.add(hub);

        this.scene.add(group);

        const hazard = {
            group,
            bar,
            speed,
            axis,
            length,
            radius: length / 2
        };
        this.spinningHazards.push(hazard);
        return hazard;
    }

    // Add Moving Platform
    addMovingPlatform(x, y, z, w, h, d, rangeX, rangeY, rangeZ, speed) {
        const collider = this.addBlock(x, y, z, w, h, d, this.mats.darkStone, 'solid');
        const moving = {
            collider,
            basePos: new THREE.Vector3(x, y, z),
            range: new THREE.Vector3(rangeX, rangeY, rangeZ),
            speed,
            time: Math.random() * Math.PI * 2,
            prevPos: new THREE.Vector3(x, y, z),
            delta: new THREE.Vector3(0, 0, 0)
        };
        this.movingPlatforms.push(moving);
        return moving;
    }

    // Add Disappearing / Blinking Platform
    addDisappearingBlock(x, y, z, w, h, d) {
        const mat = new THREE.MeshStandardMaterial({
            color: 0xF39C12,
            transparent: true,
            opacity: 0.9,
            roughness: 0.3
        });
        const collider = this.addBlock(x, y, z, w, h, d, mat, 'solid');
        const disBlock = {
            collider,
            mat,
            state: 'idle', // 'idle', 'stepping', 'hidden'
            stepTimer: 0,
            regenTimer: 0,
            originalY: y
        };
        this.disappearingBlocks.push(disBlock);
        return disBlock;
    }

    // Add Collectible Coin (Roblox Stud)
    addCoin(x, y, z) {
        const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 16);
        const coin = new THREE.Mesh(coinGeo, this.mats.gold);
        coin.position.set(x, y, z);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        this.scene.add(coin);

        this.coins.push({
            mesh: coin,
            pos: new THREE.Vector3(x, y, z),
            collected: false,
            baseY: y
        });
    }

    // Build the Entire Obby Course
    buildObby() {
        // ==========================================
        // SPAWN ISLAND (STAGE 1 ENTRY)
        // ==========================================
        this.addBlock(0, -1, 0, 24, 2, 24, this.mats.grass);
        const cp1 = this.addCheckpoint(1, 0, 0.2, 0, 6);
        cp1.activated = true;
        cp1.mesh.material = this.mats.checkpointActive;

        // Welcome Archway
        this.addBlock(-7, 4, 8, 2, 8, 2, this.mats.wood);
        this.addBlock(7, 4, 8, 2, 8, 2, this.mats.wood);
        this.addBlock(0, 8, 8, 16, 2, 2, this.mats.wood);

        // Arch banner
        const archCanvas = document.createElement('canvas');
        archCanvas.width = 512;
        archCanvas.height = 128;
        const aCtx = archCanvas.getContext('2d');
        aCtx.fillStyle = '#E74C3C';
        aCtx.roundRect(10, 10, 492, 108, 16);
        aCtx.fill();
        aCtx.font = 'bold 36px Arial, sans-serif';
        aCtx.fillStyle = '#FFFFFF';
        aCtx.textAlign = 'center';
        aCtx.fillText('★ ROBLOX OBBY SIMULATOR ★', 256, 75);

        const archTex = new THREE.CanvasTexture(archCanvas);
        const archSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: archTex }));
        archSpr.position.set(0, 10.5, 8);
        archSpr.scale.set(10, 2.5, 1);
        this.scene.add(archSpr);

        // Practice coins on Spawn Island
        this.addCoin(-4, 1.5, -4);
        this.addCoin(4, 1.5, -4);
        this.addCoin(0, 1.5, 5);

        // ==========================================
        // STAGE 1: RAINBOW STEPS (z: 16 to 55)
        // ==========================================
        const rainbowColors = this.mats.rainbow;
        const stepCount = 7;
        for (let i = 0; i < stepCount; i++) {
            const z = 18 + i * 5.5;
            const x = Math.sin(i * 0.9) * 4;
            const y = 0.5 + i * 0.8;
            this.addBlock(x, y, z, 3.8, 1, 3.8, rainbowColors[i % rainbowColors.length]);
            this.addCoin(x, y + 1.6, z);
        }

        // STAGE 2 CHECKPOINT
        this.addCheckpoint(2, 0, 6.5, 60, 6);

        // ==========================================
        // STAGE 2: NEON LAVA LEAP (z: 68 to 110)
        // ==========================================
        // Giant sea of red lava underneath
        this.addBlock(0, 3.5, 88, 22, 1, 46, this.mats.lava, 'lava');

        // Safe stepping stone pillars
        const lavaSteps = [
            { x: -3, y: 7.2, z: 68 },
            { x: 2, y: 7.6, z: 74 },
            { x: -2, y: 8.0, z: 80 },
            { x: 3, y: 8.4, z: 86 },
            { x: -1, y: 8.8, z: 92 },
            { x: 2, y: 9.2, z: 98 },
            { x: -2, y: 9.6, z: 104 }
        ];

        lavaSteps.forEach((s, idx) => {
            this.addBlock(s.x, s.y, s.z, 3.0, 1.2, 3.0, this.mats.stone);
            if (idx % 2 === 0) this.addCoin(s.x, s.y + 1.6, s.z);
        });

        // STAGE 3 CHECKPOINT
        this.addCheckpoint(3, 0, 10.5, 112, 6);

        // ==========================================
        // STAGE 3: SPINNING HAZARD SWEEPERS (z: 120 to 165)
        // ==========================================
        // Long walking pathway with 3 rotating laser bars to jump over
        this.addBlock(0, 10.5, 138, 4.5, 1, 44, this.mats.darkStone);

        this.addSpinningHazard(0, 11.5, 126, 7.5, 1.8);
        this.addSpinningHazard(0, 11.5, 138, 7.5, -2.2);
        this.addSpinningHazard(0, 11.5, 150, 7.5, 2.0);

        this.addCoin(0, 12.5, 132);
        this.addCoin(0, 12.5, 144);

        // STAGE 4 CHECKPOINT
        this.addCheckpoint(4, 0, 10.5, 170, 6);

        // ==========================================
        // STAGE 4: FADING / DISAPPEARING PLATFORMS (z: 178 to 220)
        // ==========================================
        // Platforms that start blinking/falling when stood on
        for (let i = 0; i < 6; i++) {
            const z = 180 + i * 6.5;
            const x = (i % 2 === 0) ? -3 : 3;
            const y = 10.5 + i * 0.4;
            this.addDisappearingBlock(x, y, z, 3.8, 1, 3.8);
            this.addCoin(x, y + 1.6, z);
        }

        // STAGE 5 CHECKPOINT
        this.addCheckpoint(5, 0, 13.5, 226, 6);

        // ==========================================
        // STAGE 5: SPEED BOOST & SUPER TRAMPOLINE LAUNCH (z: 232 to 280)
        // ==========================================
        // Runway with Cyan Speed Booster
        this.addBlock(0, 13.5, 238, 6, 1, 14, this.mats.darkStone);
        this.addBlock(0, 14.1, 238, 4, 0.2, 10, this.mats.boost, 'boost');

        // Giant Super Bounce Trampoline
        this.addBlock(0, 13.5, 252, 6, 1, 6, this.mats.bounce, 'bounce');

        // Floating neon rings in the sky above the trampoline
        for (let r = 0; r < 3; r++) {
            const ringGeo = new THREE.TorusGeometry(3.5, 0.4, 8, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(0, 22 + r * 6, 252 + r * 10);
            ring.rotation.x = Math.PI / 4;
            this.scene.add(ring);
            this.addCoin(0, 22 + r * 6, 252 + r * 10);
        }

        // High Sky Landing Island
        this.addBlock(0, 32, 288, 14, 2, 14, this.mats.stone);
        this.addCheckpoint(6, 0, 33.2, 288, 6);

        // ==========================================
        // STAGE 6: THE WINNER'S PEAK & GOLDEN TROPHY
        // ==========================================
        // Grand bridge to Winner's Temple
        this.addBlock(0, 32, 308, 6, 2, 22, this.mats.stone);

        // Golden Podium
        this.addBlock(0, 32, 330, 24, 2, 24, this.mats.gold);

        // 4 Roman Golden Pillars
        const pillarGeo = new THREE.CylinderGeometry(1.0, 1.2, 12, 16);
        const p1 = new THREE.Mesh(pillarGeo, this.mats.gold);
        p1.position.set(-8, 38, 322);
        const p2 = new THREE.Mesh(pillarGeo, this.mats.gold);
        p2.position.set(8, 38, 322);
        const p3 = new THREE.Mesh(pillarGeo, this.mats.gold);
        p3.position.set(-8, 38, 338);
        const p4 = new THREE.Mesh(pillarGeo, this.mats.gold);
        p4.position.set(8, 38, 338);
        this.scene.add(p1, p2, p3, p4);

        // Big 3D Golden Trophy in the center
        this.trophy = this.createGoldenTrophy(0, 36, 330);

        // Winner trigger pad
        const winGeo = new THREE.CylinderGeometry(4, 4, 0.4, 24);
        const winMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xEEAA00,
            emissiveIntensity: 0.8
        });
        this.winPad = new THREE.Mesh(winGeo, winMat);
        this.winPad.position.set(0, 33.2, 330);
        this.scene.add(this.winPad);

        // ==========================================
        // BONUS: THE MEGA SKY SLIDE (BACK TO SPAWN)
        // ==========================================
        this.createSkySlide();

        // ==========================================
        // PRO LEVEL: ZERO-GRAVITY ZONE & FLOATING ISLANDS
        // ==========================================
        this.createZeroGravityZone();
        this.createFloatingIslands();
    }

    createZeroGravityZone() {
        this.zeroGZones = [];

        // Glowing Purple/Cyan Zero-G Cube Field at Stage 4.5
        const sizeX = 26, sizeY = 22, sizeZ = 30;
        const posX = 0, posY = 22, posZ = 205;

        const fieldGeo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const fieldMat = new THREE.MeshBasicMaterial({
            color: 0x9B59B6,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
        fieldMesh.position.set(posX, posY, posZ);
        this.scene.add(fieldMesh);

        // Floating glowing cosmic orbs inside Zero-G zone
        for (let i = 0; i < 8; i++) {
            const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.8, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0x00FFFF })
            );
            orb.position.set(
                posX + (Math.random() - 0.5) * (sizeX - 4),
                posY + (Math.random() - 0.5) * (sizeY - 4),
                posZ + (Math.random() - 0.5) * (sizeZ - 4)
            );
            this.scene.add(orb);
            this.addCoin(orb.position.x, orb.position.y, orb.position.z);
        }

        this.zeroGZones.push({
            min: new THREE.Vector3(posX - sizeX / 2, posY - sizeY / 2, posZ - sizeZ / 2),
            max: new THREE.Vector3(posX + sizeX / 2, posY + sizeY / 2, posZ + sizeZ / 2),
            mesh: fieldMesh
        });
    }

    createFloatingIslands() {
        // 3 High-Altitude Sky Islands with ancient gold obelisks
        const islands = [
            { x: -35, y: 45, z: 80, name: "Celestial Isle" },
            { x: 35, y: 52, z: 160, name: "Astral Peak" },
            { x: -30, y: 58, z: 240, name: "Sky Sanctum" }
        ];

        islands.forEach((isle, idx) => {
            // Floating landmass
            this.addBlock(isle.x, isle.y, isle.z, 14, 3, 14, this.mats.grass);

            // Gold Obelisk in center
            const obeliskGeo = new THREE.ConeGeometry(1.5, 9, 4);
            const obeliskMat = this.mats.gold;
            const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
            obelisk.position.set(isle.x, isle.y + 5.5, isle.z);
            this.scene.add(obelisk);

            // Trampoline bounce pads connecting islands
            this.addBlock(isle.x + 5, isle.y + 0.5, isle.z, 3, 0.4, 3, this.mats.bounce, 'bounce');

            // Rich coin clusters
            this.addCoin(isle.x - 3, isle.y + 2, isle.z - 3);
            this.addCoin(isle.x + 3, isle.y + 2, isle.z + 3);
            this.addCoin(isle.x, isle.y + 11, isle.z);
        });
    }

    createSkySlide() {
        // Spiral downward slide blocks curving from (0, 32, 345) down to (0, 0, 0)
        const segments = 40;
        const startY = 32;
        const endY = 0.5;
        const startZ = 345;
        const endZ = 10;

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const y = startY - t * (startY - endY);
            const z = startZ - t * (startZ - endZ);
            const x = Math.sin(t * Math.PI * 4) * 14;

            // Slide bank
            const colMat = this.mats.rainbow[i % this.mats.rainbow.length];
            this.addBlock(x, y, z, 5, 0.6, 6, colMat, 'boost');
        }
    }

    createGoldenTrophy(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.85,
            roughness: 0.15,
            emissive: 0x775500
        });

        // Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 1.0, 16), goldMat);
        base.position.y = 0;
        group.add(base);

        // Stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.5, 16), goldMat);
        stem.position.y = 1.75;
        group.add(stem);

        // Cup
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 0.8, 3.0, 16), goldMat);
        cup.position.y = 4.2;
        group.add(cup);

        // Handles
        const handleGeo = new THREE.TorusGeometry(1.2, 0.25, 8, 16, Math.PI);
        const h1 = new THREE.Mesh(handleGeo, goldMat);
        h1.position.set(-2.0, 4.2, 0);
        h1.rotation.z = Math.PI / 2;
        const h2 = new THREE.Mesh(handleGeo, goldMat);
        h2.position.set(2.0, 4.2, 0);
        h2.rotation.z = -Math.PI / 2;
        group.add(h1, h2);

        this.scene.add(group);
        return group;
    }

    // Launch Confetti & Fireworks celebration
    triggerVictoryCelebration() {
        if (this.confettiParticles) return; // already active

        const count = 250;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.confettiVels = [];

        const colorPalette = [
            [1, 0, 0], [0, 1, 0], [0, 0, 1],
            [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 0.8, 0]
        ];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 34;
            positions[i * 3 + 2] = 330;

            const col = colorPalette[i % colorPalette.length];
            colors[i * 3] = col[0];
            colors[i * 3 + 1] = col[1];
            colors[i * 3 + 2] = col[2];

            this.confettiVels.push(new THREE.Vector3(
                (Math.random() - 0.5) * 22,
                Math.random() * 20 + 8,
                (Math.random() - 0.5) * 22
            ));
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const pMat = new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });

        this.confettiParticles = new THREE.Points(pGeo, pMat);
        this.scene.add(this.confettiParticles);
    }

    // Update World Animations, Hazard rotations, platforms, coins & particles
    update(dt, player) {
        // Check Zero-G Anti-Gravity Zones
        let insideZeroG = false;
        if (this.zeroGZones) {
            this.zeroGZones.forEach(z => {
                if (player.position.x > z.min.x && player.position.x < z.max.x &&
                    player.position.y > z.min.y && player.position.y < z.max.y &&
                    player.position.z > z.min.z && player.position.z < z.max.z) {
                    insideZeroG = true;
                }
            });
        }
        player.inZeroG = insideZeroG;
        if (insideZeroG) {
            player.velocity.y *= 0.92; // levitation damping
            player.velocity.y += Math.sin(Date.now() * 0.005) * 0.35; // gentle zero-g bob
        }

        // Spin coins
        this.coins.forEach(c => {
            if (!c.collected) {
                c.mesh.rotation.z += dt * 3.5;
                c.mesh.position.y = c.baseY + Math.sin(Date.now() * 0.004) * 0.2;

                // Player pickup check
                if (player.position.distanceTo(c.mesh.position) < 2.0) {
                    c.collected = true;
                    this.scene.remove(c.mesh);
                    player.coins++;
                    this.sound.playCoin();
                }
            }
        });

        // Rotate spinning hazards
        this.spinningHazards.forEach(h => {
            if (h.axis === 'y') {
                h.group.rotation.y += h.speed * dt;
            } else {
                h.group.rotation.z += h.speed * dt;
            }

            // Hazard collision against player
            const pDist = player.position.distanceTo(h.group.position);
            if (pDist < h.radius + 1.2 && Math.abs(player.position.y - h.group.position.y) < 1.8) {
                player.die();
            }
        });

        // Move moving platforms
        this.movingPlatforms.forEach(m => {
            m.time += dt * m.speed;
            m.prevPos.copy(m.collider.mesh.position);

            const newX = m.basePos.x + Math.sin(m.time) * m.range.x;
            const newY = m.basePos.y + Math.sin(m.time) * m.range.y;
            const newZ = m.basePos.z + Math.sin(m.time) * m.range.z;

            m.collider.mesh.position.set(newX, newY, newZ);
            m.delta.subVectors(m.collider.mesh.position, m.prevPos);

            // Update bounding box
            const halfW = (m.collider.max.x - m.collider.min.x) / 2;
            const halfH = (m.collider.max.y - m.collider.min.y) / 2;
            const halfD = (m.collider.max.z - m.collider.min.z) / 2;
            m.collider.min.set(newX - halfW, newY - halfH, newZ - halfD);
            m.collider.max.set(newX + halfW, newY + halfH, newZ + halfD);
        });

        // Disappearing platforms update
        this.disappearingBlocks.forEach(d => {
            if (d.state === 'stepping') {
                d.stepTimer += dt;
                // Flash yellow to red
                d.mat.opacity = 0.9 - (d.stepTimer / 1.0) * 0.7;
                if (d.stepTimer >= 0.9) {
                    d.state = 'hidden';
                    d.collider.mesh.visible = false;
                    // remove collider temporarily
                    d.collider.min.y = -9999;
                    d.collider.max.y = -9999;
                    d.regenTimer = 0;
                }
            } else if (d.state === 'hidden') {
                d.regenTimer += dt;
                if (d.regenTimer >= 2.5) {
                    d.state = 'idle';
                    d.stepTimer = 0;
                    d.collider.mesh.visible = true;
                    d.mat.opacity = 0.9;
                    // restore collider
                    const h = d.collider.mesh.geometry.parameters.height;
                    d.collider.min.y = d.originalY - h / 2;
                    d.collider.max.y = d.originalY + h / 2;
                }
            }
        });

        // Spin Trophy
        if (this.trophy) {
            this.trophy.rotation.y += dt * 1.2;
        }

        // Check Winner Pad contact
        if (!player.hasWon && this.winPad) {
            const dist = player.position.distanceTo(this.winPad.position);
            if (dist < 4.0 && Math.abs(player.position.y - this.winPad.position.y) < 1.5) {
                player.giveWinnerCrown();
                this.sound.playVictory();
                this.triggerVictoryCelebration();
            }
        }

        // Update Confetti particles
        if (this.confettiParticles) {
            const posAttr = this.confettiParticles.geometry.attributes.position;
            for (let i = 0; i < this.confettiVels.length; i++) {
                this.confettiVels[i].y -= 9.8 * dt; // gravity
                posAttr.setXYZ(
                    i,
                    posAttr.getX(i) + this.confettiVels[i].x * dt,
                    posAttr.getY(i) + this.confettiVels[i].y * dt,
                    posAttr.getZ(i) + this.confettiVels[i].z * dt
                );
                // floor bounce
                if (posAttr.getY(i) < 32.5) {
                    posAttr.setY(i, 32.5);
                    this.confettiVels[i].y *= -0.5;
                }
            }
            posAttr.needsUpdate = true;
        }

        // Checkpoint proximity checks
        this.checkpoints.forEach(cp => {
            const pFlat = new THREE.Vector2(player.position.x, player.position.z);
            const cpFlat = new THREE.Vector2(cp.pos.x, cp.pos.z);
            if (pFlat.distanceTo(cpFlat) < cp.radius && Math.abs(player.position.y - cp.pos.y) < 2.0) {
                if (!cp.activated) {
                    cp.activated = true;
                    cp.mesh.material = this.mats.checkpointActive;
                    player.setCheckpoint(cp.stage, cp.pos);
                }
            }
        });
    }

    // AABB Player Collision Resolution
    resolvePlayerCollision(currentPos, deltaPos, pW, pH, pD) {
        let newX = currentPos.x + deltaPos.x;
        let newY = currentPos.y + deltaPos.y;
        let newZ = currentPos.z + deltaPos.z;
        let grounded = false;
        let touchedLava = false;
        let touchedBouncePad = false;
        let touchedBoostPad = false;
        let platformDelta = null;

        // Player AABB half-extents
        const hw = pW / 2;
        const hh = pH / 2;
        const hd = pD / 2;

        // Check Y-axis collision (Vertical / Ground check)
        const playerBottom = newY;
        const playerTop = newY + pH;

        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i];

            // Horizontal overlap check
            if (newX + hw > c.min.x && newX - hw < c.max.x &&
                newZ + hd > c.min.z && newZ - hd < c.max.z) {

                // Landing on top of platform
                if (currentPos.y >= c.max.y - 0.6 && playerBottom <= c.max.y) {
                    newY = c.max.y;
                    grounded = true;

                    // Trigger bounce pad
                    if (c.tag === 'bounce') {
                        touchedBouncePad = true;
                    }
                    // Trigger boost pad
                    if (c.tag === 'boost') {
                        touchedBoostPad = true;
                    }

                    // Check if standing on disappearing block
                    this.disappearingBlocks.forEach(d => {
                        if (d.collider === c && d.state === 'idle') {
                            d.state = 'stepping';
                        }
                    });

                    // Check moving platform attachment
                    for (let m = 0; m < this.movingPlatforms.length; m++) {
                        if (this.movingPlatforms[m].collider === c) {
                            platformDelta = this.movingPlatforms[m].delta;
                        }
                    }
                }
                // Hitting head on ceiling
                else if (currentPos.y + pH <= c.min.y + 0.6 && playerTop >= c.min.y) {
                    newY = c.min.y - pH;
                }
            }
        }

        // Check X-axis and Z-axis horizontal wall collisions
        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i];

            // Check if player Y is inside block height range
            if (newY + 0.3 < c.max.y && newY + pH - 0.3 > c.min.y) {
                // X collision
                if (newX + hw > c.min.x && newX - hw < c.max.x &&
                    currentPos.z + hd > c.min.z && currentPos.z - hd < c.max.z) {
                    if (currentPos.x <= c.min.x) newX = c.min.x - hw;
                    else if (currentPos.x >= c.max.x) newX = c.max.x + hw;
                }

                // Z collision
                if (newZ + hd > c.min.z && newZ - hd < c.max.z &&
                    newX + hw > c.min.x && newX - hw < c.max.x) {
                    if (currentPos.z <= c.min.z) newZ = c.min.z - hd;
                    else if (currentPos.z >= c.max.z) newZ = c.max.z + hd;
                }
            }
        }

        // Check Lava Hazard contact
        for (let i = 0; i < this.hazardBlocks.length; i++) {
            const l = this.hazardBlocks[i];
            if (newX + hw > l.min.x && newX - hw < l.max.x &&
                newY < l.max.y + 0.3 && newY + pH > l.min.y &&
                newZ + hd > l.min.z && newZ - hd < l.max.z) {
                touchedLava = true;
                break;
            }
        }

        return {
            newPosition: new THREE.Vector3(newX, newY, newZ),
            grounded,
            touchedLava,
            touchedBouncePad,
            touchedBoostPad,
            platformDelta
        };
    }
}

window.RobloxWorld = RobloxWorld;
