/**
 * Roblox 3D Speedrun Pacer Ghost Replay System
 * Records best obby speedrun frames to localStorage and renders a translucent
 * holographic R6 pacer avatar running alongside you in real time.
 */
class RobloxGhostRunner {
    constructor(scene, player, ui, sound) {
        this.scene = scene;
        this.player = player;
        this.ui = ui;
        this.sound = sound;

        this.storageKey = 'roblox_obby_ghost_frames';
        this.enabled = true;
        this.sampleInterval = 0.08;
        this.sampleAccum = 0;
        this.maxSamples = 3500;
        this.currentRecording = [];
        this.bestRunFrames = this.loadBestRun();
        this.playbackIdx = 0;
        this.walkPhase = 0;

        this.limbs = {};
        this.ghostMesh = this.buildGhostMesh();
        if (this.scene && this.ghostMesh) {
            this.ghostMesh.visible = false;
            this.scene.add(this.ghostMesh);
        }

        this.bindHotkeys();
    }

    buildGhostMesh() {
        if (typeof THREE === 'undefined') return null;

        const group = new THREE.Group();
        const bodyMat = new THREE.MeshBasicMaterial({
            color: 0x00F0FF,
            transparent: true,
            opacity: 0.34,
            depthWrite: false
        });
        const visorMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.72,
            depthWrite: false
        });
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x66FFFF,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });

        const makePart = (w, h, d, y, x = 0, z = 0) => {
            const geom = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geom, bodyMat);
            mesh.position.set(x, y, z);
            const wire = new THREE.Mesh(geom, wireMat);
            mesh.add(wire);
            return mesh;
        };

        // Standard Roblox R6 proportions matching player rig
        const torso = makePart(2.0, 2.0, 1.0, 3.0);
        const head = makePart(1.2, 1.2, 1.2, 4.6);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.14), visorMat);
        visor.position.set(0, 0.08, 0.58);
        head.add(visor);

        const leftArm = makePart(0.9, 1.9, 0.9, 3.0, -1.5, 0);
        const rightArm = makePart(0.9, 1.9, 0.9, 3.0, 1.5, 0);
        const leftLeg = makePart(0.95, 2.0, 0.95, 1.0, -0.5, 0);
        const rightLeg = makePart(0.95, 2.0, 0.95, 1.0, 0.5, 0);

        const halo = new THREE.Mesh(
            new THREE.RingGeometry(1.0, 1.35, 24),
            new THREE.MeshBasicMaterial({
                color: 0x00FF88,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.45,
                depthWrite: false
            })
        );
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.06;

        group.add(torso, head, leftArm, rightArm, leftLeg, rightLeg, halo);
        this.limbs = { leftArm, rightArm, leftLeg, rightLeg, halo };
        return group;
    }

    bindHotkeys() {
        if (typeof window === 'undefined') return;
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused && this.ui.isChatFocused()) return;
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if (e.code === 'KeyX') {
                this.toggle();
            }
        });
    }

    loadBestRun() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length >= 2 ? parsed : null;
        } catch (err) {
            return null;
        }
    }

    saveRunIfBest(isNewPB) {
        if (!this.currentRecording || this.currentRecording.length < 2) return;
        if (!isNewPB && this.bestRunFrames) return;

        this.bestRunFrames = this.currentRecording.slice(0, this.maxSamples);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bestRunFrames));
        } catch (err) { /* ignore quota errors */ }
    }

    onRunReset() {
        this.currentRecording = [];
        this.sampleAccum = 0;
        this.playbackIdx = 0;
        if (this.ghostMesh) {
            this.ghostMesh.visible = false;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (typeof document !== 'undefined') {
            const btn = document.getElementById('btn-ghost');
            if (btn) btn.classList.toggle('active', this.enabled);
        }
        if (!this.enabled && this.ghostMesh) {
            this.ghostMesh.visible = false;
        }
        if (this.sound && this.sound.playClick) {
            this.sound.playClick();
        }
        if (this.ui && this.ui.showToastBanner) {
            const hasGhostData = this.bestRunFrames && this.bestRunFrames.length >= 2;
            const suffix = this.enabled && !hasGhostData ? ' (Finish a run to record PB!)' : '';
            this.ui.showToastBanner(`👻 Pacer Ghost: ${this.enabled ? 'ON' : 'OFF'}${suffix}`);
        }
        return this.enabled;
    }

    update(dt, speedrunActive, speedrunTime, speedrunCompleted) {
        if (!this.player || !this.player.position) return;

        // Record player samples during active speedruns
        if (speedrunActive && !speedrunCompleted) {
            this.sampleAccum += dt;
            if ((this.sampleAccum >= this.sampleInterval || this.currentRecording.length === 0) && this.currentRecording.length < this.maxSamples) {
                this.sampleAccum = 0;
                const ry = this.player.mesh ? this.player.mesh.rotation.y : 0;
                this.currentRecording.push({
                    t: Number(speedrunTime.toFixed(2)),
                    x: Number(this.player.position.x.toFixed(2)),
                    y: Number(this.player.position.y.toFixed(2)),
                    z: Number(this.player.position.z.toFixed(2)),
                    ry: Number(ry.toFixed(2))
                });
            }
        }

        // Render and interpolate ghost along saved PB run
        if (!this.ghostMesh) return;
        const frames = this.bestRunFrames;
        if (!this.enabled || !speedrunActive || speedrunCompleted || !frames || frames.length < 2) {
            this.ghostMesh.visible = false;
            return;
        }

        while (this.playbackIdx < frames.length - 2 && frames[this.playbackIdx + 1].t <= speedrunTime) {
            this.playbackIdx++;
        }
        while (this.playbackIdx > 0 && frames[this.playbackIdx].t > speedrunTime) {
            this.playbackIdx--;
        }

        const f0 = frames[this.playbackIdx];
        const f1 = frames[Math.min(frames.length - 1, this.playbackIdx + 1)];
        const span = Math.max(0.001, f1.t - f0.t);
        const alpha = Math.max(0, Math.min(1, (speedrunTime - f0.t) / span));

        const gx = f0.x + (f1.x - f0.x) * alpha;
        const gy = f0.y + (f1.y - f0.y) * alpha;
        const gz = f0.z + (f1.z - f0.z) * alpha;
        const gry = f0.ry + (f1.ry - f0.ry) * alpha;

        this.ghostMesh.position.set(gx, gy, gz);
        this.ghostMesh.rotation.y = gry;
        this.ghostMesh.visible = true;

        // Subtle holographic stride and rotating floor ring
        const horizMove = Math.hypot(f1.x - f0.x, f1.z - f0.z);
        if (horizMove > 0.05) {
            this.walkPhase += dt * 10;
            const swing = Math.sin(this.walkPhase) * 0.45;
            if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = swing;
            if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = -swing;
            if (this.limbs.leftArm) this.limbs.leftArm.rotation.x = -swing * 0.8;
            if (this.limbs.rightArm) this.limbs.rightArm.rotation.x = swing * 0.8;
        }
        if (this.limbs.halo) {
            this.limbs.halo.rotation.z += dt * 2.5;
        }
    }
}

if (typeof window !== 'undefined') {
    window.RobloxGhostRunner = RobloxGhostRunner;
}
