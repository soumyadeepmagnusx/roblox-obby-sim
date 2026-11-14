/**
 * Roblox Screen VFX Overlay Engine
 * Renders immersive dynamic visual effects:
 * - Low-Health Heartbeat Red Vignette
 * - Hazard Damage Flash
 * - Golden Coin / Prize Reward Flash
 * - High-Velocity Radial Motion Speed Streaks
 */
class RobloxVFXOverlay {
    constructor(player) {
        this.player = player;
        this.enabled = true;
        try {
            const saved = localStorage.getItem('roblox_vfx_enabled');
            if (saved !== null) this.enabled = saved === 'true';
        } catch (e) {}

        this.canvas = null;
        this.ctx = null;
        this.damageFlash = 0;
        this.rewardFlash = 0;
        this.heartbeatTimer = 0;
        this.speedStreakTimer = 0;

        if (typeof document !== 'undefined') {
            this.initCanvas();
        }
    }

    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'screen-vfx-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
            display: block;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    triggerDamage() {
        if (!this.enabled) return;
        this.damageFlash = 1.0;
    }

    triggerReward() {
        if (!this.enabled) return;
        this.rewardFlash = 1.0;
    }

    toggle() {
        this.enabled = !this.enabled;
        try {
            localStorage.setItem('roblox_vfx_enabled', this.enabled.toString());
        } catch (e) {}

        if (this.canvas) {
            this.canvas.style.display = this.enabled ? 'block' : 'none';
        }
        if (window.game && window.game.ui && window.game.ui.showToastBanner) {
            window.game.ui.showToastBanner(`✨ Screen VFX: ${this.enabled ? 'ON' : 'OFF'}`);
        }
        return this.enabled;
    }

    update(dt) {
        if (!this.enabled || !this.ctx || !this.canvas) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w === 0 || h === 0) return;

        this.ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.hypot(cx, cy);

        // 1. Damage Flash (Sudden Red Radial Burst)
        if (this.damageFlash > 0) {
            this.damageFlash = Math.max(0, this.damageFlash - dt * 2.5);
            const grad = this.ctx.createRadialGradient(cx, cy, maxR * 0.45, cx, cy, maxR);
            grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
            grad.addColorStop(0.7, `rgba(255, 20, 20, ${this.damageFlash * 0.45})`);
            grad.addColorStop(1, `rgba(180, 0, 0, ${this.damageFlash * 0.85})`);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, w, h);
        }

        // 2. Reward / Coin Pickup Flash (Warm Gold Glow)
        if (this.rewardFlash > 0) {
            this.rewardFlash = Math.max(0, this.rewardFlash - dt * 2.0);
            const grad = this.ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
            grad.addColorStop(0, 'rgba(255, 215, 0, 0)');
            grad.addColorStop(0.8, `rgba(255, 200, 0, ${this.rewardFlash * 0.35})`);
            grad.addColorStop(1, `rgba(255, 140, 0, ${this.rewardFlash * 0.65})`);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, w, h);
        }

        // 3. Low-Health Pulsing Vignette (< 35 HP)
        if (this.player && this.player.health > 0 && this.player.health < 35) {
            this.heartbeatTimer += dt * 4.5;
            const pulse = (Math.sin(this.heartbeatTimer) + 1) * 0.5;
            const alpha = 0.25 + pulse * 0.45;

            const grad = this.ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
            grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
            grad.addColorStop(0.65, `rgba(220, 0, 20, ${alpha * 0.4})`);
            grad.addColorStop(1, `rgba(140, 0, 0, ${alpha * 0.85})`);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, w, h);
        }

        // 4. High-Speed Radial Motion Streaks (Sprint / Boost / Grapple)
        let isHighSpeed = false;
        if (this.player && this.player.velocity) {
            const horizSpeed = Math.hypot(this.player.velocity.x || 0, this.player.velocity.z || 0);
            if (horizSpeed > 18 || (this.player.boostTimer && this.player.boostTimer > 0)) {
                isHighSpeed = true;
            }
        }
        if (window.game && window.game.grapple && window.game.grapple.isGrappling) {
            isHighSpeed = true;
        }

        if (isHighSpeed) {
            this.speedStreakTimer += dt * 10;
            this.ctx.save();
            this.ctx.lineWidth = 2;
            const streakCount = 18;
            for (let i = 0; i < streakCount; i++) {
                const angle = (i / streakCount) * Math.PI * 2 + Math.sin(this.speedStreakTimer * 0.2 + i);
                const rInner = maxR * 0.68 + Math.sin(this.speedStreakTimer + i * 2) * 20;
                const rOuter = maxR * 0.98;

                const x1 = cx + Math.cos(angle) * rInner;
                const y1 = cy + Math.sin(angle) * rInner;
                const x2 = cx + Math.cos(angle) * rOuter;
                const y2 = cy + Math.sin(angle) * rOuter;

                const streakGrad = this.ctx.createLinearGradient(x1, y1, x2, y2);
                streakGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
                streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0.45)');

                this.ctx.strokeStyle = streakGrad;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
            this.ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxVFXOverlay = RobloxVFXOverlay;
}
