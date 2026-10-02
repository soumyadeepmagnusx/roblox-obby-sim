/**
 * Physics Objects & Gravity Gun Puzzle Engine
 * Interactive pushable/throwable crates, momentum physics, and pressure plate puzzle triggers
 */
class RobloxPhysicsEngine {
    constructor(scene, world, sound) {
        this.scene = scene;
        this.world = world;
        this.sound = sound;

        // Interactive physics objects (crates/boulders)
        this.objects = [];

        // Pressure plates & puzzle doors
        this.pressurePlates = [];

        // Currently grabbed object
        this.grabbedObject = null;
        this.grabDistance = 4.5;

        this.initPuzzles();
    }

    // Spawn an interactive physics crate
    addPhysicsCrate(x, y, z, size = 1.6, color = 0xCD853F) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.6,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const obj = {
            mesh,
            size,
            halfSize: size / 2,
            velocity: new THREE.Vector3(0, 0, 0),
            isGrabbed: false,
            mass: 2.0,
            isGrounded: false
        };

        this.objects.push(obj);
        return obj;
    }

    // Add a pressure plate linked to a bridge / puzzle obstacle
    addPressurePlate(x, y, z, targetBridge) {
        const plateGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.25, 24);
        const plateMat = new THREE.MeshStandardMaterial({
            color: 0xE74C3C,
            emissive: 0x551100,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(plateGeo, plateMat);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const plate = {
            mesh,
            mat: plateMat,
            baseY: y,
            activeY: y - 0.15,
            isPressed: false,
            targetBridge
        };
        this.pressurePlates.push(plate);
        return plate;
    }

    initPuzzles() {
        // Create a puzzle bridge on Stage 1 / Stage 2 boundary
        // Retractable bridge platform
        const bridgeCol = this.world.addBlock(0, -999, 115, 6, 1, 14, this.world.mats.gold, 'solid');
        bridgeCol.mesh.visible = false; // initially inactive

        // Pressure plate on the ledge
        const plate = this.addPressurePlate(6, 10.7, 108, bridgeCol);

        // Physics puzzle crates that players can push or throw
        this.addPhysicsCrate(-4, 12, 106, 1.8, 0xD35400);
        this.addPhysicsCrate(0, 2, 8, 1.6, 0x3498DB); // Spawn island crate for practice!
    }

    // Pick up or drop targeted physics object (Gravity Gun mechanism)
    interactGrab(camera, player) {
        if (this.grabbedObject) {
            // Throw object forward with high impulse!
            const throwDir = new THREE.Vector3();
            camera.getWorldDirection(throwDir);
            this.grabbedObject.velocity.copy(throwDir.multiplyScalar(28));
            this.grabbedObject.isGrabbed = false;
            this.sound.playBoost();
            this.grabbedObject = null;
            return 'thrown';
        } else {
            // Raycast from camera center to find crate
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const meshes = this.objects.map(o => o.mesh);
            const hits = raycaster.intersectObjects(meshes, false);

            if (hits.length > 0 && hits[0].distance < 12) {
                const targetMesh = hits[0].object;
                const obj = this.objects.find(o => o.mesh === targetMesh);
                if (obj) {
                    this.grabbedObject = obj;
                    obj.isGrabbed = true;
                    this.sound.playJump();
                    return 'grabbed';
                }
            }
        }
        return 'none';
    }

    update(dt, player, camera) {
        // Update grabbed object to float in front of camera
        if (this.grabbedObject) {
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            const holdPos = camera.position.clone().add(camDir.multiplyScalar(this.grabDistance));
            holdPos.y = Math.max(holdPos.y, player.position.y + 0.5);

            this.grabbedObject.mesh.position.lerp(holdPos, Math.min(1, dt * 18));
            this.grabbedObject.velocity.set(0, 0, 0);
        }

        // Update physics for all objects
        this.objects.forEach(obj => {
            if (obj.isGrabbed) return;

            // Gravity
            obj.velocity.y -= 32 * dt;
            if (obj.velocity.y < -40) obj.velocity.y = -40;

            // Tentative movement
            let newX = obj.mesh.position.x + obj.velocity.x * dt;
            let newY = obj.mesh.position.y + obj.velocity.y * dt;
            let newZ = obj.mesh.position.z + obj.velocity.z * dt;

            // Collide against world blocks
            obj.isGrounded = false;
            for (let i = 0; i < this.world.colliders.length; i++) {
                const c = this.world.colliders[i];
                if (newX + obj.halfSize > c.min.x && newX - obj.halfSize < c.max.x &&
                    newZ + obj.halfSize > c.min.z && newZ - obj.halfSize < c.max.z) {
                    // Vertical collision
                    if (obj.mesh.position.y - obj.halfSize >= c.max.y - 0.4 && newY - obj.halfSize <= c.max.y) {
                        newY = c.max.y + obj.halfSize;
                        obj.velocity.y = 0;
                        obj.isGrounded = true;
                        // Ground friction
                        obj.velocity.x *= 0.85;
                        obj.velocity.z *= 0.85;
                    }
                }
            }

            // Player pushing object
            const pDist = new THREE.Vector2(player.position.x - newX, player.position.z - newZ).length();
            if (pDist < obj.halfSize + 1.0 && Math.abs(player.position.y - newY) < 1.8) {
                const pushDir = new THREE.Vector3(newX - player.position.x, 0, newZ - player.position.z).normalize();
                obj.velocity.x += pushDir.x * 12;
                obj.velocity.z += pushDir.z * 12;
            }

            // Apply position
            obj.mesh.position.set(newX, newY, newZ);

            // Void respawn
            if (obj.mesh.position.y < -20) {
                obj.mesh.position.set(0, 5, 8);
                obj.velocity.set(0, 0, 0);
            }
        });

        // Check pressure plates
        this.pressurePlates.forEach(plate => {
            let pressed = false;

            // Check if player is standing on it
            if (player.position.distanceTo(plate.mesh.position) < 2.0 && Math.abs(player.position.y - plate.baseY) < 1.0) {
                pressed = true;
            }

            // Check if any physics crate is on it
            this.objects.forEach(obj => {
                if (obj.mesh.position.distanceTo(plate.mesh.position) < 2.2 && Math.abs(obj.mesh.position.y - plate.baseY) < 1.5) {
                    pressed = true;
                }
            });

            if (pressed && !plate.isPressed) {
                plate.isPressed = true;
                plate.mesh.position.y = plate.activeY;
                plate.mat.color.setHex(0x00FF88); // Turn green
                plate.mat.emissive.setHex(0x00AA44);
                this.sound.playCheckpoint();

                // Activate linked bridge
                if (plate.targetBridge) {
                    plate.targetBridge.mesh.position.y = 10.5;
                    plate.targetBridge.mesh.visible = true;
                    plate.targetBridge.min.y = 10.0;
                    plate.targetBridge.max.y = 11.0;
                    if (window.game && window.game.ui) {
                        window.game.ui.addChatMessage('Puzzle', '★ Pressure Plate Activated! Golden Bridge Raised! ★', '#FFD700');
                    }
                }
            } else if (!pressed && plate.isPressed) {
                plate.isPressed = false;
                plate.mesh.position.y = plate.baseY;
                plate.mat.color.setHex(0xE74C3C);
                plate.mat.emissive.setHex(0x551100);
            }
        });
    }
}

window.RobloxPhysicsEngine = RobloxPhysicsEngine;
