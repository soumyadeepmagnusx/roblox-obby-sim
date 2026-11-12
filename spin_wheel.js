/**
 * Roblox Daily Lucky Prize Spin Wheel
 * Interactive canvas-rendered prize wheel with smooth physics deceleration,
 * audio ticks, stud jackpots, and free potion rewards.
 */
class RobloxSpinWheel {
    constructor(player, sound, ui, particles) {
        this.player = player;
        this.sound = sound;
        this.ui = ui;
        this.particles = particles;

        this.prizes = [
            { label: '+15 Studs', type: 'coins', value: 15, color: '#3498DB' },
            { label: '+50 Jackpot!', type: 'coins', value: 50, color: '#F1C40F' },
            { label: '🌙 Moon Elixir', type: 'potion', value: 'moon_gravity', color: '#00E5FF' },
            { label: '+10 Studs', type: 'coins', value: 10, color: '#2ECC71' },
            { label: '⚡ Hyper Potion', type: 'potion', value: 'hyper_speed', color: '#E040FB' },
            { label: '+100 MEGA!', type: 'coins', value: 100, color: '#E74C3C' }
        ];

        this.angle = 0;
        this.isSpinning = false;
        this.cooldownMs = 5 * 60 * 1000; // 5-minute quick cooldown for fun play

        this.initDOM();
        this.initKeyListeners();
    }

    initDOM() {
        const modal = document.createElement('div');
        modal.id = 'spin-wheel-modal';
        modal.style.cssText = `
            display: none;
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 132;
            align-items: center;
            justify-content: center;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 420px;
            max-width: 92%;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #E040FB;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 12px 45px rgba(224, 64, 251, 0.35);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            color: #FFFFFF;
            font-family: 'Segoe UI', Arial, sans-serif;
            text-align: center;
        `;

        card.innerHTML = `
            <div style="width:100%; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                <div style="font-size:19px; font-weight:800; color:#E040FB;">🎡 LUCKY PRIZE WHEEL</div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.spinWheel.toggleModal()">✕</span>
            </div>

            <!-- Pointer Arrow -->
            <div style="font-size:24px; line-height:1; margin-bottom:-10px; z-index:2; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));">🔻</div>

            <canvas id="spin-wheel-canvas" width="280" height="280" style="border-radius:50%; box-shadow:0 0 25px rgba(0,0,0,0.6);"></canvas>

            <div id="spin-result-text" style="font-size:14px; font-weight:bold; color:#00FF88; min-height:20px;">
                Spin the wheel for free studs & potions!
            </div>

            <button id="btn-spin-now" style="width:100%; padding:12px; font-size:16px; font-weight:800; border:none; border-radius:10px; background:linear-gradient(135deg, #E040FB, #9B51E0); color:#FFF; cursor:pointer; box-shadow:0 4px 15px rgba(224,64,251,0.4);">
                🎲 SPIN NOW!
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;
        this.canvas = document.getElementById('spin-wheel-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        document.getElementById('btn-spin-now').addEventListener('click', () => this.spin());
        this.drawWheel();
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'g' || e.key === 'G') {
                if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
                this.toggleModal();
            }
        });
    }

    drawWheel() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const radius = cx - 6;
        const sliceAngle = (Math.PI * 2) / this.prizes.length;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.prizes.forEach((p, idx) => {
            const start = this.angle + idx * sliceAngle;
            const end = start + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, start, end);
            ctx.closePath();
            ctx.fillStyle = p.color;
            ctx.fill();

            ctx.strokeStyle = '#141821';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw slice text
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 4;
            ctx.fillText(p.label, radius - 14, 5);
            ctx.restore();
        });

        // Outer rim ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Center hub cap
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#1E2430';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    canSpin() {
        const last = parseInt(localStorage.getItem('roblox_last_spin') || '0', 10);
        return (Date.now() - last) >= this.cooldownMs;
    }

    spin() {
        if (this.isSpinning) return;

        if (!this.canSpin()) {
            const last = parseInt(localStorage.getItem('roblox_last_spin') || '0', 10);
            const leftSec = Math.ceil((this.cooldownMs - (Date.now() - last)) / 1000);
            const resultEl = document.getElementById('spin-result-text');
            if (resultEl) {
                resultEl.style.color = '#FF5555';
                resultEl.innerText = `⏳ Spin recharging! Ready in ${Math.floor(leftSec / 60)}m ${leftSec % 60}s.`;
            }
            if (this.sound) this.sound.playOof();
            return;
        }

        this.isSpinning = true;
        localStorage.setItem('roblox_last_spin', Date.now().toString());
        const resultEl = document.getElementById('spin-result-text');
        if (resultEl) {
            resultEl.style.color = '#FFD700';
            resultEl.innerText = '🎲 Spinning the Lucky Wheel...';
        }

        let speed = 0.35 + Math.random() * 0.25;
        const friction = 0.985;
        let lastSliceIdx = -1;

        const animateSpin = () => {
            this.angle = (this.angle + speed) % (Math.PI * 2);
            speed *= friction;
            this.drawWheel();

            const sliceAngle = (Math.PI * 2) / this.prizes.length;
            // Top pointer is at -PI/2 (or 3*PI/2)
            const pointerAngle = (Math.PI * 1.5 - this.angle + Math.PI * 4) % (Math.PI * 2);
            const currentSliceIdx = Math.floor(pointerAngle / sliceAngle) % this.prizes.length;

            if (currentSliceIdx !== lastSliceIdx) {
                lastSliceIdx = currentSliceIdx;
                if (this.sound && this.sound.playStep) this.sound.playStep('wood');
            }

            if (speed > 0.0025) {
                requestAnimationFrame(animateSpin);
            } else {
                this.isSpinning = false;
                this.awardPrize(this.prizes[currentSliceIdx]);
            }
        };

        requestAnimationFrame(animateSpin);
    }

    awardPrize(prize) {
        if (!prize) return;
        const resultEl = document.getElementById('spin-result-text');
        if (resultEl) {
            resultEl.style.color = '#00FF88';
            resultEl.innerText = `🎉 WON: ${prize.label}!`;
        }

        if (prize.type === 'coins' && this.player) {
            this.player.coins = (this.player.coins || 0) + prize.value;
            const coinEl = document.getElementById('hud-coins');
            const statEl = document.getElementById('stat-coins');
            if (coinEl) coinEl.innerText = this.player.coins;
            if (statEl) statEl.innerText = this.player.coins;
        } else if (prize.type === 'potion' && window.game && window.game.potions) {
            const pObj = window.game.potions.potions.find(p => p.id === prize.value);
            if (pObj) window.game.potions.applyPotion(pObj);
        }

        if (this.sound) this.sound.playVictory();
        if (this.particles && this.particles.spawnCoinSparkles && this.player) {
            this.particles.spawnCoinSparkles(this.player.position);
        }
        if (this.ui) {
            this.ui.showToastBanner(`🎡 Lucky Wheel Reward: ${prize.label}!`);
            this.ui.addChatMessage('Wheel', `🎉 You spun and won ${prize.label}!`, '#E040FB');
        }
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) this.drawWheel();
    }
}

window.RobloxSpinWheel = RobloxSpinWheel;
