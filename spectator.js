/**
 * Roblox Obby Spectator Camera & Cinema Mode
 * Features:
 * - Cycle through active multiplayer peers or cinematic stage vantage points
 * - Smooth lerp tracking with auto-cinematic pan
 * - Overhead spectator HUD banner with player name, stage, and quick controls
 * - Toggleable with key [F] or HUD button
 */
class RobloxSpectatorCam {
    constructor(camera, scene, player, network, ui, sound) {
        this.camera = camera;
        this.scene = scene;
        this.player = player;
        this.network = network;
        this.ui = ui;
        this.sound = sound;

        this.isActive = false;
        this.targetIndex = 0;
        this.targets = [];
        this.cinematicAngle = 0;

        // Default scenic viewpoints if no multiplayer peers are present
        this.scenicPoints = [
            { name: "🏁 Stage 0: Spawn Island", pos: { x: 0, y: 3.5, z: 0 }, camOffset: { x: 0, y: 6, z: -14 } },
            { name: "⚡ Stage 1: Neon Jumps", pos: { x: 0, y: 7.0, z: 65 }, camOffset: { x: 8, y: 8, z: -12 } },
            { name: "🔥 Stage 2: Lava Leap", pos: { x: 0, y: 12.0, z: 120 }, camOffset: { x: -10, y: 9, z: -14 } },
            { name: "🌌 Stage 4: Starlight Sky", pos: { x: 0, y: 25.0, z: 240 }, camOffset: { x: 12, y: 10, z: -15 } },
            { name: "👑 Stage 6: Summit Victory", pos: { x: 0, y: 36.0, z: 360 }, camOffset: { x: 0, y: 12, z: -18 } },
            { name: "🌌 Stage 7: Cyber Nebula", pos: { x: 0, y: 52.0, z: 460 }, camOffset: { x: -12, y: 10, z: -16 } },
            { name: "🌋 Stage 8: Inferno Caldera", pos: { x: 0, y: 62.0, z: 582 }, camOffset: { x: 14, y: 12, z: -18 } },
            { name: "👑 Stage 9: Titans Throne", pos: { x: 0, y: 86.0, z: 684 }, camOffset: { x: 0, y: 10, z: -20 } }
        ];

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('spectator-hud')) return;

        const banner = document.createElement('div');
        banner.id = 'spectator-hud';
        banner.style.cssText = `
            display: none;
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(18, 22, 32, 0.92);
            backdrop-filter: blur(8px);
            border: 2px solid #00FFFF;
            box-shadow: 0 4px 25px rgba(0, 255, 255, 0.35);
            border-radius: 24px;
            padding: 8px 20px;
            z-index: 1000;
            color: #FFFFFF;
            font-family: 'Segoe UI', Arial, sans-serif;
            align-items: center;
            gap: 16px;
            pointer-events: auto;
        `;

        banner.innerHTML = `
            <button id="spec-prev-btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.25); color:#FFF; border-radius:50%; width:28px; height:28px; font-weight:bold; cursor:pointer;">◀</button>
            <div style="text-align:center;">
                <div style="font-size:11px; font-weight:bold; color:#00FFFF; text-transform:uppercase; letter-spacing:1px;">👁️ SPECTATOR CAMERA</div>
                <div id="spec-target-name" style="font-size:14px; font-weight:bold; color:#FFF; margin-top:2px;">Target: Player</div>
            </div>
            <button id="spec-next-btn" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.25); color:#FFF; border-radius:50%; width:28px; height:28px; font-weight:bold; cursor:pointer;">▶</button>
            <button id="spec-exit-btn" style="background:#FF3366; border:none; color:#FFF; font-size:11px; font-weight:bold; padding:6px 12px; border-radius:12px; cursor:pointer; margin-left:8px;">Exit (F)</button>
        `;

        document.body.appendChild(banner);
        this.banner = banner;

