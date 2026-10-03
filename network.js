/**
 * Roblox Client-Side Multiplayer Network Manager
 * Synchronizes real players over WebSockets with:
 * - Room Switching & Sharing (?room=XYZ)
 * - PvP Combat Damage & Rocket Projectiles
 * - Collaborative Studio Block Placement
 * - Heartbeat Ping & Latency Telemetry
 * - Dead-reckoning limb interpolation
 */
class RobloxNetwork {
    constructor(player, scene, ui, sound) {
        this.player = player;
        this.scene = scene;
        this.ui = ui;
        this.sound = sound;

        this.ws = null;
        this.connected = false;
        this.myId = null;
        this.currentRoom = 'Lobby';
        this.ping = 0;

        // Remote players: Map<id, { rig, targetPos, targetRot, info, nameplate }>
        this.remotePlayers = new Map();

        this.sendInterval = null;
        this.pingInterval = null;

        // Check URL for ?room=RoomCode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('room')) {
            this.currentRoom = urlParams.get('room').trim() || 'Lobby';
        }

        this.initConnection();
    }

    initConnection() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:8080';
        const wsUrl = `${protocol}//${host}/ws?room=${encodeURIComponent(this.currentRoom)}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.connected = true;
                this.ui.addChatMessage('Server', `Connected to Room [${this.currentRoom}]! Real players can join.`, '#00FF88');
                this.startSync();
                this.startPing();
                this.updateRoomUI();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Failed to parse network message:', e);
                }
            };

            this.ws.onclose = () => {
                this.connected = false;
                this.stopSync();
                this.stopPing();
                this.updatePingUI('Offline');
            };

            this.ws.onerror = () => {
                this.connected = false;
            };
        } catch (e) {
            console.log('[Multiplayer] Running in local offline mode');
        }
    }

    startSync() {
        if (this.sendInterval) clearInterval(this.sendInterval);
        this.sendInterval = setInterval(() => {
            if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

            const payload = {
                x: this.player.position.x,
                y: this.player.position.y,
                z: this.player.position.z,
                yaw: this.player.facingAngle,
                isGrounded: this.player.isGrounded,
                isMoving: Math.abs(this.player.velocity.x) > 0.1 || Math.abs(this.player.velocity.z) > 0.1,
                stage: this.player.currentStage,
                coins: window.game.collectibles ? window.game.collectibles.coins : 0,
                hp: window.game.combat ? window.game.combat.hp : 100,
                hat: window.game.shop ? window.game.shop.currentHat : 'none',
                skin: window.game.shop ? window.game.shop.currentSkin : 'noob',
                gear: window.game.gears ? window.game.gears.activeSlot : 0,
                pet: window.game.pets ? window.game.pets.activePetId : 'none',
                hoverboard: window.game.vehicles ? window.game.vehicles.hoverboardActive : false,
                jetpack: window.game.vehicles ? window.game.vehicles.jetpackActive : false
            };

            this.ws.send(JSON.stringify({
                type: 'state_update',
                payload
            }));
        }, 50); // 20 Hz sync
    }

    stopSync() {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }
    }

    startPing() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now()
                }));
            }
        }, 2000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    joinRoom(roomName) {
        if (!roomName) return;
        const target = roomName.trim();
        this.currentRoom = target;

        // Clear local remote players
        this.remotePlayers.forEach(p => this.scene.remove(p.group));
        this.remotePlayers.clear();

        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'join_room',
                room: target
            }));
        }

        // Update URL query string without reloading page
        const newUrl = `${window.location.pathname}?room=${encodeURIComponent(target)}`;
        window.history.replaceState(null, '', newUrl);

        this.updateRoomUI();
        this.ui.addChatMessage('System', `Switched to Room: [${target}]`, '#FFD700');
    }

    sendCombatHit(targetId, dmg, isCrit, knockback) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'combat_hit',
                targetId,
                damage: dmg,
                crit: isCrit,
                knockback,
                attackerName: this.myId || 'Player'
            }));
        }
    }

    sendRocketFire(origin, dir) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'rocket_fire',
                origin: { x: origin.x, y: origin.y, z: origin.z },
                dir: { x: dir.x, y: dir.y, z: dir.z }
            }));
        }
    }

    handleMessage(data) {
        if (data.type === 'welcome') {
            this.myId = data.id;
            this.currentRoom = data.room || this.currentRoom;
            console.log('[Multiplayer] Joined as', this.myId, 'in Room', this.currentRoom);

            if (data.players) {
                data.players.forEach(p => {
                    if (p.id !== this.myId) {
                        this.updateRemotePlayer(p.id, p);
                    }
                });
            }
            this.updateRoomUI();

        } else if (data.type === 'room_joined') {
            this.currentRoom = data.room;
            this.updateRoomUI();
            if (data.players) {
                data.players.forEach(p => {
                    if (p.id !== this.myId) {
                        this.updateRemotePlayer(p.id, p);
                    }
                });
            }

        } else if (data.type === 'player_update') {
            this.updateRemotePlayer(data.id, data.payload);

        } else if (data.type === 'player_leave') {
            this.removeRemotePlayer(data.id);

        } else if (data.type === 'combat_hit') {
            if (data.targetId === this.myId) {
                // Incoming damage to local player!
                if (window.game && window.game.combat) {
                    window.game.combat.takeDamage(data.damage, data.crit, data.attackerName);
                }
            } else if (this.remotePlayers.has(data.targetId)) {
                // Visual popup over target remote player
                const rp = this.remotePlayers.get(data.targetId);
                if (window.game && window.game.particles) {
                    window.game.particles.spawnFloatingText(
                        rp.group.position,
                        data.crit ? `CRIT -${data.damage}!` : `-${data.damage}`,
                        data.crit
                    );
                }
            }

        } else if (data.type === 'rocket_fire') {
            // Spawn remote rocket
            if (window.game && window.game.combat && data.shooterId !== this.myId) {
                const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
                const dir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);

                const rocketGroup = new THREE.Group();
                const bodyGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
                bodyGeom.rotateX(Math.PI / 2);
                const bodyMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, metalness: 0.6 });
                rocketGroup.add(new THREE.Mesh(bodyGeom, bodyMat));

                rocketGroup.position.copy(origin);
                rocketGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
                this.scene.add(rocketGroup);

                window.game.combat.rockets.push({
                    mesh: rocketGroup,
                    dir,
                    speed: 40.0,
                    life: 4.0,
                    shooter: data.shooterId
                });
            }

        } else if (data.type === 'pong') {
            this.ping = Math.max(1, Date.now() - data.timestamp);
            this.updatePingUI(`${this.ping}ms`);

        } else if (data.type === 'webrtc_signal') {
            if (window.game && window.game.voice) {
                window.game.voice.handleSignal(data.from, data.data);
            }

        } else if (data.type === 'chat') {
            if (data.id !== this.myId) {
                this.ui.addChatMessage(data.name || data.id, data.message, '#00D0FF');
                const rp = this.remotePlayers.get(data.id);
                if (rp && window.game && window.game.speechBubbles) {
                    window.game.speechBubbles.showBubble(data.id, rp.group, data.message);
                }
            }

        } else if (data.type === 'remote_block_place') {
            if (window.game && window.game.builder) {
                window.game.builder.receiveRemoteBlockPlace(data.data);
            }

        } else if (data.type === 'remote_block_delete') {
            if (window.game && window.game.builder) {
                window.game.builder.receiveRemoteBlockDelete(data.pos);
            }
        }
    }

    broadcastBlockPlace(data) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'block_place',
                data
            }));
        }
    }

    broadcastBlockDelete(pos) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'block_delete',
                pos
            }));
        }
    }

    sendChat(text) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'chat',
                message: text,
                name: this.myId || 'Player1'
            }));
        }
    }

    updatePingUI(str) {
        const pingEl = document.getElementById('stat-ping');
        if (pingEl) {
            pingEl.textContent = str;
        }
    }

    updateRoomUI() {
        const roomEl = document.getElementById('stat-room');
        if (roomEl) {
            roomEl.textContent = this.currentRoom;
        }
        const inviteInput = document.getElementById('invite-link-input');
        if (inviteInput) {
            inviteInput.value = window.location.href;
        }
    }

    createRemotePlayerRig(id, skinKey = 'noob') {
        const skins = window.game.shop ? window.game.shop.skins : null;
        const s = (skins && skins[skinKey]) ? skins[skinKey] : { head: 0xFFDE00, torso: 0x0D69AB, arm: 0xFFDE00, leg: 0x00A859 };

        const group = new THREE.Group();
        const yellowMat = new THREE.MeshLambertMaterial({ color: s.head });
        const torsoMat = new THREE.MeshLambertMaterial({ color: s.torso });
        const armMat = new THREE.MeshLambertMaterial({ color: s.arm });
        const legMat = new THREE.MeshLambertMaterial({ color: s.leg });

        const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), yellowMat);
        head.position.set(0, 2.6, 0);
        group.add(head);

        const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMat);
        torso.position.set(0, 1, 0);
        group.add(torso);

        const armGeo = new THREE.BoxGeometry(1, 2, 1);
        armGeo.translate(0, -0.9, 0);
        const lArm = new THREE.Group(); lArm.position.set(-1.5, 1.9, 0);
        lArm.add(new THREE.Mesh(armGeo, armMat));
        const rArm = new THREE.Group(); rArm.position.set(1.5, 1.9, 0);
        rArm.add(new THREE.Mesh(armGeo, armMat));
        group.add(lArm, rArm);

        const legGeo = new THREE.BoxGeometry(1, 2, 1);
        legGeo.translate(0, -1, 0);
        const lLeg = new THREE.Group(); lLeg.position.set(-0.5, 0, 0);
        lLeg.add(new THREE.Mesh(legGeo, legMat));
        const rLeg = new THREE.Group(); rLeg.position.set(0.5, 0, 0);
        rLeg.add(new THREE.Mesh(legGeo, legMat));
        group.add(lLeg, rLeg);

        // Nameplate
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.roundRect(10, 5, 236, 54, 8); ctx.fill();
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillStyle = '#00FF88';
        ctx.textAlign = 'center';
        ctx.fillText(id, 128, 40);
        const tex = new THREE.CanvasTexture(canvas);
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
        spr.position.set(0, 4.3, 0);
        spr.scale.set(3.2, 1, 1);
        group.add(spr);

        this.scene.add(group);

        return {
            group,
            lArm, rArm, lLeg, rLeg,
            targetPos: new THREE.Vector3(),
            targetRot: 0,
            walkTimer: 0
        };
    }

    updateRemotePlayer(id, payload) {
        if (!this.remotePlayers.has(id)) {
            const rig = this.createRemotePlayerRig(id, payload.skin);
            this.remotePlayers.set(id, rig);
            this.ui.addChatMessage('Server', `${id} joined Room [${this.currentRoom}]!`, '#00FF88');
        }

        const p = this.remotePlayers.get(id);
        if (payload.x !== undefined) {
            p.targetPos.set(payload.x, payload.y, payload.z);
            p.targetRot = payload.yaw || 0;
            p.isMoving = payload.isMoving;
        }
    }

    removeRemotePlayer(id) {
        if (this.remotePlayers.has(id)) {
            const p = this.remotePlayers.get(id);
            this.scene.remove(p.group);
            this.remotePlayers.delete(id);
            this.ui.addChatMessage('Server', `${id} left the room.`, '#E74C3C');
        }
    }

    update(dt) {
        // Smoothly interpolate remote players toward target positions
        this.remotePlayers.forEach((p) => {
            p.group.position.lerp(p.targetPos, Math.min(1, dt * 15));
            p.group.rotation.y = THREE.MathUtils.lerp(p.group.rotation.y, p.targetRot, Math.min(1, dt * 15));

            if (p.isMoving) {
                p.walkTimer += dt * 12;
                const swing = Math.sin(p.walkTimer) * 0.7;
                p.lArm.rotation.x = -swing;
                p.rArm.rotation.x = swing;
                p.lLeg.rotation.x = swing;
                p.rLeg.rotation.x = -swing;
            } else {
                p.lArm.rotation.x = 0;
                p.rArm.rotation.x = 0;
                p.lLeg.rotation.x = 0;
                p.rLeg.rotation.x = 0;
            }
        });
    }
}

window.RobloxNetwork = RobloxNetwork;
