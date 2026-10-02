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

        // Smooth follow target
        this.targetPos = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3();

        this.initEvents();
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

    update(playerPos, dt) {
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
