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
        this.springPads = [];   // Interactive Mechanical Spring Launchers
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

    // Add Interactive Mechanical Spring Launcher Pad
    addSpringPad(x, y, z, strength = 32) {
        const springGroup = new THREE.Group();
        springGroup.position.set(x, y, z);

        // Base plate
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.3, 16);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        springGroup.add(base);

        // Coiled Spring Mesh
        const coilGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12, 4, true);
        const coilMat = new THREE.MeshStandardMaterial({
            color: 0xFF3300,
            metalness: 0.8,
            roughness: 0.3,
            wireframe: true
        });
        const coil = new THREE.Mesh(coilGeo, coilMat);
        coil.position.y = 0.8;
        springGroup.add(coil);

        // Bouncy Top Disc
        const topGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.25, 16);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0xFFCC00,
            metalness: 0.5,
            roughness: 0.2,
            emissive: 0x442200
        });
        const topDisc = new THREE.Mesh(topGeo, topMat);
        topDisc.position.y = 1.45;
        springGroup.add(topDisc);

        this.scene.add(springGroup);

        const padData = {
            group: springGroup,
            coil,
            topDisc,
            pos: new THREE.Vector3(x, y + 1.45, z),
            strength,
            compression: 0,
            cooldown: 0
        };

        this.springPads.push(padData);
        this.addBlock(x, y + 0.15, z, 3, 0.3, 3, baseMat, 'solid');
        return padData;
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
        this.addSpringPad(6, 6.0, 56, 30);

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
        this.createCyberNebulaStage();
        this.createInfernoVolcanoStage();
        this.createTitansSummitStage();
        this.createVoidDimensionStage();
        this.createCelestialAuroraStage();
        this.createDragonFireSpireStage();
        this.createQuantumMatrixStage();
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

    createCyberNebulaStage() {
        // ==========================================
        // STAGE 7: CYBER NEON NEBULA & MASTER'S APEX
        // ==========================================
        this.addCheckpoint(7, 0, 33.2, 355, 6);

        // Bridge from Winner's Podium to Stage 7 Checkpoint
        this.addBlock(0, 32, 345, 6, 2, 12, this.mats.darkStone);

        // 8 Floating Neon Hexagon / Step Platforms ascending into the sky
        const neonCyanMat = new THREE.MeshStandardMaterial({
            color: 0x00F0FF,
            emissive: 0x0088CC,
            emissiveIntensity: 0.6,
            roughness: 0.3
        });
        const neonPinkMat = new THREE.MeshStandardMaterial({
            color: 0xFF007F,
            emissive: 0xAA0055,
            emissiveIntensity: 0.6,
            roughness: 0.3
        });

        const steps = [
            { x: -5, y: 34.5, z: 372, mat: neonCyanMat },
            { x:  4, y: 36.0, z: 384, mat: neonPinkMat },
            { x: -6, y: 37.5, z: 396, mat: neonCyanMat },
            { x:  5, y: 39.0, z: 408, mat: neonPinkMat },
            { x: -4, y: 41.0, z: 420, mat: neonCyanMat },
            { x:  3, y: 43.0, z: 432, mat: neonPinkMat },
            { x: -2, y: 45.0, z: 444, mat: neonCyanMat },
            { x:  0, y: 47.0, z: 456, mat: neonPinkMat }
        ];

        steps.forEach(s => {
            this.addBlock(s.x, s.y, s.z, 4.5, 1.2, 4.5, s.mat);
            this.addCoin(s.x, s.y + 1.8, s.z);
        });

        // Spinning hazard beam in the middle of Stage 7
        this.addSpinningHazard(0, 42, 420, 10, 2.0, 'y');

        // Master's Apex Floating Island
        this.addBlock(0, 48, 474, 20, 2, 20, this.mats.gold);

        // 4 Glowing Obsidian Monolith Pillars
        const monolithGeo = new THREE.BoxGeometry(1.5, 14, 1.5);
        const monolithMat = new THREE.MeshStandardMaterial({
            color: 0x1A0033,
            emissive: 0x660099,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });
        const m1 = new THREE.Mesh(monolithGeo, monolithMat);
        m1.position.set(-7, 56, 467);
        const m2 = new THREE.Mesh(monolithGeo, monolithMat);
        m2.position.set(7, 56, 467);
        const m3 = new THREE.Mesh(monolithGeo, monolithMat);
        m3.position.set(-7, 56, 481);
        const m4 = new THREE.Mesh(monolithGeo, monolithMat);
        m4.position.set(7, 56, 481);
        this.scene.add(m1, m2, m3, m4);

        // Master's Diamond Crystal hovering in center
        const crystalGeo = new THREE.OctahedronGeometry(2.5, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x0088CC,
            emissiveIntensity: 0.9,
            roughness: 0.1,
            metalness: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(0, 53, 474);
        this.scene.add(crystal);
        this.masterCrystal = crystal;
    }

    createInfernoVolcanoStage() {
        // ==========================================
        // STAGE 8: INFERNO VOLCANIC CORE & MOLTEN GEYSERS
        // ==========================================
        this.addCheckpoint(8, 0, 48.2, 492, 6);

        // Volcanic bridge from Stage 7 Apex to Stage 8 Checkpoint
        this.addBlock(0, 47, 483, 6, 2, 10, this.mats.darkStone);

        // Sea of boiling magma underneath Stage 8
        this.addBlock(0, 43, 530, 40, 1.5, 75, this.mats.lava, 'lava');

        // Sinking/floating basalt volcanic stepping pillars
        const volcanicStone = new THREE.MeshStandardMaterial({
            color: 0x1C1F24,
            roughness: 0.8,
            metalness: 0.2
        });
        const glowingMagmaRim = new THREE.MeshStandardMaterial({
            color: 0xFF2200,
            emissive: 0xFF4400,
            emissiveIntensity: 0.8,
            roughness: 0.3
        });

        const pillars = [
            { x: -5, y: 48.5, z: 506 },
            { x:  4, y: 50.0, z: 518 },
            { x: -6, y: 51.5, z: 530 },
            { x:  5, y: 53.0, z: 542 },
            { x: -3, y: 55.0, z: 554 },
            { x:  0, y: 57.0, z: 566 }
        ];

        pillars.forEach((p, idx) => {
            this.addBlock(p.x, p.y - 2, p.z, 5, 4, 5, volcanicStone);
            this.addBlock(p.x, p.y + 0.1, p.z, 4.6, 0.3, 4.6, glowingMagmaRim);
            this.addCoin(p.x, p.y + 1.8, p.z);
        });

        // 2 High-speed spinning magma hazard beams
        this.addSpinningHazard(0, 52, 518, 12, 2.4, 'y');
        this.addSpinningHazard(0, 56, 548, 11, -2.2, 'y');

        // Volcanic Caldera Peak Sanctuary
        this.addBlock(0, 58, 582, 22, 2.5, 22, volcanicStone);

        // 4 Magma Crystal spires surrounding caldera
        const spireGeo = new THREE.ConeGeometry(1.6, 12, 6);
        const spireMat = new THREE.MeshStandardMaterial({
            color: 0xFF3300,
            emissive: 0xFF5500,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });
        const sp1 = new THREE.Mesh(spireGeo, spireMat);
        sp1.position.set(-8, 64, 574);
        const sp2 = new THREE.Mesh(spireGeo, spireMat);
        sp2.position.set(8, 64, 574);
        const sp3 = new THREE.Mesh(spireGeo, spireMat);
        sp3.position.set(-8, 64, 590);
        const sp4 = new THREE.Mesh(spireGeo, spireMat);
        sp4.position.set(8, 64, 590);
        this.scene.add(sp1, sp2, sp3, sp4);

        // Giant Molten Core floating in center of Caldera
        const coreGeo = new THREE.DodecahedronGeometry(3.0, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xFFAA00,
            emissive: 0xFF4400,
            emissiveIntensity: 1.0,
            roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 63, 582);
        this.scene.add(core);
        this.volcanicCore = core;
    }

    createTitansSummitStage() {
        // ==========================================
        // STAGE 9: SUMMIT OF THE TITANS & CELESTIAL CROWN SHRINE
        // ==========================================
        // Bridge from Stage 8 Caldera (z: 582 to 598)
        this.addBlock(0, 59, 595, 6, 1.5, 8, this.mats.gold);

        // Checkpoint 9
        this.addCheckpoint(9, 0, 60.2, 604, 6);

        // High-altitude crystalline stepping stones
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x9933FF,
            emissive: 0x6600CC,
            emissiveIntensity: 0.6,
            roughness: 0.15,
            metalness: 0.8
        });

        const cyanCrystal = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x0088CC,
            emissiveIntensity: 0.7,
            roughness: 0.1,
            metalness: 0.9
        });

        const stones = [
            { x: -4, y: 62.0, z: 616 },
            { x:  3, y: 64.5, z: 626 },
            { x: -5, y: 67.0, z: 636 },
            { x:  4, y: 70.0, z: 646 },
            { x: -3, y: 73.5, z: 656 },
            { x:  0, y: 77.0, z: 666 }
        ];

        stones.forEach((s, idx) => {
            const mat = (idx % 2 === 0) ? crystalMat : cyanCrystal;
            this.addBlock(s.x, s.y - 1, s.z, 5, 2, 5, mat);
            this.addCoin(s.x, s.y + 1.8, s.z);
        });

        // 2 High-velocity spinning crystal hazard rings
        this.addSpinningHazard(0, 68, 636, 12, 2.6, 'y');
        this.addSpinningHazard(0, 74, 656, 11, -2.8, 'y');

        // Grand Champion Throne Apex Platform
        this.addBlock(0, 79, 684, 22, 2.5, 22, this.mats.gold);

        // Golden Throne Chair
        const throneGold = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.85,
            roughness: 0.2
        });
        const throneRuby = new THREE.MeshStandardMaterial({
            color: 0xCC0022,
            roughness: 0.4
        });

        // Throne Seat & Backrest
        this.addBlock(0, 81.5, 689, 6, 2.5, 4, throneGold);
        this.addBlock(0, 84.5, 691.5, 6, 4.5, 1.5, throneRuby);
        this.addBlock(-2.8, 83, 689, 1, 2, 4, throneGold);
        this.addBlock(2.8, 83, 689, 1, 2, 4, throneGold);

        // 4 Celestial Beacon Pillars
        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0x00FFCC,
            emissive: 0x00FFAA,
            emissiveIntensity: 0.8
        });
        this.addBlock(-8, 85, 676, 2, 10, 2, beaconMat);
        this.addBlock(8, 85, 676, 2, 10, 2, beaconMat);
        this.addBlock(-8, 85, 692, 2, 10, 2, beaconMat);
        this.addBlock(8, 85, 692, 2, 10, 2, beaconMat);

        // Animated Grand Celestial Crown
        const crownGroup = new THREE.Group();
        const baseRing = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16, 1, true),
            throneGold
        );
        crownGroup.add(baseRing);

        // 5 Crown Jewels Spikes
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const spike = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 1.4, 6),
                throneGold
            );
            spike.position.set(Math.cos(angle) * 2.2, 0.8, Math.sin(angle) * 2.2);
            crownGroup.add(spike);

            const gem = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.35, 0),
                new THREE.MeshStandardMaterial({
                    color: i % 2 === 0 ? 0xFF0055 : 0x00FFFF,
                    emissive: i % 2 === 0 ? 0xFF0033 : 0x00AAFF,
                    emissiveIntensity: 0.9
                })
            );
            gem.position.set(Math.cos(angle) * 2.2, 1.5, Math.sin(angle) * 2.2);
            crownGroup.add(gem);
        }

        crownGroup.position.set(0, 86, 684);
        this.scene.add(crownGroup);
        this.celestialCrown = crownGroup;
    }

    createVoidDimensionStage() {
        // ==========================================
        // STAGE 10: THE VOID DIMENSION & ANTI-MATTER PLATFORMS
        // ==========================================
        // Bridge from Stage 9 Throne Platform (z: 695 to 708)
        this.addBlock(0, 80, 702, 6, 1.5, 12, this.mats.darkStone);

        // Checkpoint 10
        this.addCheckpoint(10, 0, 81.2, 715, 6);

        // Anti-matter dark materials
        const voidMat = new THREE.MeshStandardMaterial({
            color: 0x050508,
            roughness: 0.9,
            metalness: 0.1
        });
        const voidNeonMat = new THREE.MeshStandardMaterial({
            color: 0x8A2BE2,
            emissive: 0x4B0082,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });

        const voidSteps = [
            { x: -5, y: 83.0, z: 728 },
            { x:  4, y: 85.5, z: 740 },
            { x: -5, y: 88.0, z: 752 },
            { x:  4, y: 91.0, z: 764 },
            { x: -2, y: 94.0, z: 776 },
            { x:  0, y: 96.5, z: 788 }
        ];

        voidSteps.forEach((s, idx) => {
            this.addBlock(s.x, s.y - 1.5, s.z, 5, 3, 5, voidMat);
            this.addBlock(s.x, s.y + 0.1, s.z, 4.6, 0.25, 4.6, voidNeonMat);
            this.addCoin(s.x, s.y + 1.8, s.z);
        });

        // 2 High-velocity spinning void hazard beams
        this.addSpinningHazard(0, 86, 740, 12, 2.5, 'y');
        this.addSpinningHazard(0, 92, 764, 11, -2.7, 'y');

        // Central Void Rift Vortex
        const vortexGeo = new THREE.TorusGeometry(3.5, 0.8, 16, 32);
        const vortexMat = new THREE.MeshStandardMaterial({
            color: 0x9400D3,
            emissive: 0x4B0082,
            emissiveIntensity: 1.0,
            wireframe: true
        });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.position.set(0, 89, 752);
        this.scene.add(vortex);
        this.voidVortex = vortex;

        // Void Dimension Apex Sanctuary
        this.addBlock(0, 98, 804, 22, 2.5, 22, voidMat);

        // 4 Dark Monolith Pillars
        const monolithMat = new THREE.MeshStandardMaterial({
            color: 0x1A0033,
            emissive: 0x330066,
            emissiveIntensity: 0.6
        });
        this.addBlock(-8, 104, 796, 2, 10, 2, monolithMat);
        this.addBlock(8, 104, 796, 2, 10, 2, monolithMat);
        this.addBlock(-8, 104, 812, 2, 10, 2, monolithMat);
        this.addBlock(8, 104, 812, 2, 10, 2, monolithMat);

        // Floating Dark Matter Core
        const coreGeo = new THREE.OctahedronGeometry(2.8, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x110022,
            emissive: 0x8A2BE2,
            emissiveIntensity: 0.9,
            roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 103, 804);
        this.scene.add(core);
        this.voidCore = core;
    }

    createCelestialAuroraStage() {
        // ==========================================
        // STAGE 11: CELESTIAL AURORA HIGHWAY
        // ==========================================
        // Bridge from Stage 10 Apex (z: 815 to 828)
        this.addBlock(0, 99, 821, 6, 1.5, 12, this.mats.gold);

        // Checkpoint 11
        this.addCheckpoint(11, 0, 100.2, 835, 6);

        // Iridescent rainbow prism steps
        const rainbowColors = [0xFF0055, 0xFF7700, 0xFFDD00, 0x00FF66, 0x00DDFF, 0x9933FF];
        const steps = [
            { x: -5, y: 102.0, z: 848 },
            { x:  4, y: 104.5, z: 860 },
            { x: -4, y: 107.0, z: 872 },
            { x:  5, y: 110.0, z: 884 },
            { x: -3, y: 113.5, z: 896 },
            { x:  0, y: 117.0, z: 908 }
        ];

        steps.forEach((s, idx) => {
            const col = rainbowColors[idx % rainbowColors.length];
            const mat = new THREE.MeshStandardMaterial({
                color: col,
                emissive: col,
                emissiveIntensity: 0.65,
                roughness: 0.2,
                metalness: 0.6
            });
            this.addBlock(s.x, s.y - 1, s.z, 5, 2, 5, mat);
            this.addCoin(s.x, s.y + 1.8, s.z);
        });

        // 2 High-velocity spinning aurora hazard rings
        this.addSpinningHazard(0, 108, 872, 12, 2.6, 'y');
        this.addSpinningHazard(0, 114, 896, 11, -2.8, 'y');

        // Celestial Aurora Halo Ring floating above Stage 11
        const haloGeo = new THREE.TorusGeometry(8.0, 0.45, 16, 48);
        const haloMat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x00FFAA,
            emissiveIntensity: 1.0,
            wireframe: true
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(0, 118, 880);
        halo.rotation.x = Math.PI / 4;
        this.scene.add(halo);
        this.auroraHalo = halo;

        // Final Celestial Zenith Shrine Platform
        this.addBlock(0, 119, 924, 24, 2.5, 24, this.mats.gold);

        // 4 Celestial Crystal Monoliths
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0xFF00FF,
            emissive: 0xCC00CC,
            emissiveIntensity: 0.8
        });
        this.addBlock(-9, 126, 915, 2, 12, 2, crystalMat);
        this.addBlock(9, 126, 915, 2, 12, 2, crystalMat);
        this.addBlock(-9, 126, 933, 2, 12, 2, crystalMat);
        this.addBlock(9, 126, 933, 2, 12, 2, crystalMat);

        // Floating Victory Star
        const starGeo = new THREE.IcosahedronGeometry(3.0, 0);
        const starMat = new THREE.MeshStandardMaterial({
            color: 0xFFFF00,
            emissive: 0xFFAA00,
            emissiveIntensity: 1.0,
            roughness: 0.1
        });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(0, 126, 924);
        this.scene.add(star);
        this.auroraStar = star;
    }

    createDragonFireSpireStage() {
        // ==========================================
        // STAGE 12: DRAGON FIRE SPIRE & MOLTEN HELIX
        // ==========================================
        // Bridge from Stage 11 Zenith Platform (z: 936 to 948)
        this.addBlock(0, 120, 942, 6, 1.5, 12, this.mats.gold);

        // Checkpoint 12
        this.addCheckpoint(12, 0, 121.2, 954, 6);

        // Dragon Spire Materials
        const dragonObsidian = new THREE.MeshStandardMaterial({
            color: 0x141012,
            roughness: 0.85,
            metalness: 0.3
        });
        const dragonFire = new THREE.MeshStandardMaterial({
            color: 0xFF2200,
            emissive: 0xFF4400,
            emissiveIntensity: 0.9,
            roughness: 0.2
        });
        const dragonGold = new THREE.MeshStandardMaterial({
            color: 0xFFAA00,
            emissive: 0xFF6600,
            emissiveIntensity: 0.7,
            metalness: 0.8,
            roughness: 0.2
        });

        // Ascending Helical Stepping Platforms
        const dragonSteps = [
            { x: -5, y: 123.0, z: 968 },
            { x:  4, y: 125.5, z: 980 },
            { x: -5, y: 128.0, z: 992 },
            { x:  4, y: 131.0, z: 1004 },
            { x: -3, y: 134.0, z: 1016 },
            { x:  0, y: 137.0, z: 1028 }
        ];

        dragonSteps.forEach((s, idx) => {
            const mat = (idx % 2 === 0) ? dragonFire : dragonGold;
            this.addBlock(s.x, s.y - 1.5, s.z, 5, 3, 5, dragonObsidian);
            this.addBlock(s.x, s.y + 0.1, s.z, 4.6, 0.25, 4.6, mat);
            this.addCoin(s.x, s.y + 1.8, s.z);
        });

        // 2 High-velocity spinning dragon fire hazard beams
        this.addSpinningHazard(0, 127, 980, 12, 2.7, 'y');
        this.addSpinningHazard(0, 133, 1004, 11, -2.9, 'y');

        // Central Obsidian Dragon Spire Column
        const spireColGeo = new THREE.CylinderGeometry(2.0, 3.2, 36, 12);
        const spireCol = new THREE.Mesh(spireColGeo, dragonObsidian);
        spireCol.position.set(0, 134, 998);
        this.scene.add(spireCol);

        // Dragon Fire Spire Apex Platform
        this.addBlock(0, 139, 1046, 22, 2.5, 22, dragonObsidian);

        // 4 Dragon Horn Spires
        const hornGeo = new THREE.ConeGeometry(1.6, 14, 8);
        const h1 = new THREE.Mesh(hornGeo, dragonFire);
        h1.position.set(-8, 146, 1038);
        const h2 = new THREE.Mesh(hornGeo, dragonFire);
        h2.position.set(8, 146, 1038);
        const h3 = new THREE.Mesh(hornGeo, dragonFire);
        h3.position.set(-8, 146, 1054);
        const h4 = new THREE.Mesh(hornGeo, dragonFire);
        h4.position.set(8, 146, 1054);
        this.scene.add(h1, h2, h3, h4);

        // Floating Dragon Flame Orb
        const orbGeo = new THREE.DodecahedronGeometry(2.8, 1);
        const orbMat = new THREE.MeshStandardMaterial({
            color: 0xFF3300,
            emissive: 0xFF5500,
            emissiveIntensity: 1.0,
            roughness: 0.15
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.set(0, 145, 1046);
        this.scene.add(orb);
        this.dragonCore = orb;
    }

    createQuantumMatrixStage() {
        // ==========================================
        // STAGE 13: QUANTUM CYBER MATRIX
        // ==========================================
        // Bridge from Stage 12 Dragon Apex (z: 1057 to 1070)
        this.addBlock(0, 140, 1064, 6, 1.5, 12, this.mats.gold);

        // Checkpoint 13
        this.addCheckpoint(13, 0, 141.2, 1076, 6);

        // Quantum Matrix Materials
        const quantumMatrix = new THREE.MeshStandardMaterial({
            color: 0x050C1A,
            metalness: 0.9,
            roughness: 0.15
        });
        const quantumCyan = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x00AAFF,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });
        const quantumMagenta = new THREE.MeshStandardMaterial({
            color: 0xFF00AA,
            emissive: 0xFF0066,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });

        // Ascending Quantum Voxel Steps
        const matrixSteps = [
            { x: -5, y: 143.0, z: 1090 },
            { x:  4, y: 145.5, z: 1102 },
            { x: -5, y: 148.0, z: 1114 },
            { x:  4, y: 151.0, z: 1126 },
            { x: -3, y: 154.0, z: 1138 },
            { x:  0, y: 157.0, z: 1150 }
        ];

        matrixSteps.forEach((s, idx) => {
            const mat = (idx % 2 === 0) ? quantumCyan : quantumMagenta;
            this.addBlock(s.x, s.y - 1.5, s.z, 5, 3, 5, quantumMatrix);
            this.addBlock(s.x, s.y + 0.1, s.z, 4.6, 0.25, 4.6, mat);
            this.addCoin(s.x, s.y + 1.8, s.z);
        });

        // 2 High-speed spinning quantum laser hazard beams
        this.addSpinningHazard(0, 147, 1102, 12, 2.8, 'y');
        this.addSpinningHazard(0, 153, 1126, 11, -3.0, 'y');

        // Quantum Matrix Portal Torus
        const portalGeo = new THREE.TorusGeometry(5.0, 0.6, 16, 36);
        const portalMat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x0088FF,
            emissiveIntensity: 1.0,
            wireframe: true
        });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.set(0, 156, 1138);
        this.scene.add(portal);
        this.quantumPortal = portal;

        // Quantum Matrix Apex Zenith Sanctuary
        this.addBlock(0, 159, 1168, 22, 2.5, 22, quantumMatrix);

        // 4 Cyber Data Monoliths
        const monoMat = new THREE.MeshStandardMaterial({
            color: 0x001133,
            emissive: 0x0066FF,
            emissiveIntensity: 0.75
        });
        this.addBlock(-8, 166, 1160, 2, 12, 2, monoMat);
        this.addBlock(8, 166, 1160, 2, 12, 2, monoMat);
        this.addBlock(-8, 166, 1176, 2, 12, 2, monoMat);
        this.addBlock(8, 166, 1176, 2, 12, 2, monoMat);

        // Floating Quantum Singularity Core
        const coreGeo = new THREE.OctahedronGeometry(3.0, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0xFF00FF,
            emissiveIntensity: 1.0,
            roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 166, 1168);
        this.scene.add(core);
        this.quantumCore = core;
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

        // Update & Animate Interactive Mechanical Spring Pads
        if (this.springPads) {
            this.springPads.forEach(sp => {
                if (sp.cooldown > 0) sp.cooldown -= dt;

                // Player proximity and landing check
                const distXZ = Math.hypot(player.position.x - sp.pos.x, player.position.z - sp.pos.z);
                const distY = player.position.y - sp.pos.y;

                if (distXZ < 1.7 && distY >= -0.5 && distY <= 1.4 && player.velocity.y <= 0 && sp.cooldown <= 0) {
                    sp.compression = 1.0;
                    sp.cooldown = 0.45;
                    player.bounceLaunch(sp.strength);
                    if (this.sound) this.sound.playBounce();
                    if (window.game && window.game.particles) {
                        window.game.particles.spawnCoinSparkles(sp.pos);
                    }
                }

                // Smooth mechanical spring recoil
                if (sp.compression > 0.01) {
                    sp.compression *= Math.pow(0.04, dt);
                    const squash = 1.0 - sp.compression * 0.55;
                    sp.coil.scale.y = squash;
                    sp.topDisc.position.y = 0.35 + squash * 1.1;
                } else {
                    sp.coil.scale.y = 1.0;
                    sp.topDisc.position.y = 1.45;
                }
            });
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

        // Master Crystal rotation in Stage 7
        if (this.masterCrystal) {
            this.masterCrystal.rotation.y += dt * 1.5;
            this.masterCrystal.rotation.z += dt * 0.8;
            this.masterCrystal.position.y = 53 + Math.sin(Date.now() * 0.003) * 0.4;
        }

        // Volcanic Core rotation in Stage 8
        if (this.volcanicCore) {
            this.volcanicCore.rotation.x += dt * 1.2;
            this.volcanicCore.rotation.y += dt * 1.8;
            this.volcanicCore.position.y = 63 + Math.sin(Date.now() * 0.004) * 0.5;
        }

        // Celestial Crown rotation in Stage 9
        if (this.celestialCrown) {
            this.celestialCrown.rotation.y += dt * 1.5;
            this.celestialCrown.position.y = 86 + Math.sin(Date.now() * 0.003) * 0.45;
        }

        // Void Dimension animations in Stage 10
        if (this.voidVortex) {
            this.voidVortex.rotation.x += dt * 1.5;
            this.voidVortex.rotation.y += dt * 2.0;
        }
        if (this.voidCore) {
            this.voidCore.rotation.y += dt * 1.8;
            this.voidCore.position.y = 103 + Math.sin(Date.now() * 0.0035) * 0.5;
        }

        // Celestial Aurora animations in Stage 11
        if (this.auroraHalo) {
            this.auroraHalo.rotation.z += dt * 1.2;
            this.auroraHalo.rotation.y += dt * 0.8;
        }
        if (this.auroraStar) {
            this.auroraStar.rotation.y += dt * 2.2;
            this.auroraStar.position.y = 126 + Math.sin(Date.now() * 0.003) * 0.5;
        }

        // Dragon Fire Spire animations in Stage 12
        if (this.dragonCore) {
            this.dragonCore.rotation.y += dt * 1.8;
            this.dragonCore.rotation.x += dt * 0.9;
            this.dragonCore.position.y = 145 + Math.sin(Date.now() * 0.004) * 0.6;
        }

        // Quantum Cyber Matrix animations in Stage 13
        if (this.quantumPortal) {
            this.quantumPortal.rotation.z += dt * 1.5;
            this.quantumPortal.rotation.x += dt * 0.8;
        }
        if (this.quantumCore) {
            this.quantumCore.rotation.y += dt * 2.5;
            this.quantumCore.rotation.z += dt * 1.2;
            this.quantumCore.position.y = 166 + Math.sin(Date.now() * 0.005) * 0.5;
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
