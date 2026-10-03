/**
 * Simulated Multiplayer Bots Engine
 * Spawns AI players that run the Obby, jump, ragdoll, chat, and appear on Leaderboard
 */
class RobloxBots {
    constructor(scene, sound, ui) {
        this.scene = scene;
        this.sound = sound;
        this.ui = ui;

        this.bots = [];

        // Waypoints across the Obby for bots to follow
        this.waypoints = [
            new THREE.Vector3(0, 1, 0),    // Spawn
            new THREE.Vector3(0, 1, 10),
            new THREE.Vector3(-3, 2, 22),  // Stage 1 Rainbow
            new THREE.Vector3(3, 3, 34),
            new THREE.Vector3(0, 4.5, 45),
            new THREE.Vector3(0, 7.5, 60),  // Stage 2 Checkpoint
            new THREE.Vector3(-3, 8.5, 70), // Lava Leap
            new THREE.Vector3(2, 9, 82),
            new THREE.Vector3(-2, 10, 94),
            new THREE.Vector3(0, 11.5, 112), // Stage 3 Checkpoint
            new THREE.Vector3(0, 12, 130),   // Spinning sweeper
            new THREE.Vector3(0, 12, 150),
            new THREE.Vector3(0, 12, 170),   // Stage 4 Checkpoint
            new THREE.Vector3(-3, 12.5, 185), // Disappearing blocks
            new THREE.Vector3(3, 13, 200),
            new THREE.Vector3(0, 14.5, 226),  // Stage 5 Checkpoint
            new THREE.Vector3(0, 15, 240),    // Speed runway
            new THREE.Vector3(0, 33, 288),    // Summit
            new THREE.Vector3(0, 33, 330)     // Trophy
        ];

        this.chatLines = [
            "yo watch out for that spinning laser!",
            "oof that lava got me again lol",
            "check out my jump skills",
            "the trampoline stage is so cool",
            "who's leading the leaderboard right now?",
            "gg almost at the trophy!",
            "press Shift for shift-lock it makes jumps easier",
            "nice avatar Player1!",
            "oof",
            "lets goooo stage cleared"
        ];

        this.initBots();
        this.initChatTimer();
    }

    createBotNameplate(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 70;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.roundRect(10, 5, 236, 50, 8);
        ctx.fill();

        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(name, 128, 38);

        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
        sprite.position.set(0, 4.3, 0);
        sprite.scale.set(3.2, 1, 1);
        return sprite;
    }