        document.getElementById('spec-prev-btn').addEventListener('click', () => this.prevTarget());
        document.getElementById('spec-next-btn').addEventListener('click', () => this.nextTarget());
        document.getElementById('spec-exit-btn').addEventListener('click', () => this.toggleSpectator());
    }

    bindEvents() {
        if (typeof window === 'undefined') return;
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused()) return;

            if (e.key === 'f' || e.key === 'F') {
                this.toggleSpectator();
            } else if (this.isActive) {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.prevTarget();
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.nextTarget();
                } else if (e.key === 'Escape') {
                    this.toggleSpectator();
                }
            }
        });
    }

    refreshTargets() {
        this.targets = [];

        // Peer targets from multiplayer network
        if (this.network && this.network.peers) {
            Object.keys(this.network.peers).forEach((id) => {
                const peer = this.network.peers[id];
                if (peer && peer.mesh) {
                    this.targets.push({
                        name: peer.name || `Player ${id.substring(0, 4)}`,
                        getPos: () => peer.mesh.position,
                        isPeer: true
                    });
                }
            });
        }

        // Always append scenic viewpoints
        this.scenicPoints.forEach(sp => {
            this.targets.push({
                name: sp.name,
                getPos: () => (typeof THREE !== 'undefined' ? new THREE.Vector3(sp.pos.x, sp.pos.y, sp.pos.z) : sp.pos),
                camOffset: sp.camOffset,
                isScenic: true
            });
        });
    }

    toggleSpectator() {
        this.isActive = !this.isActive;
        if (this.banner) {
            this.banner.style.display = this.isActive ? 'flex' : 'none';
        }

        if (this.isActive) {
            this.refreshTargets();
            this.targetIndex = 0;
            this.updateTargetLabel();
            if (this.sound) this.sound.playCoin();
            if (this.ui) this.ui.showToastBanner('👁️ Spectator Camera Active [A/D to Cycle, F to Exit]');
        } else {
            if (this.ui) this.ui.showToastBanner('Spectator Camera Closed');
        }
    }

    nextTarget() {
        if (this.targets.length === 0) return;
        this.targetIndex = (this.targetIndex + 1) % this.targets.length;
        this.updateTargetLabel();
        if (this.sound && this.sound.playStep) this.sound.playStep('stone');
    }

    prevTarget() {
        if (this.targets.length === 0) return;
        this.targetIndex = (this.targetIndex - 1 + this.targets.length) % this.targets.length;
        this.updateTargetLabel();
        if (this.sound && this.sound.playStep) this.sound.playStep('stone');
    }

    updateTargetLabel() {
        const label = document.getElementById('spec-target-name');
        if (label && this.targets[this.targetIndex]) {
            label.textContent = this.targets[this.targetIndex].name;
        }
    }

    update(dt) {
        if (!this.isActive || this.targets.length === 0) return;

        const target = this.targets[this.targetIndex];
        if (!target) return;

        const targetPos = target.getPos();
        this.cinematicAngle += dt * 0.35;

        if (typeof THREE === 'undefined') return;

        let desiredCamPos;
        if (target.isScenic && target.camOffset) {
            desiredCamPos = new THREE.Vector3(
                targetPos.x + target.camOffset.x + Math.sin(this.cinematicAngle) * 4,
                targetPos.y + target.camOffset.y,
                targetPos.z + target.camOffset.z + Math.cos(this.cinematicAngle) * 4
            );
        } else {
            // Orbiting peer camera
            const dist = 10;
            const h = 5;
            desiredCamPos = new THREE.Vector3(
                targetPos.x + Math.sin(this.cinematicAngle) * dist,
                targetPos.y + h,
                targetPos.z + Math.cos(this.cinematicAngle) * dist
            );
        }

        this.camera.position.lerp(desiredCamPos, Math.min(1, dt * 5));
        this.camera.lookAt(targetPos.x, targetPos.y + 1.2, targetPos.z);
    }
}

if (typeof window !== 'undefined') {
    window.RobloxSpectatorCam = RobloxSpectatorCam;
}
