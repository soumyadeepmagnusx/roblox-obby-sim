/**
 * Roblox Player Profile & Career Stats Card (profile_card.js)
 * Displays an interactive player passport with avatar metrics, achievement summary,
 * and a 5-axis career attribute radar polygon.
 */
class RobloxProfileCard {
    constructor(game) {
        this.game = game;
        this.isOpen = false;

        if (typeof document !== 'undefined') {
            this.initUI();
        }
    }

    initUI() {
        const modal = document.createElement('div');
        modal.id = 'profile-card-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 560px;
            max-width: 92vw;
            background: rgba(14, 18, 28, 0.96);
            border: 2px solid #00F0FF;
            border-radius: 18px;
            box-shadow: 0 0 35px rgba(0, 240, 255, 0.45);
            color: #FFF;
            font-family: 'Segoe UI', Roboto, sans-serif;
            z-index: 10010;
            padding: 24px;
            backdrop-filter: blur(14px);
        `;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h2 style="margin:0; font-size:22px; color:#00F0FF; display:flex; align-items:center; gap:8px;">
                    <span>👤</span> Player Career Passport
                </h2>
                <button id="close-profile-btn" style="background:#FF3344; border:none; color:#FFF; font-weight:bold; border-radius:8px; padding:6px 14px; cursor:pointer;">✕</button>
            </div>

            <!-- Identity Header -->
            <div style="display:flex; align-items:center; gap:16px; background:rgba(255,255,255,0.05); padding:14px; border-radius:12px; margin-bottom:16px; border:1px solid rgba(255,255,255,0.1);">
                <div style="width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg, #00F0FF, #0077FF); display:flex; align-items:center; justify-content:center; font-size:32px; box-shadow:0 0 15px rgba(0,240,255,0.4);">
                    🤠
                </div>
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span id="profile-clan-tag" style="background:linear-gradient(135deg, #FF8C00, #FF0055); color:#FFF; font-size:12px; font-weight:bold; padding:2px 8px; border-radius:6px;">[PRO]</span>
                        <span id="profile-player-name" style="font-size:20px; font-weight:bold; color:#FFF;">Player1</span>
                    </div>
                    <div id="profile-title-tag" style="color:#00FF88; font-size:13px; font-weight:600; margin-top:3px;">🐣 Noob Adventurer</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:12px; color:#AAA;">PLAYER LEVEL</div>
                    <div id="profile-level-badge" style="font-size:26px; font-weight:bold; color:#FFD700;">LVL 1</div>
                </div>
            </div>

            <!-- Stats & Radar Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                <!-- Left: Stats Breakdown -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.08);">
                        <span style="font-size:13px; color:#AAA;">🪙 Total Studs:</span>
                        <span id="profile-stat-coins" style="font-weight:bold; color:#FFD700;">0</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.08);">
                        <span style="font-size:13px; color:#AAA;">🏁 Apex Stage:</span>
                        <span id="profile-stat-stage" style="font-weight:bold; color:#00F0FF;">Stage 0</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.08);">
                        <span style="font-size:13px; color:#AAA;">⚡ Personal Best:</span>
                        <span id="profile-stat-pb" style="font-weight:bold; color:#00FF88;">--:--</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.08);">
                        <span style="font-size:13px; color:#AAA;">💀 Total OOF Deaths:</span>
                        <span id="profile-stat-deaths" style="font-weight:bold; color:#FF5555;">0</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.08);">
                        <span style="font-size:13px; color:#AAA;">💎 Ancient Relics:</span>
                        <span id="profile-stat-relics" style="font-weight:bold; color:#CC55FF;">0 / 5</span>
                    </div>
                </div>

                <!-- Right: Attributes Canvas Radar -->
                <div style="background:rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; border:1px solid rgba(0,240,255,0.2);">
                    <div style="font-size:11px; color:#00F0FF; font-weight:bold; margin-bottom:4px;">CAREER ATTRIBUTE RADAR</div>
                    <canvas id="profile-radar-canvas" width="180" height="180"></canvas>
                </div>
            </div>

            <!-- Footer -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
                <span style="font-size:11px; color:#AAA;">Verified Robloxian Obby Citizen ID #2026-X</span>
                <button id="profile-done-btn" style="background:#00FF88; border:none; color:#111; padding:8px 24px; border-radius:8px; font-weight:bold; cursor:pointer;">Done</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-profile-btn')?.addEventListener('click', () => this.close());
        document.getElementById('profile-done-btn')?.addEventListener('click', () => this.close());
    }

    open() {
        this.isOpen = true;
        const modal = document.getElementById('profile-card-modal');
        if (modal) modal.style.display = 'block';

        this.refreshData();
        this.drawRadar();
        if (this.game && this.game.sound && this.game.sound.playClick) {
            this.game.sound.playClick();
        }
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('profile-card-modal');
        if (modal) modal.style.display = 'none';
    }

    refreshData() {
        const p = this.game ? this.game.player : null;
        if (!p) return;

        const clanTagEl = document.getElementById('profile-clan-tag');
        if (clanTagEl) {
            const clan = (this.game.clanSystem && this.game.clanSystem.clanTag) || '[PRO]';
            clanTagEl.textContent = clan;
        }

        const titleTagEl = document.getElementById('profile-title-tag');
        if (titleTagEl && this.game.titleSystem) {
            const t = this.game.titleSystem.getEquippedTitle();
            titleTagEl.textContent = t ? t.name : 'Adventurer';
            titleTagEl.style.color = t ? t.color : '#00FF88';
        }

        const levelBadge = document.getElementById('profile-level-badge');
        if (levelBadge) {
            const lvl = (this.game.levelSystem && this.game.levelSystem.level) || 1;
            levelBadge.textContent = `LVL ${lvl}`;
        }

        const coinsEl = document.getElementById('profile-stat-coins');
        if (coinsEl) coinsEl.textContent = p.coins || 0;

        const stageEl = document.getElementById('profile-stat-stage');
        if (stageEl) stageEl.textContent = `Stage ${p.currentStage || 0}`;

        const pbEl = document.getElementById('profile-stat-pb');
        if (pbEl) {
            const rawPb = localStorage.getItem('roblox_obby_pb');
            pbEl.textContent = rawPb ? `${parseFloat(rawPb).toFixed(1)}s` : 'No PB Yet';
        }

        const deathsEl = document.getElementById('profile-stat-deaths');
        if (deathsEl) deathsEl.textContent = p.deaths || 0;

        const relicsEl = document.getElementById('profile-stat-relics');
        if (relicsEl && this.game.collectibles) {
            const found = this.game.collectibles.relicsCollected || 0;
            relicsEl.textContent = `${found} / 5`;
        }
    }

    drawRadar() {
        const canvas = document.getElementById('profile-radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = 65;

        const attributes = ['Speed', 'Parkour', 'Explore', 'Wealth', 'Prestige'];
        const values = [0.8, 0.85, 0.75, 0.7, 0.9]; // 0.0 to 1.0

        // Draw web rings
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let r = 1; r <= 3; r++) {
            const ringR = (radius / 3) * r;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const x = cx + Math.cos(angle) * ringR;
                const y = cy + Math.sin(angle) * ringR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw data polygon
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const r = radius * values[i];
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw attribute labels
        ctx.fillStyle = '#EEE';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const lx = cx + Math.cos(angle) * (radius + 14);
            const ly = cy + Math.sin(angle) * (radius + 14);
            ctx.fillText(attributes[i], lx, ly);
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxProfileCard = RobloxProfileCard;
}
