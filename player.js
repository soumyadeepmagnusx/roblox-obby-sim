/**
 * Roblox Avatar Model, Physics, Ragdoll Disintegration & Controls
 */
class RobloxPlayer {
    constructor(scene, soundEngine) {
        this.scene = scene;
        this.sound = soundEngine;

        // Position & Physics
        this.position = new THREE.Vector3(0, 5, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 13.5;
        this.jumpForce = 15.5;
        this.gravity = 36.0;
        this.isGrounded = false;
        this.isDead = false;
        this.health = 100;
        this.facingAngle = 0;

        // Active checkpoint spawn point
        this.spawnPoint = new THREE.Vector3(0, 4, 0);

        // Stats
        this.currentStage = 1;
        this.maxStage = 6;
        this.coins = 0;
        this.deaths = 0;
        this.hasWon = false;

        // Buffs / Effects
        this.boostTimer = 0;
        this.invulnerableTimer = 0;

        // Animation counters
        this.walkTimer = 0;
        this.footstepTimer = 0;

        // Ragdoll pieces array for "Break Joints"
        this.ragdollPieces = [];

        // Build the Roblox avatar rig
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.mesh = this.group;
        this.rotation = this.group.rotation;
        this.buildCharacterRig();

        // Bounding dimensions for collision
        this.width = 1.4;
        this.height = 3.6;
        this.depth = 1.0;
    }

    // Generate classic Roblox smiley face texture on canvas
    createFaceTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Yellow face background
        ctx.fillStyle = '#FFDE00';
        ctx.fillRect(0, 0, 256, 256);

        // Left eye (black oval with shine)
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(80, 95, 14, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.ellipse(176, 95, 14, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye shines
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(84, 88, 5, 0, Math.PI * 2);
        ctx.arc(180, 88, 5, 0, Math.PI * 2);
        ctx.fill();

        // Roblox classic open smile
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(128, 140, 52, 0.15 * Math.PI, 0.85 * Math.PI, false);
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111111';
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // Name tag & Health bar billboard above avatar
    createNameplate() {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        // Draw Player Name
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(20, 10, 260, 40, 10);
        ctx.fill();

        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('Player1', 150, 38);

        // Health bar background
        ctx.fillStyle = '#444444';
        ctx.roundRect(30, 58, 240, 18, 6);
        ctx.fill();

        // Green health fill
        ctx.fillStyle = '#2ECC71';
        ctx.roundRect(32, 60, 236, 14, 5);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(0, 4.3, 0);
        sprite.scale.set(3.5, 1.2, 1);
        return sprite;
    }

    // Assemble the iconic R6 blocky body
    buildCharacterRig() {
        const yellowMat = new THREE.MeshLambertMaterial({ color: 0xFFDE00 });
        const blueMat = new THREE.MeshLambertMaterial({ color: 0x0D69AB });
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x00A859 });

        // Head with Face texture
        const faceTex = this.createFaceTexture();
        const headMats = [
            yellowMat, // Right
            yellowMat, // Left
            yellowMat, // Top
            yellowMat, // Bottom
            new THREE.MeshLambertMaterial({ map: faceTex }), // Front face
            yellowMat  // Back
        ];
        const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        this.head = new THREE.Mesh(headGeo, headMats);
        this.head.position.set(0, 2.6, 0);
        this.head.castShadow = true;
        this.group.add(this.head);

        // Torso
        const torsoGeo = new THREE.BoxGeometry(2.0, 2.0, 1.0);
        this.torso = new THREE.Mesh(torsoGeo, blueMat);
        this.torso.position.set(0, 1.0, 0);
        this.torso.castShadow = true;
        this.group.add(this.torso);

        // Arms with shoulder pivot groups
        const armGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
        armGeo.translate(0, -0.9, 0); // shift origin to shoulder

        // Left Arm
        this.leftArmPivot = new THREE.Group();
        this.leftArmPivot.position.set(-1.5, 1.9, 0);
        this.leftArm = new THREE.Mesh(armGeo, yellowMat);
        this.leftArm.castShadow = true;
        this.leftArmPivot.add(this.leftArm);
        this.group.add(this.leftArmPivot);

        // Right Arm
        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(1.5, 1.9, 0);
        this.rightArm = new THREE.Mesh(armGeo, yellowMat);
        this.rightArm.castShadow = true;
        this.rightArmPivot.add(this.rightArm);
        this.group.add(this.rightArmPivot);

        // Legs with hip pivot groups
        const legGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
        legGeo.translate(0, -1.0, 0); // shift origin to hip

        // Left Leg
        this.leftLegPivot = new THREE.Group();
        this.leftLegPivot.position.set(-0.5, 0.0, 0);
        this.leftLeg = new THREE.Mesh(legGeo, greenMat);
        this.leftLeg.castShadow = true;
        this.leftLegPivot.add(this.leftLeg);
        this.group.add(this.leftLegPivot);

        // Right Leg
        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0.5, 0.0, 0);
        this.rightLeg = new THREE.Mesh(legGeo, greenMat);
        this.rightLeg.castShadow = true;
        this.rightLegPivot.add(this.rightLeg);
        this.group.add(this.rightLegPivot);

        // Winner Crown / Halo (hidden until victory!)
        const crownGeo = new THREE.TorusGeometry(0.7, 0.12, 8, 24);
        const crownMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x997700
        });
        this.crown = new THREE.Mesh(crownGeo, crownMat);
        this.crown.rotation.x = Math.PI / 2;
        this.crown.position.set(0, 3.5, 0);
        this.crown.visible = false;
        this.group.add(this.crown);

        // Nameplate Sprite
        this.nameplate = this.createNameplate();
        this.group.add(this.nameplate);

        // Set initial world position
        this.group.position.copy(this.position);
    }

    // Award Winner Crown when beating the Obby
    giveWinnerCrown() {
        this.crown.visible = true;
        this.hasWon = true;
    }

    // Classic Roblox "Break Joints" Ragdoll Explosion on death/reset
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deaths++;
        this.health = 0;
        this.sound.playOof();

        // Hide main character rig
        this.group.visible = false;

        // Disintegrate into 6 separate physics blocks
        const partsInfo = [
            { geo: new THREE.BoxGeometry(1.2, 1.2, 1.2), color: 0xFFDE00, pos: new THREE.Vector3(0, 2.6, 0) },
            { geo: new THREE.BoxGeometry(2.0, 2.0, 1.0), color: 0x0D69AB, pos: new THREE.Vector3(0, 1.0, 0) },
            { geo: new THREE.BoxGeometry(1.0, 2.0, 1.0), color: 0xFFDE00, pos: new THREE.Vector3(-1.5, 1.0, 0) },
            { geo: new THREE.BoxGeometry(1.0, 2.0, 1.0), color: 0xFFDE00, pos: new THREE.Vector3(1.5, 1.0, 0) },
            { geo: new THREE.BoxGeometry(1.0, 2.0, 1.0), color: 0x00A859, pos: new THREE.Vector3(-0.5, -1.0, 0) },
            { geo: new THREE.BoxGeometry(1.0, 2.0, 1.0), color: 0x00A859, pos: new THREE.Vector3(0.5, -1.0, 0) },
        ];

        this.ragdollPieces = [];
        partsInfo.forEach(p => {
            const mat = new THREE.MeshLambertMaterial({ color: p.color });
            const mesh = new THREE.Mesh(p.geo, mat);
            mesh.castShadow = true;
            mesh.position.copy(this.position).add(p.pos);

            // Give random explosion impulse and tumble rotation
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 16,
                Math.random() * 12 + 6,
                (Math.random() - 0.5) * 16
            );
            const rotVel = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            this.scene.add(mesh);
            this.ragdollPieces.push({ mesh, vel, rotVel });
        });

        // Respawn after 1.2 seconds
        setTimeout(() => {
            this.respawn();
        }, 1200);
    }

    // Respawn character at active checkpoint
    respawn() {
        // Clean up ragdoll pieces
        this.ragdollPieces.forEach(p => {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        this.ragdollPieces = [];

        // Reset position to active checkpoint
        this.position.copy(this.spawnPoint);
        this.position.y += 2.0; // slight drop onto pad
        this.velocity.set(0, 0, 0);
        this.health = 100;
        this.isDead = false;
        this.group.visible = true;

        // Reset limb angles
        this.leftArmPivot.rotation.set(0, 0, 0);
        this.rightArmPivot.rotation.set(0, 0, 0);
        this.leftLegPivot.rotation.set(0, 0, 0);
        this.rightLegPivot.rotation.set(0, 0, 0);

        // Spawn sparkle flash effect
        this.createSpawnEffect(this.position);
    }

    // Flash particle burst at spawn point
    createSpawnEffect(pos) {
        const pGeo = new THREE.BufferGeometry();
        const count = 30;
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y + 1;
            positions[i * 3 + 2] = pos.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 8
            ));
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({
            color: 0x00FF88,
            size: 0.4,
            transparent: true,
            opacity: 1
        });
        const particles = new THREE.Points(pGeo, pMat);
        this.scene.add(particles);

        let life = 0;
        const interval = setInterval(() => {
            life += 0.05;
            const posAttr = pGeo.attributes.position;
            for (let i = 0; i < count; i++) {
                posAttr.setXYZ(
                    i,
                    posAttr.getX(i) + velocities[i].x * 0.05,
                    posAttr.getY(i) + velocities[i].y * 0.05,
                    posAttr.getZ(i) + velocities[i].z * 0.05
                );
            }
            posAttr.needsUpdate = true;
            pMat.opacity = Math.max(0, 1 - life * 1.8);

            if (life >= 0.6) {
                clearInterval(interval);
                this.scene.remove(particles);
                pGeo.dispose();
                pMat.dispose();
            }
        }, 50);
    }

    // Set new checkpoint spawn
    setCheckpoint(stageNumber, position) {
        if (stageNumber > this.currentStage) {
            this.currentStage = stageNumber;
            this.spawnPoint.copy(position);
            this.sound.playCheckpoint();
            this.createSpawnEffect(position);
            return true;
        }
        return false;
    }

    // Super Trampoline launch
    bounceLaunch(strength = 28) {
        this.velocity.y = strength;
        this.isGrounded = false;
        this.sound.playBounce();
    }

    // Speed boost pad
    applySpeedBoost(multiplier = 2.0, duration = 3.0) {
        this.boostTimer = duration;
        this.sound.playBoost();
    }

    // Update Player & Physics Loop
    update(dt, inputState, cameraYaw, world) {
        // Update ragdoll pieces physics if dead
        if (this.isDead) {
            this.ragdollPieces.forEach(p => {
                p.vel.y -= this.gravity * dt;
                p.mesh.position.addScaledVector(p.vel, dt);
                p.mesh.rotation.x += p.rotVel.x * dt;
                p.mesh.rotation.y += p.rotVel.y * dt;
                p.mesh.rotation.z += p.rotVel.z * dt;

                // Simple floor bounce at y = 0
                if (p.mesh.position.y < 0) {
                    p.mesh.position.y = 0;
                    p.vel.y *= -0.4;
                    p.vel.x *= 0.8;
                    p.vel.z *= 0.8;
                }
            });
            return;
        }

        // Apply speed boost timer & gear buffs
        let currentSpeed = this.speed;
        if (this.boostTimer > 0) {
            this.boostTimer -= dt;
            currentSpeed *= 1.8;
        }
        if (window.game && window.game.gears) {
            currentSpeed *= window.game.gears.speedMultiplier;
        }

        // Process horizontal movement based on Camera Yaw
        let moveX = 0;
        let moveZ = 0;

        if (inputState.forward) moveZ -= 1;
        if (inputState.backward) moveZ += 1;
        if (inputState.left) moveX -= 1;
        if (inputState.right) moveX += 1;

        const isMoving = (moveX !== 0 || moveZ !== 0);

        if (isMoving) {
            const moveVec = new THREE.Vector2(moveX, moveZ).normalize();

            // Rotate direction vector by camera yaw
            const rotatedX = moveVec.x * Math.cos(cameraYaw) - moveVec.y * Math.sin(cameraYaw);
            const rotatedZ = moveVec.x * Math.sin(cameraYaw) + moveVec.y * Math.cos(cameraYaw);

            this.velocity.x = rotatedX * currentSpeed;
            this.velocity.z = rotatedZ * currentSpeed;

            // Target facing angle
            const targetAngle = Math.atan2(rotatedX, rotatedZ);
            // Smoothly rotate character toward movement
            let diff = targetAngle - this.facingAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.facingAngle += diff * Math.min(1, dt * 14);

            this.group.rotation.y = this.facingAngle;

            // Footstep audio
            this.footstepTimer += dt;
            if (this.footstepTimer > 0.32 && this.isGrounded) {
                this.sound.playStep();
                this.footstepTimer = 0;
            }
        } else {
            // Decelerate smoothly
            this.velocity.x *= 0.65;
            this.velocity.z *= 0.65;
            if (Math.abs(this.velocity.x) < 0.05) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.05) this.velocity.z = 0;
        }

        // Jump
        if (inputState.jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.sound.playJump();
        }

        // Apply Gravity
        this.velocity.y -= this.gravity * dt;
        if (this.velocity.y < -45) this.velocity.y = -45; // Terminal velocity

        // Continuous Collision Detection (CCD) via Security Engine to prevent clipping & glitching
        let collisionResult;
        if (window.game && window.game.security) {
            collisionResult = window.game.security.solveAntiGlitchMovement(
                this.position,
                this.velocity,
                dt,
                this.width,
                this.height,
                this.depth
            );
        } else {
            const deltaPos = new THREE.Vector3(this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);
            collisionResult = world.resolvePlayerCollision(this.position, deltaPos, this.width, this.height, this.depth);
        }

        this.position.copy(collisionResult.newPosition);
        this.isGrounded = collisionResult.grounded;

        if (this.isGrounded && this.velocity.y < 0) {
            this.velocity.y = 0;
        }

        // If standing on a moving platform, transfer platform translation
        if (collisionResult.platformDelta) {
            this.position.add(collisionResult.platformDelta);
        }

        // Check hazard interaction (Lava / Killbrick)
        if (collisionResult.touchedLava) {
            this.die();
            return;
        }

        // Check bounce pad trigger
        if (collisionResult.touchedBouncePad) {
            this.bounceLaunch(26);
        }

        // Check speed boost strip trigger
        if (collisionResult.touchedBoostPad) {
            this.applySpeedBoost(2.0, 3.0);
        }

        // Fall into the void kill boundary
        if (this.position.y < -25) {
            this.die();
            return;
        }

        // Sync visual mesh to physics position
        this.group.position.copy(this.position);

        // Character Limb Animation (Check Emotes first)
        let isEmoting = false;
        if (window.game && window.game.emotes) {
            isEmoting = window.game.emotes.update(dt, isMoving, this.isGrounded);
        }

        if (!isEmoting) {
            if (isMoving && this.isGrounded) {
                this.walkTimer += dt * 14;
                const swing = Math.sin(this.walkTimer) * 0.75;

                // Arms and legs swing in opposite phase
                this.leftArmPivot.rotation.x = -swing;
                this.rightArmPivot.rotation.x = swing;
                this.leftLegPivot.rotation.x = swing;
                this.rightLegPivot.rotation.x = -swing;
            } else if (!this.isGrounded) {
                // Jumping / Falling pose
                this.leftArmPivot.rotation.x = -1.2;
                this.rightArmPivot.rotation.x = -1.2;
                this.leftLegPivot.rotation.x = 0.3;
                this.rightLegPivot.rotation.x = -0.3;
            } else {
                // Idle breathing
                this.walkTimer += dt * 2.5;
                const idle = Math.sin(this.walkTimer) * 0.05;
                this.leftArmPivot.rotation.x = idle;
                this.rightArmPivot.rotation.x = -idle;
                this.leftLegPivot.rotation.x = 0;
                this.rightLegPivot.rotation.x = 0;
            }
        }

        // Halo spin if winner
        if (this.crown.visible) {
            this.crown.rotation.z += dt * 2.0;
        }
    }
}

window.RobloxPlayer = RobloxPlayer;
