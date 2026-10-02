/**
 * Roblox Client-Side Multiplayer Network Manager
 * Synchronizes real players over WebSockets with smooth dead-reckoning interpolation
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

        // Remote players: Map<id, { rig, targetPos, targetRot, info, nameplate }>
        this.remotePlayers = new Map();

        this.sendInterval = null;
        this.initConnection();
    }

    initConnection() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.connected = true;
                this.ui.addChatMessage('Server', 'Connected to Roblox Multiplayer Server! Real players can join.', '#00FF88');
                this.startSync();
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
            };

            this.ws.onerror = () => {
                // If running offline or without WebSocket server, fallback gracefully
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
                coins: this.player.coins,
                deaths: this.player.deaths,
                health: this.player.health,
                hat: window.game.shop ? window.game.shop.currentHat : 'none',
                skin: window.game.shop ? window.game.shop.currentSkin : 'noob',
                gear: window.game.gears ? window.game.gears.activeSlot : 0,
                emote: window.game.emotes ? window.game.emotes.currentEmote : 'none'
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

    handleMessage(data) {
        if (data.type === 'welcome') {
            this.myId = data.id;
            console.log('[Multiplayer] Joined as', this.myId);
        } else if (data.type === 'player_update') {
            this.updateRemotePlayer(data.id, data.payload);
        } else if (data.type === 'player_leave') {
            this.removeRemotePlayer(data.id);
        } else if (data.type === 'chat') {
            if (data.id !== this.myId) {
                this.ui.addChatMessage(data.name || data.id, data.message, '#00D0FF');
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
                name: 'Player1'
            }));
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
            this.ui.addChatMessage('Server', `${id} joined the game!`, '#00FF88');
        }

        const p = this.remotePlayers.get(id);
        p.targetPos.set(payload.x, payload.y, payload.z);
        p.targetRot = payload.yaw || 0;
        p.isMoving = payload.isMoving;
    }

    removeRemotePlayer(id) {
        if (this.remotePlayers.has(id)) {
            const p = this.remotePlayers.get(id);
            this.scene.remove(p.group);
            this.remotePlayers.delete(id);
            this.ui.addChatMessage('Server', `${id} left the game.`, '#E74C3C');
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
