/**
 * Roblox Hall of Fame, Live Session Leaderboard & Career Statistics
 * Tracks lifetime distance traveled, cumulative studs earned, total OOF deaths,
 * fastest speedrun PB, and renders a live multiplayer session rankings table.
 */
class RobloxLeaderboardStats {
    constructor(player, network, sound, ui) {
        this.player = player;
        this.network = network;
        this.sound = sound;
        this.ui = ui;

        // Persistent career metrics
        const saved = JSON.parse(localStorage.getItem('roblox_career_stats') || '{}');
        this.stats = {
            totalDistance: saved.totalDistance || 0,
            totalPlaySeconds: saved.totalPlaySeconds || 0,
            highestStage: saved.highestStage || 1,
            totalWins: saved.totalWins || 0
        };

        this.lastPos = this.player && this.player.position ? this.player.position.clone() : null;
        this._saveTimer = 0;

        this.initDOM();
    }

    initDOM() {
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 130;
            align-items: center;
            justify-content: center;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 560px;
            max-width: 94%;
            max-height: 86vh;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #F1C40F;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75);
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            color: #FFFFFF;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                <div style="font-size:20px; font-weight:800; color:#F1C40F; display:flex; align-items:center; gap:8px;">
                    🏆 <span>HALL OF FAME & RECORDS</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.leaderboard.toggleModal()">✕</span>
            </div>

            <!-- Career Statistics Grid -->
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;" id="stats-grid"></div>

            <!-- Live Session Standings -->
            <div>
                <div style="font-size:12px; font-weight:bold; color:#AAA; margin-bottom:8px; text-transform:uppercase;">Live Lobby Standings</div>
                <div id="live-standings-list" style="display:flex; flex-direction:column; gap:6px;"></div>
            </div>

            <div style="display:flex; gap:10px; margin-top:4px;">
                <button class="menu-btn danger" onclick="window.game.leaderboard.resetStats()" style="flex:1; padding:10px; font-weight:bold; background:#E74C3C; color:#FFF; border:none; border-radius:8px; cursor:pointer;">
                    🗑️ Reset Career Stats
                </button>
                <button class="menu-btn primary" onclick="window.game.leaderboard.toggleModal()" style="flex:2; padding:10px; font-weight:bold; background:#F1C40F; color:#000; border:none; border-radius:8px; cursor:pointer;">
                    Close Hall of Fame
                </button>
            </div>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;
    }

    update(dt) {
        if (!this.player) return;

        // Track play time
        this.stats.totalPlaySeconds += dt;

        // Track traveled distance in studs
        if (this.player.position) {
            if (this.lastPos) {
                const moved = this.player.position.distanceTo(this.lastPos);
                // Ignore instant teleport spikes (> 15 studs in single frame)
                if (moved > 0.001 && moved < 15) {
                    this.stats.totalDistance += moved;
                }
            }
            this.lastPos = this.player.position.clone();
        }

        // Track stage high-water mark
        const stg = this.player.currentStage || 1;
        if (stg > this.stats.highestStage) {
            this.stats.highestStage = stg;
        }

        // Persist every 5 seconds
        this._saveTimer += dt;
        if (this._saveTimer >= 5) {
            this._saveTimer = 0;
            this.saveStats();
            if (this.modal && this.modal.style.display === 'flex') {
                this.renderModal();
            }
        }
    }

    saveStats() {
        localStorage.setItem('roblox_career_stats', JSON.stringify(this.stats));
    }

    resetStats() {
        this.stats = {
            totalDistance: 0,
            totalPlaySeconds: 0,
            highestStage: this.player ? (this.player.currentStage || 1) : 1,
            totalWins: 0
        };
        this.saveStats();
        this.renderModal();
        if (this.ui) this.ui.showToastBanner('📊 Career statistics reset cleanly.');
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }

    renderModal() {
        const grid = document.getElementById('stats-grid');
        const standings = document.getElementById('live-standings-list');
        if (!grid || !standings) return;

        const pbRaw = localStorage.getItem('roblox_obby_pb');
        const pbFormatted = pbRaw ? `${parseFloat(pbRaw).toFixed(2)}s` : 'Not Set';
        const currentCoins = this.player ? (this.player.coins || 0) : 0;
        const currentDeaths = this.player ? (this.player.deaths || 0) : 0;

        const statCards = [
            { label: '⚡ Speedrun Best (PB)', val: pbFormatted, color: '#00FF88' },
            { label: '📏 Distance Traveled', val: `${Math.round(this.stats.totalDistance)} Studs`, color: '#00D2FF' },
            { label: '🪙 Active Coins', val: `${currentCoins} Studs`, color: '#FFD700' },
            { label: '💀 Session OOFs', val: `${currentDeaths} Deaths`, color: '#FF5555' },
            { label: '⏱️ Total Playtime', val: this.formatDuration(this.stats.totalPlaySeconds), color: '#E040FB' },
            { label: '🚩 Highest Stage', val: `Stage ${this.stats.highestStage} / 6`, color: '#FF9F43' }
        ];

        grid.innerHTML = statCards.map(s => `
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 14px;">
                <div style="font-size:11px; color:#AAA;">${s.label}</div>
                <div style="font-size:16px; font-weight:800; color:${s.color}; margin-top:3px;">${s.val}</div>
            </div>
        `).join('');

        // Gather players for live lobby leaderboard
        const players = [];
        players.push({
            name: 'Player1 (You)',
            stage: this.player ? (this.player.currentStage || 1) : 1,
            coins: currentCoins,
            isLocal: true
        });

        if (this.network && this.network.remotePlayers) {
            this.network.remotePlayers.forEach((rp, id) => {
                players.push({
                    name: rp.name || `Guest_${id.slice(0, 4)}`,
                    stage: rp.stage || 1,
                    coins: rp.coins || 0,
                    isLocal: false
                });
            });
        }

        // Sort descending by stage then coins
        players.sort((a, b) => (b.stage - a.stage) || (b.coins - a.coins));

        standings.innerHTML = players.map((p, idx) => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:${p.isLocal ? 'rgba(241,196,15,0.16)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${p.isLocal ? '#F1C40F' : 'rgba(255,255,255,0.08)'}; border-radius:8px; padding:8px 14px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:bold; color:${idx === 0 ? '#FFD700' : '#AAA'};">#${idx + 1}</span>
                    <span style="font-weight:bold; color:${p.isLocal ? '#FFF' : '#CCC'};">${p.name}</span>
                </div>
                <div style="display:flex; gap:14px; font-size:12px;">
                    <span style="color:#00FF88; font-weight:bold;">Stage ${p.stage}</span>
                    <span style="color:#FFD700; font-weight:bold;">🪙 ${p.coins}</span>
                </div>
            </div>
        `).join('');
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) this.renderModal();
    }
}

window.RobloxLeaderboardStats = RobloxLeaderboardStats;
