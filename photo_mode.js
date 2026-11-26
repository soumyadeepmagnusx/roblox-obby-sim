/**
 * Roblox In-Game Photo Mode & Screenshot Studio
 * Features:
 * - Clean UI hiding & cinematic framing
 * - Freecam Orbit & Drone Fly Mode (WASD + Space/Shift in Photo Mode)
 * - Dynamic Field of View (FOV) & Dutch Angle Camera Roll
 * - Real-time Shader / Canvas Color Filters (Synthwave, Golden Hour, Noir, Matrix)
 * - 1-Click High-Res PNG Screenshot Downloader with Roblox Watermark
 */
class RobloxPhotoMode {
    constructor(camera, renderer, scene, player, ui, sound) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
        this.player = player;
        this.ui = ui;
        this.sound = sound;

        this.isActive = false;
        this.originalFov = camera.fov;
        this.currentFov = camera.fov;
        this.currentRoll = 0;
        this.currentFilter = 'none';
        this.flySpeedMultiplier = 1.0;
        this.depthOfField = false;
        this.anamorphicFlare = true;

        // Freecam flight state
        this.isFreecam = false;
        this.freecamPos = new THREE.Vector3();
        this.freecamYaw = 0;
        this.freecamPitch = 0;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        if (document.getElementById('photo-mode-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'photo-mode-overlay';
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        `;

        overlay.innerHTML = `
            <!-- Viewfinder Grid & Letterbox -->
            <div id="pm-letterbox-top" style="position:absolute; top:0; left:0; width:100%; height:40px; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:space-between; padding:0 24px; box-sizing:border-box; pointer-events:auto;">
                <div style="font-size:14px; font-weight:800; color:#FFD700; display:flex; align-items:center; gap:8px;">
                    📸 <span>PHOTO STUDIO & FREECAM</span>
                </div>
                <div style="font-size:12px; color:#AAA;">
                    Press <span style="background:#333; color:#FFF; padding:2px 6px; border-radius:4px; font-weight:bold;">P</span> or <span style="background:#333; color:#FFF; padding:2px 6px; border-radius:4px; font-weight:bold;">ESC</span> to Exit
                </div>
            </div>

            <!-- Viewfinder Rule of Thirds Grid -->
            <div id="pm-grid" style="position:absolute; top:40px; bottom:80px; left:0; right:0; pointer-events:none; border:1px solid rgba(255,255,255,0.15);">
                <div style="position:absolute; left:33.33%; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.15);"></div>
                <div style="position:absolute; left:66.66%; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.15);"></div>
                <div style="position:absolute; top:33.33%; left:0; right:0; height:1px; background:rgba(255,255,255,0.15);"></div>
                <div style="position:absolute; top:66.66%; left:0; right:0; height:1px; background:rgba(255,255,255,0.15);"></div>
            </div>

            <!-- Bottom Control Toolbar -->
            <div id="pm-toolbar" style="position:absolute; bottom:0; left:0; width:100%; height:80px; background:linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(10,12,18,0.8) 100%); display:flex; align-items:center; justify-content:center; gap:20px; padding:0 20px; box-sizing:border-box; pointer-events:auto; backdrop-filter:blur(8px);">
                
                <!-- FOV Slider -->
                <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <span style="font-size:10px; font-weight:bold; color:#AAA;">FOV: <span id="pm-fov-val">65°</span></span>
                    <input type="range" id="pm-fov-slider" min="30" max="95" value="65" style="width:110px; cursor:pointer;">
                </div>

                <!-- Camera Tilt/Roll Slider -->
                <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <span style="font-size:10px; font-weight:bold; color:#AAA;">TILT: <span id="pm-roll-val">0°</span></span>
                    <input type="range" id="pm-roll-slider" min="-30" max="30" value="0" style="width:90px; cursor:pointer;">
                </div>

                <!-- Color Filter Preset Selector -->
                <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <span style="font-size:10px; font-weight:bold; color:#AAA;">FILTER</span>
                    <select id="pm-filter-select" style="background:#222; color:#FFF; border:1px solid #555; border-radius:6px; padding:4px 8px; font-size:11px; cursor:pointer;">
                        <option value="none">Standard</option>
                        <option value="synthwave">Synthwave Neon</option>
                        <option value="golden">Golden Hour</option>
                        <option value="noir">Classic Noir</option>
                        <option value="vibrant">Vibrant Pop</option>
                        <option value="matrix">Matrix Emerald</option>
                    </select>
                </div>

                <!-- Freecam Drone Toggle -->
                <button id="pm-freecam-btn" style="background:#34495E; border:none; color:#FFF; font-size:11px; font-weight:bold; padding:8px 14px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                    🚁 <span>Freecam: OFF</span>
                </button>

                <!-- Flight Speed Toggle -->
                <button id="pm-speed-btn" style="background:#2C3E50; border:1px solid #555; color:#FFF; font-size:11px; font-weight:bold; padding:8px 12px; border-radius:8px; cursor:pointer;">
                    ⚡ Speed: 1.0x
                </button>

                <!-- Depth of Field Focus Toggle -->
                <button id="pm-dof-btn" style="background:#2C3E50; border:1px solid #555; color:#FFF; font-size:11px; font-weight:bold; padding:8px 12px; border-radius:8px; cursor:pointer;">
                    🔍 Focus: Normal
                </button>

                <!-- Anamorphic Lens Flare Toggle -->
                <button id="pm-flare-btn" style="background:rgba(0,240,255,0.25); border:1px solid #00F0FF; color:#FFF; font-size:11px; font-weight:bold; padding:8px 12px; border-radius:8px; cursor:pointer;">
                    ✨ Flare: ON
                </button>

                <!-- Capture Screenshot Button -->
                <button id="pm-capture-btn" style="background:linear-gradient(135deg, #FF6B00, #FF8E53); border:none; color:#FFF; font-size:13px; font-weight:bold; padding:10px 22px; border-radius:8px; cursor:pointer; box-shadow:0 4px 15px rgba(255,107,0,0.4); display:flex; align-items:center; gap:8px;">
                    📸 <span>Take Photo</span>
                </button>

                <!-- Exit Button -->
                <button id="pm-exit-btn" style="background:rgba(255,255,255,0.1); border:none; color:#DDD; font-size:11px; padding:8px 14px; border-radius:8px; cursor:pointer;">
                    ✕ Close
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Bind UI inputs
        document.getElementById('pm-fov-slider').addEventListener('input', (e) => {
            this.setFov(parseFloat(e.target.value));
        });

        document.getElementById('pm-roll-slider').addEventListener('input', (e) => {
            this.setRoll(parseFloat(e.target.value));
        });

        document.getElementById('pm-filter-select').addEventListener('change', (e) => {
            this.setFilter(e.target.value);
        });

        document.getElementById('pm-freecam-btn').addEventListener('click', () => {
            this.toggleFreecam();
        });

        document.getElementById('pm-speed-btn').addEventListener('click', () => {
            this.cycleFlightSpeed();
        });

        document.getElementById('pm-dof-btn').addEventListener('click', () => {
            this.toggleDepthOfField();
        });

        document.getElementById('pm-flare-btn').addEventListener('click', () => {
            this.toggleLensFlare();
        });

        document.getElementById('pm-capture-btn').addEventListener('click', () => {
            this.captureScreenshot();
        });

        document.getElementById('pm-exit-btn').addEventListener('click', () => {
            this.togglePhotoMode();
        });
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused()) return;

            // Key 'P' toggles Photo Mode
            if (e.key === 'p' || e.key === 'P') {
                this.togglePhotoMode();
            } else if (e.key === 'Escape' && this.isActive) {
                this.togglePhotoMode();
            }
        });
    }

    togglePhotoMode() {
        this.isActive = !this.isActive;
        const overlay = document.getElementById('photo-mode-overlay');

        // Elements to hide in photo mode
        const gameUIs = ['top-bar', 'mobile-controls', 'chat-widget', 'jetpack-fuel-container', 'roblox-hotbar', 'shift-lock-crosshair'];

        if (this.isActive) {
            if (overlay) overlay.style.display = 'block';
            gameUIs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.visibility = 'hidden';
            });

            this.freecamPos.copy(this.camera.position);
            this.freecamYaw = (window.game && window.game.cameraController) ? window.game.cameraController.yaw : 0;
            this.freecamPitch = (window.game && window.game.cameraController) ? window.game.cameraController.pitch : 0;

            if (this.ui) this.ui.showToastBanner('📸 PHOTO MODE ACTIVATED [P to Exit]');
            if (this.sound) this.sound.playCoin();
        } else {
            if (overlay) overlay.style.display = 'none';
            gameUIs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.visibility = 'visible';
            });

            // Reset FOV & Tilt
            this.setFov(this.originalFov);
            this.setRoll(0);
            this.setFilter('none');
            this.isFreecam = false;

            const freecamBtn = document.getElementById('pm-freecam-btn');
            if (freecamBtn) freecamBtn.innerHTML = '🚁 <span>Freecam: OFF</span>';
        }
    }

    setFov(val) {
        this.currentFov = val;
        this.camera.fov = val;
        this.camera.updateProjectionMatrix();
        const fovValEl = document.getElementById('pm-fov-val');
        if (fovValEl) fovValEl.textContent = `${Math.round(val)}°`;
    }

    setRoll(deg) {
        this.currentRoll = deg;
        this.camera.rotation.z = (deg * Math.PI) / 180;
        const rollValEl = document.getElementById('pm-roll-val');
        if (rollValEl) rollValEl.textContent = `${Math.round(deg)}°`;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        const canvas = this.renderer.domElement;
        const filters = {
            none: 'none',
            synthwave: 'contrast(125%) saturate(160%) hue-rotate(295deg)',
            golden: 'sepia(35%) saturate(140%) contrast(110%) brightness(105%)',
            noir: 'grayscale(100%) contrast(135%) brightness(95%)',
            vibrant: 'saturate(180%) contrast(115%)',
            matrix: 'hue-rotate(90deg) saturate(150%) contrast(120%)'
        };
        canvas.style.filter = filters[filter] || 'none';
    }

    toggleFreecam() {
        this.isFreecam = !this.isFreecam;
        const btn = document.getElementById('pm-freecam-btn');
        if (btn) {
            btn.innerHTML = this.isFreecam ? '🚁 <span>Freecam: ON (WASD)</span>' : '🚁 <span>Freecam: OFF</span>';
            btn.style.background = this.isFreecam ? '#27AE60' : '#34495E';
        }
    }

    cycleFlightSpeed() {
        const speeds = [0.5, 1.0, 2.5];
        const idx = speeds.indexOf(this.flySpeedMultiplier);
        this.flySpeedMultiplier = speeds[(idx + 1) % speeds.length];
        const btn = document.getElementById('pm-speed-btn');
        if (btn) btn.innerHTML = `⚡ Speed: ${this.flySpeedMultiplier.toFixed(1)}x`;
        if (this.sound && this.sound.playStep) this.sound.playStep('stone');
    }

    toggleDepthOfField() {
        this.depthOfField = !this.depthOfField;
        const btn = document.getElementById('pm-dof-btn');
        if (btn) btn.innerHTML = `🔍 Focus: ${this.depthOfField ? 'Macro DoF' : 'Normal'}`;

        const grid = document.getElementById('pm-grid');
        if (grid) {
            grid.style.boxShadow = this.depthOfField ? 'inset 0 0 120px rgba(0,0,0,0.85)' : 'none';
        }
        if (this.sound && this.sound.playCoin) this.sound.playCoin();
    }

    toggleLensFlare() {
        this.anamorphicFlare = !this.anamorphicFlare;
        const btn = document.getElementById('pm-flare-btn');
        if (btn) {
            btn.textContent = `✨ Flare: ${this.anamorphicFlare ? 'ON' : 'OFF'}`;
            btn.style.background = this.anamorphicFlare ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.08)';
            btn.style.borderColor = this.anamorphicFlare ? '#00F0FF' : '#555';
        }
        if (this.sound && this.sound.playCoin) this.sound.playCoin();
    }

    update(dt, inputState) {
        if (!this.isActive || !this.isFreecam) return;

        // Drone freecam movement with speed multiplier
        const speed = 25 * this.flySpeedMultiplier * dt;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.freecamYaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.freecamYaw);

        if (inputState.forward) this.freecamPos.addScaledVector(forward, speed);
        if (inputState.backward) this.freecamPos.addScaledVector(forward, -speed);
        if (inputState.left) this.freecamPos.addScaledVector(right, -speed);
        if (inputState.right) this.freecamPos.addScaledVector(right, speed);
        if (inputState.jump) this.freecamPos.y += speed;

        this.camera.position.copy(this.freecamPos);
    }

    captureScreenshot() {
        // Shutter flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #FFFFFF;
            opacity: 0.9;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.4s ease;
        `;
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 400);
        }, 50);

        if (this.sound) this.sound.playWin();

        // Render current frame cleanly
        this.renderer.render(this.scene, this.camera);

        // Capture canvas and composite watermark
        const canvas = this.renderer.domElement;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const ctx = exportCanvas.getContext('2d');

        // Apply active color filter to 2D export canvas
        ctx.filter = canvas.style.filter || 'none';
        ctx.drawImage(canvas, 0, 0);

        // Vignette radial shading
        const vigGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Anamorphic Lens Flare & Sunlight Bloom
        if (this.anamorphicFlare) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const flareY = canvas.height * 0.38;
            const flareGrad = ctx.createLinearGradient(0, flareY, canvas.width, flareY);
            flareGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
            flareGrad.addColorStop(0.35, 'rgba(0, 240, 255, 0.25)');
            flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.75)');
            flareGrad.addColorStop(0.65, 'rgba(0, 240, 255, 0.25)');
            flareGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
            ctx.fillStyle = flareGrad;
            ctx.fillRect(0, flareY - 3, canvas.width, 6);
            ctx.restore();
        }

        // Watermark badge with stage info & date
        const stageNum = (this.player && this.player.currentStage !== undefined) ? this.player.currentStage : 1;
        const padX = canvas.width - 280;
        const padY = canvas.height - 62;
        ctx.fillStyle = 'rgba(15, 20, 30, 0.78)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(padX, padY, 260, 48, 10);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(padX, padY, 260, 48);
        }

        ctx.textAlign = 'left';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('ROBLOX 3D OBBY SIM', padX + 16, padY + 22);

        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(`Stage ${stageNum} • ${new Date().toISOString().split('T')[0]}`, padX + 16, padY + 38);

        // Trigger download
        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `roblox-obby-snap-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        this.showThumbnailToast(dataUrl);
        if (this.ui) this.ui.showToastBanner('📸 Screenshot Captured & Saved to Downloads!');
    }

    showThumbnailToast(dataUrl) {
        const oldToast = document.getElementById('pm-thumb-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.id = 'pm-thumb-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(18, 22, 32, 0.95);
            border: 2px solid #FFD700;
            border-radius: 12px;
            padding: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
            z-index: 10001;
            font-family: 'Segoe UI', Arial, sans-serif;
            animation: slideInUp 0.3s ease;
        `;

        toast.innerHTML = `
            <img src="${dataUrl}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
            <div>
                <div style="font-size: 13px; font-weight: bold; color: #FFD700;">📸 Photo Saved!</div>
                <div style="font-size: 10px; color: #AAA; margin-top: 2px;">Downloaded to your PC</div>
            </div>
            <button style="background: none; border: none; color: #AAA; font-size: 18px; cursor: pointer; padding: 0 6px;" onclick="this.parentElement.remove()">✕</button>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.transition = 'opacity 0.4s ease';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }
        }, 4000);
    }
}
