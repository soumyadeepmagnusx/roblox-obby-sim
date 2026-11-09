/**
 * Roblox 2D Mini-Map Radar HUD
 * Renders real-time tactical radar showing player position, facing direction,
 * checkpoints, lava hazards, collectible coins, and multiplayer peers.
 */
class RobloxMiniMap {
    constructor(player, world, network) {
        this.player = player;
        this.world = world;
        this.network = network;

        this.visible = true;
        this.zoom = 1.0; // Zoom multiplier: 0.6x (wide), 1.0x (standard), 1.6x (close-up)
        this.zoomLevels = [0.6, 1.0, 1.6];
        this.zoomIndex = 1;

        this.size = 140; // 140x140px radar
        this.canvas = null;
        this.ctx = null;
        this.container = null;

        this.initDOM();
        this.initEventListeners();
    }

    initDOM() {
        // Create container HUD element
        this.container = document.createElement('div');
        this.container.id = 'minimap-container';
        this.container.style.cssText = `
            position: absolute;
            bottom: 74px;
            right: 16px;
            width: ${this.size}px;
            height: ${this.size}px;
            border-radius: 18px;
            background: rgba(20, 24, 33, 0.82);
            backdrop-filter: blur(8px);
            border: 2px solid rgba(0, 255, 136, 0.45);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
            z-index: 50;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.25s ease, opacity 0.25s ease;
        `;

        // Canvas for high-performance 2D radar rendering
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.display = 'block';
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        // Header pill badge with stage info & zoom toggle
        const topBadge = document.createElement('div');
        topBadge.id = 'minimap-top-badge';
        topBadge.style.cssText = `
            position: absolute;
            top: 4px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: bold;
            color: #00FF88;
            background: rgba(0, 0, 0, 0.65);
            padding: 2px 8px;
            border-radius: 8px;
            pointer-events: none;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        `;
        topBadge.innerText = 'RADAR • 1.0X';
        this.container.appendChild(topBadge);
        this.topBadge = topBadge;

        // Click on map to cycle zoom scale
        this.container.addEventListener('click', () => {
            this.cycleZoom();
        });

        document.body.appendChild(this.container);
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Hotkey 'M' toggles mini-map radar
            if (e.key === 'm' || e.key === 'M') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.toggle();
            }
        });
    }

    cycleZoom() {
        this.zoomIndex = (this.zoomIndex + 1) % this.zoomLevels.length;
        this.zoom = this.zoomLevels[this.zoomIndex];
        if (this.topBadge) {
            this.topBadge.innerText = `RADAR • ${this.zoom.toFixed(1)}X`;
        }
    }

    toggle() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'flex' : 'none';
        if (window.game && window.game.ui) {
            window.game.ui.addChatMessage('System', `Radar Mini-Map: ${this.visible ? 'ON' : 'OFF'} [Key M]`, '#00FF88');
        }
    }

    update() {
        if (!this.visible || !this.ctx || !this.player) return;

        const ctx = this.ctx;
        const w = this.size;
        const h = this.size;
        const cx = w / 2;
        const cy = h / 2;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // Circular background grid
        ctx.fillStyle = 'rgba(12, 16, 24, 0.9)';
        ctx.fillRect(0, 0, w, h);

        // Radar grid rings
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 25 * this.zoom, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 50 * this.zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.stroke();

        // World-to-Radar scale (units: pixels per world block/stud)
        // 1 world stud ~ 1.5 pixels at zoom 1.0
        const scale = 1.25 * this.zoom;
        const playerPos = this.player.position;

        // Draw Checkpoints
        if (this.world && this.world.checkpoints) {
            this.world.checkpoints.forEach((cp, idx) => {
                const pos = cp.position || cp;
                const dx = (pos.x - playerPos.x) * scale;
                const dy = (pos.z - playerPos.z) * scale;

                const screenX = cx + dx;
                const screenY = cy + dy;

                if (screenX >= 4 && screenX <= w - 4 && screenY >= 4 && screenY <= h - 4) {
                    ctx.fillStyle = idx === 6 ? '#FFD700' : '#00D2FF';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, idx === 6 ? 5 : 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Gold ring for final trophy
                    if (idx === 6) {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }
            });
        }

        // Draw Lava / Hazards
        if (this.world && this.world.hazardBlocks) {
            ctx.fillStyle = '#FF3344';
            for (let i = 0; i < this.world.hazardBlocks.length; i += 2) {
                const hb = this.world.hazardBlocks[i];
                if (!hb || !hb.position) continue;
                const dx = (hb.position.x - playerPos.x) * scale;
                const dy = (hb.position.z - playerPos.z) * scale;
                const screenX = cx + dx;
                const screenY = cy + dy;

                if (screenX >= 2 && screenX <= w - 2 && screenY >= 2 && screenY <= h - 2) {
                    ctx.fillRect(screenX - 1.5, screenY - 1.5, 3, 3);
                }
            }
        }

        // Draw Uncollected Coins
        if (this.world && this.world.coins) {
            ctx.fillStyle = '#FFEB3B';
            for (let i = 0; i < this.world.coins.length; i++) {
                const coin = this.world.coins[i];
                if (!coin || coin.collected || !coin.mesh) continue;
                const dx = (coin.mesh.position.x - playerPos.x) * scale;
                const dy = (coin.mesh.position.z - playerPos.z) * scale;
                const screenX = cx + dx;
                const screenY = cy + dy;

                if (screenX >= 2 && screenX <= w - 2 && screenY >= 2 && screenY <= h - 2) {
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw Remote Multiplayer Players
        if (this.network && this.network.remotePlayers) {
            ctx.fillStyle = '#9B51E0';
            this.network.remotePlayers.forEach((rp) => {
                if (!rp.group) return;
                const dx = (rp.group.position.x - playerPos.x) * scale;
                const dy = (rp.group.position.z - playerPos.z) * scale;
                const screenX = cx + dx;
                const screenY = cy + dy;

                if (screenX >= 4 && screenX <= w - 4 && screenY >= 4 && screenY <= h - 4) {
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }

        // Draw Player Avatar (center arrow pointing in facing direction)
        const angle = this.player.facingAngle || 0;
        ctx.save();
        ctx.translate(cx, cy);
        // In 2D canvas, world +Z is down (+Y in canvas)
        ctx.rotate(-angle + Math.PI);

        // Triangular player pointer
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();

        // Pulsing radar sweep effect
        const sweepAngle = (Date.now() / 600) % (Math.PI * 2);
        const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 65);
        grad.addColorStop(0, 'rgba(0, 255, 136, 0.15)');
        grad.addColorStop(1, 'rgba(0, 255, 136, 0.0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 65, sweepAngle, sweepAngle + 0.5);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}

window.RobloxMiniMap = RobloxMiniMap;