    createBotMesh(config) {
        const group = new THREE.Group();
        const yellowMat = new THREE.MeshLambertMaterial({ color: config.head });
        const torsoMat = new THREE.MeshLambertMaterial({ color: config.torso });
        const armMat = new THREE.MeshLambertMaterial({ color: config.arm });
        const legMat = new THREE.MeshLambertMaterial({ color: config.leg });

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), yellowMat);
        head.position.set(0, 2.6, 0);
        head.castShadow = true;
        group.add(head);

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMat);
        torso.position.set(0, 1, 0);
        torso.castShadow = true;
        group.add(torso);

        // Arms
        const armGeo = new THREE.BoxGeometry(1, 2, 1);
        armGeo.translate(0, -0.9, 0);
        const leftArmPivot = new THREE.Group();
        leftArmPivot.position.set(-1.5, 1.9, 0);
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.castShadow = true;
        leftArmPivot.add(leftArm);
        group.add(leftArmPivot);

        const rightArmPivot = new THREE.Group();
        rightArmPivot.position.set(1.5, 1.9, 0);
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.castShadow = true;
        rightArmPivot.add(rightArm);
        group.add(rightArmPivot);

        // Legs
        const legGeo = new THREE.BoxGeometry(1, 2, 1);
        legGeo.translate(0, -1, 0);
        const leftLegPivot = new THREE.Group();
        leftLegPivot.position.set(-0.5, 0, 0);
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.castShadow = true;
        leftLegPivot.add(leftLeg);
        group.add(leftLegPivot);

        const rightLegPivot = new THREE.Group();
        rightLegPivot.position.set(0.5, 0, 0);
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.castShadow = true;
        rightLegPivot.add(rightLeg);
        group.add(rightLegPivot);

        // Nameplate
        const nameplate = this.createBotNameplate(config.name);
        group.add(nameplate);

        this.scene.add(group);

        return {
            group,
            leftArmPivot,
            rightArmPivot,
            leftLegPivot,
            rightLegPivot
        };
    }

    initBots() {
        const botConfigs = [
            { name: "Guest_1337", head: 0xFFDE00, torso: 0x111111, arm: 0xFFDE00, leg: 0x7F8C8D, speed: 8.5 },
            { name: "NoobMaster", head: 0xFFDE00, torso: 0x0D69AB, arm: 0xFFDE00, leg: 0x00A859, speed: 7.2 },
            { name: "Builderman", head: 0xF39C12, torso: 0xE67E22, arm: 0xF39C12, leg: 0x2C3E50, speed: 6.8 },
            { name: "SpeedyGamer", head: 0x00FFFF, torso: 0x3498DB, arm: 0x00FFFF, leg: 0x1ABC9C, speed: 9.8 }
        ];

        botConfigs.forEach((cfg, idx) => {
            const rig = this.createBotMesh(cfg);
            const startWp = idx * 2; // staggered start positions
            const initialPos = this.waypoints[startWp % this.waypoints.length].clone();
            rig.group.position.copy(initialPos);

            this.bots.push({
                name: cfg.name,
                rig,
                speed: cfg.speed,
                currentWpIndex: startWp,
                position: initialPos,
                walkTimer: Math.random() * 10,
                isRagdoll: false,
                stage: Math.min(6, Math.floor(startWp / 3) + 1),
                coins: Math.floor(Math.random() * 8) + 2,
                deaths: Math.floor(Math.random() * 3)
            });
        });
    }

    initChatTimer() {
        setInterval(() => {
            if (this.bots.length === 0 || !this.ui) return;
            const randomBot = this.bots[Math.floor(Math.random() * this.bots.length)];
            const randomLine = this.chatLines[Math.floor(Math.random() * this.chatLines.length)];
            this.ui.addChatMessage(randomBot.name, randomLine, '#F39C12');

            if (window.game && window.game.speechBubbles && randomBot.rig && randomBot.rig.group) {
                window.game.speechBubbles.showBubble(randomBot.name, randomBot.rig.group, randomLine);
            }
        }, 12000);
    }

    update(dt) {
        this.bots.forEach(bot => {
            if (bot.isRagdoll) return;

            const targetWp = this.waypoints[bot.currentWpIndex];
            const toTarget = new THREE.Vector3().subVectors(targetWp, bot.position);
            const dist = toTarget.length();

            if (dist < 1.5) {
                // Reached waypoint, advance to next
                bot.currentWpIndex++;
                if (bot.currentWpIndex >= this.waypoints.length) {
                    bot.currentWpIndex = 0; // loop back to spawn
                    bot.position.copy(this.waypoints[0]);
                }
                bot.stage = Math.min(6, Math.floor(bot.currentWpIndex / 3) + 1);
            } else {
                // Move towards waypoint
                toTarget.normalize();
                bot.position.addScaledVector(toTarget, bot.speed * dt);

                // Rotate to face direction
                const angle = Math.atan2(toTarget.x, toTarget.z);
                bot.rig.group.rotation.y = angle;

                // Animate swinging limbs
                bot.walkTimer += dt * 12;
                const swing = Math.sin(bot.walkTimer) * 0.7;
                bot.rig.leftArmPivot.rotation.x = -swing;
                bot.rig.rightArmPivot.rotation.x = swing;
                bot.rig.leftLegPivot.rotation.x = swing;
                bot.rig.rightLegPivot.rotation.x = -swing;
            }

            // Sync visual group position
            bot.rig.group.position.copy(bot.position);
        });
    }
}

window.RobloxBots = RobloxBots;
