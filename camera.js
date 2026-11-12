/**
 * Roblox Third-Person Camera Controller
 * Supports Right-Click Orbit, Mouse Scroll Zoom, and Shift-Lock Mode
 */
class RobloxCamera {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Spherical coordinates
        this.distance = 14;
        this.minDistance = 3;
        this.maxDistance = 35;
        this.yaw = 0;       // horizontal angle around player
        this.pitch = 0.35;  // vertical angle
        this.minPitch = -0.1;
        this.maxPitch = 1.35;

        // Shift-Lock mode
        this.shiftLock = false;
        this.isRightMouseDown = false;
        this.sensitivity = 0.0035;

        // Dynamic Speed FOV Warp
        this.baseFov = (camera && camera.fov) ? camera.fov : 65;
        this.currentFov = this.baseFov;
        this.dynamicFovEnabled = true;

        // Custom Shift-Lock Crosshair presets
        this.crosshairStyles = ['classic', 'dot', 'brackets', 'tactical'];
        this.crosshairLabels = {
            classic: 'Classic Cross',
            dot: 'Precision Dot',
            brackets: 'Neon Brackets',
            tactical: 'Tactical Ring'
        };
        const savedStyle = (typeof localStorage !== 'undefined') ? localStorage.getItem('roblox_crosshair_style') : null;
        const savedIdx = this.crosshairStyles.indexOf(savedStyle);
        this.crosshairIndex = savedIdx >= 0 ? savedIdx : 0;

        // Smooth follow target
        this.targetPos = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3();

        this.initEvents();
        this.applyCrosshairStyle();
    }

    initEvents() {
        // Pointer down
        this.domElement.addEventListener('pointerdown', (e) => {
            if (e.button === 2) { // Right click
                this.isRightMouseDown = true;
            }
        });

        // Pointer up
        window.addEventListener('pointerup', (e) => {
            if (e.button === 2) {
                this.isRightMouseDown = false;
            }
        });

        // Mouse move
        window.addEventListener('mousemove', (e) => {
            if (this.shiftLock || this.isRightMouseDown) {
                this.yaw -= e.movementX * this.sensitivity;
                this.pitch += e.movementY * this.sensitivity;
                this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
            }
        });

        // Mouse scroll zoom
        this.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.distance += e.deltaY * 0.015;
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        }, { passive: false });

        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement !== this.domElement && this.shiftLock) {
                this.setShiftLock(false);
            }
        });

        // Hotkey C to cycle Shift-Lock crosshair style
        window.addEventListener('keydown', (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if (e.code === 'KeyC') {
                this.cycleCrosshairStyle();
            }
        });
    }

    cycleCrosshairStyle() {
        this.crosshairIndex = (this.crosshairIndex + 1) % this.crosshairStyles.length;
        const style = this.crosshairStyles[this.crosshairIndex];
        try {
            localStorage.setItem('roblox_crosshair_style', style);
        } catch (err) { /* ignore storage restrictions */ }
        this.applyCrosshairStyle();
        if (window.game && window.game.sound) {
            window.game.sound.playClick();
        }
        if (window.game && window.game.ui && window.game.ui.showToastBanner) {
            window.game.ui.showToastBanner(`🎯 Crosshair: ${this.crosshairLabels[style] || style}`);
        }
        return style;
    }

    applyCrosshairStyle() {
        if (typeof document === 'undefined') return;
        const crosshair = document.getElementById('shift-lock-crosshair');
        const style = this.crosshairStyles[this.crosshairIndex] || 'classic';
        if (crosshair) {
            this.crosshairStyles.forEach(s => crosshair.classList.remove(`style-${s}`));
            crosshair.classList.add(`style-${style}`);
            crosshair.dataset.style = style;
        }
    }

    toggleDynamicFov() {
        this.dynamicFovEnabled = !this.dynamicFovEnabled;
        if (window.game && window.game.ui && window.game.ui.showToastBanner) {
            window.game.ui.showToastBanner(this.dynamicFovEnabled ? '💨 Dynamic Speed FOV: ON' : '💨 Dynamic Speed FOV: OFF');
        }
        return this.dynamicFovEnabled;
    }

    toggleShiftLock() {
        this.setShiftLock(!this.shiftLock);
        return this.shiftLock;
    }

    setShiftLock(active) {
        this.shiftLock = active;
        const crosshair = document.getElementById('shift-lock-crosshair');
        if (this.shiftLock) {
            this.domElement.requestPointerLock();
            if (crosshair) crosshair.style.display = 'block';
        } else {
            if (document.exitPointerLock) document.exitPointerLock();
            if (crosshair) crosshair.style.display = 'none';
        }
    }

    update(playerPos, dt, playerObj = null) {
        // Dynamic Speed FOV Warp based on movement velocity, boosts & hoverboard
        if (this.camera) {
            let targetFov = this.baseFov;
            if (this.dynamicFovEnabled) {
                const p = playerObj || (typeof window !== 'undefined' && window.game ? window.game.player : null);
                let speedBoost = 0;
                if (p && p.velocity) {
                    const horizSpeed = Math.hypot(p.velocity.x || 0, p.velocity.z || 0);
                    if (horizSpeed > 14) {
                        speedBoost += Math.min(10, (horizSpeed - 14) * 0.42);
                    }
                    if (p.boostTimer && p.boostTimer > 0) speedBoost += 4.5;
                }
                if (typeof window !== 'undefined' && window.game && window.game.vehicles && window.game.vehicles.isMounted) {
                    speedBoost += 5.5;
                }
                targetFov = Math.min(this.baseFov + 16, this.baseFov + speedBoost);
            }
            this.currentFov += (targetFov - this.currentFov) * Math.min(1, dt * 8);
            if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
                this.camera.fov = this.currentFov;
                this.camera.updateProjectionMatrix();
            }
        }

        // Follow player position at chest level
        const lookTarget = playerPos.clone().add(new THREE.Vector3(0, 2.2, 0));

        // Offset in Shift-Lock (over the right shoulder)
        let shoulderOffset = new THREE.Vector3(0, 0, 0);
        if (this.shiftLock) {
            shoulderOffset = new THREE.Vector3(
                Math.cos(this.yaw) * 1.5,
                0.3,
                -Math.sin(this.yaw) * 1.5
            );
        }

        const effectiveTarget = lookTarget.clone().add(shoulderOffset);

        // Calculate camera position using spherical coordinates
        const camX = effectiveTarget.x - Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
        const camY = effectiveTarget.y + Math.sin(this.pitch) * this.distance;
        const camZ = effectiveTarget.z - Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;

        // Smooth camera lerp
        this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(1, dt * 18));
        this.camera.lookAt(effectiveTarget);
    }
}

window.RobloxCamera = RobloxCamera;
