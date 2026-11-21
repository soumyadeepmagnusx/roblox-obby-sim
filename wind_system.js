/**
 * Roblox Obby Simulator - High-Altitude Wind Gusts & Atmospheric Turbulence
 * Simulates directional wind physics, ambient howling gusts, and wispy cloud streak particles
 * when players ascend into the upper atmosphere (Y > 45 studs).
 */
class RobloxWindSystem {
    constructor(scene, player, sound, ui) {
        this.scene = scene;
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.time = 0;
        this.windSpeed = 0; // current active force
        this.baseAngle = Math.PI * 0.25; // default wind blowing northeast
        this.gustTimer = 0;
        this.particles = [];

        this.initDOM();
    }

    initDOM() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('hud-wind-indicator')) return;

        const badge = document.createElement('div');
        badge.id = 'hud-wind-indicator';
        badge.style.cssText = `
            display: none;
            position: absolute;
            top: 96px;
            right: 16px;
            background: rgba(18, 22, 32, 0.78);
            backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 14px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: bold;
            color: #A0E0FF;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 45;
            pointer-events: none;
            transition: opacity 0.3s;
        `;
        badge.innerHTML = '💨 Wind: <span id="hud-wind-val">Calm</span>';
        document.body.appendChild(badge);
        this.badge = badge;
    }

    update(dt) {
        this.time += dt;
        if (!this.player || !this.player.position) return;

        const isHighAltitude = this.player.position.y > 45;

        if (this.badge) {
            this.badge.style.display = isHighAltitude ? 'block' : 'none';
        }

        if (!isHighAltitude) {
            this.windSpeed = 0;
            return;
        }

        // Periodic gust intensity
        this.gustTimer += dt;
        const gustFactor = Math.sin(this.time * 0.4) * 0.5 + 0.5; // 0 to 1
        this.windSpeed = gustFactor * 3.5; // max horizontal drift

        const windDirX = Math.cos(this.baseAngle);
        const windDirZ = Math.sin(this.baseAngle);

        // Apply subtle drift to airborne player
        if (!this.player.isGrounded && !this.player.isDead) {
            this.player.velocity.x += windDirX * this.windSpeed * dt * 0.8;
            this.player.velocity.z += windDirZ * this.windSpeed * dt * 0.8;
        }

        // Update HUD
        const windEl = document.getElementById('hud-wind-val');
        if (windEl) {
            const knots = Math.round(this.windSpeed * 4.2);
            windEl.innerText = `${knots} kts NE`;
        }

        // Spawn occasional wispy breeze streaks
        if (Math.random() < 0.15 && typeof THREE !== 'undefined' && this.scene) {
            this.spawnWindStreak();
        }

        // Update breeze streak particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.x += windDirX * p.speed * dt;
            p.mesh.position.z += windDirZ * p.speed * dt;
            p.life -= dt;
            p.mesh.material.opacity = Math.max(0, p.life / p.maxLife * 0.35);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    spawnWindStreak() {
        const geo = new THREE.BoxGeometry(0.12, 0.08, 3.5);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xE0F7FA,
            transparent: true,
            opacity: 0.35
        });
        const mesh = new THREE.Mesh(geo, mat);

        const px = this.player.position.x + (Math.random() - 0.5) * 25;
        const py = this.player.position.y + (Math.random() - 0.5) * 8;
        const pz = this.player.position.z + (Math.random() - 0.5) * 25;

        mesh.position.set(px, py, pz);
        mesh.rotation.y = this.baseAngle;
        this.scene.add(mesh);

        this.particles.push({
            mesh,
            speed: 18 + Math.random() * 8,
            life: 1.2,
            maxLife: 1.2
        });
    }
}

if (typeof window !== 'undefined') {
    window.RobloxWindSystem = RobloxWindSystem;
}
