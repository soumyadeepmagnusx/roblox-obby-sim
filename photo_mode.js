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

    update(dt, inputState) {
        if (!this.isActive || !this.isFreecam) return;

        // Drone freecam movement
        const speed = 25 * dt;
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

        // Watermark overlay
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.roundRect(canvas.width - 240, canvas.height - 50, 220, 36, 8);
        ctx.fill();

        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'right';
        ctx.fillText('ROBLOX OBBY SIM 🎮', canvas.width - 32, canvas.height - 26);

        // Trigger download
        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `roblox-obby-snap-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        if (this.ui) this.ui.showToastBanner('📸 Screenshot Captured & Saved to Downloads!');
    }
}
