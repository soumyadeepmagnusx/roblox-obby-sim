/**
 * Roblox Studio Sandbox Mode
 * Place, color, and delete blocks in real-time with 2-stud grid snapping
 */
class RobloxBuilder {
    constructor(scene, world, camera, domElement) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.domElement = domElement;

        this.active = false;
        this.selectedType = 'normal'; // 'normal', 'lava', 'bounce', 'boost', 'coin', 'checkpoint'
        this.selectedColor = 0x3498DB; // Default blue

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.gridSize = 2; // 2 studs snapping

        // Custom placed blocks registry
        this.customBlocks = [];

        // Preview ghost block
        const ghostGeo = new THREE.BoxGeometry(2, 2, 2);
        this.ghostMat = new THREE.MeshBasicMaterial({
            color: 0x3498DB,
            wireframe: false,
            transparent: true,
            opacity: 0.5
        });
        this.ghostMesh = new THREE.Mesh(ghostGeo, this.ghostMat);
        this.ghostMesh.visible = false;
        this.scene.add(this.ghostMesh);

        // Ground plane for raycasting when clicking into empty air
        const planeGeo = new THREE.PlaneGeometry(1000, 1000);
        planeGeo.rotateX(-Math.PI / 2);
        this.plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ visible: false }));
        this.scene.add(this.plane);

        // Grid helper in studio mode
        this.gridHelper = new THREE.GridHelper(200, 100, 0x00FF88, 0x444444);
        this.gridHelper.position.y = -0.01;
        this.gridHelper.visible = false;
        this.scene.add(this.gridHelper);

        this.initEvents();
    }

    initEvents() {
        this.domElement.addEventListener('mousemove', (e) => {
            if (!this.active) return;
            const rect = this.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this.updateGhostPosition();
        });

        this.domElement.addEventListener('pointerdown', (e) => {
            if (!this.active) return;
            // Left click to place, Right click to delete
            if (e.button === 0) {
                this.placeBlock();
            } else if (e.button === 2) {
                this.deleteBlock();
            }
        });

        // Prevent context menu in builder mode
        this.domElement.addEventListener('contextmenu', (e) => {
            if (this.active) e.preventDefault();
        });
    }

    toggleMode() {
        this.active = !this.active;
        this.ghostMesh.visible = this.active;
        this.gridHelper.visible = this.active;
        return this.active;
    }

    setBlockType(type, color = null) {
        this.selectedType = type;
        if (color !== null) this.selectedColor = color;

        if (type === 'normal') {
            this.ghostMat.color.setHex(this.selectedColor);
        } else if (type === 'lava') {
            this.ghostMat.color.setHex(0xFF1100);
        } else if (type === 'bounce') {
            this.ghostMat.color.setHex(0xFFDD00);
        } else if (type === 'boost') {
            this.ghostMat.color.setHex(0x00F0FF);
        } else if (type === 'coin') {
            this.ghostMat.color.setHex(0xFFD700);
        } else if (type === 'checkpoint') {
            this.ghostMat.color.setHex(0x00FF88);
        }
    }

    updateGhostPosition() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Intersect against existing blocks or plane
        const allObjects = [...this.world.colliders.map(c => c.mesh), this.plane];
        const intersects = this.raycaster.intersectObjects(allObjects, false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const p = hit.point.clone();
            if (hit.face) {
                p.addScaledVector(hit.face.normal, 1);
            }

            // Snap to 2-stud grid
            const snapX = Math.round(p.x / this.gridSize) * this.gridSize;
            const snapY = Math.max(1, Math.round(p.y / this.gridSize) * this.gridSize);
            const snapZ = Math.round(p.z / this.gridSize) * this.gridSize;

            this.ghostMesh.position.set(snapX, snapY, snapZ);
            this.ghostMesh.visible = true;
        }
    }

    placeBlock(broadcast = true) {
        if (!this.ghostMesh.visible) return;

        // Verify Builder/Admin permission
        if (window.game && window.game.security && !window.game.security.checkPermission('build')) {
            if (window.game.ui) window.game.ui.addChatMessage('System', '❌ You need Builder permission to place blocks! Use /admin <password>', '#E74C3C');
            return;
        }

        const pos = this.ghostMesh.position.clone();

        let mat;
        let tag = 'solid';

        if (this.selectedType === 'normal') {
            mat = new THREE.MeshLambertMaterial({ color: this.selectedColor });
        } else if (this.selectedType === 'lava') {
            mat = this.world.mats.lava;
            tag = 'lava';
        } else if (this.selectedType === 'bounce') {
            mat = this.world.mats.bounce;
            tag = 'bounce';
        } else if (this.selectedType === 'boost') {
            mat = this.world.mats.boost;
            tag = 'boost';
        } else if (this.selectedType === 'coin') {
            this.world.addCoin(pos.x, pos.y, pos.z);
            if (window.soundEngine) window.soundEngine.playCoin();
            return;
        } else if (this.selectedType === 'checkpoint') {
            const nextStage = this.world.checkpoints.length + 1;
            this.world.addCheckpoint(nextStage, pos.x, pos.y, pos.z, 4);
            if (window.soundEngine) window.soundEngine.playCheckpoint();
            return;
        }

        const col = this.world.addBlock(pos.x, pos.y, pos.z, 2, 2, 2, mat, tag);
        this.customBlocks.push(col);

        if (window.soundEngine) window.soundEngine.playStep();
        this.saveCustomBlocks();

        // Broadcast to multiplayer server for Real-Time Collaborative Building
        if (broadcast && window.game && window.game.network) {
            window.game.network.broadcastBlockPlace({
                x: pos.x, y: pos.y, z: pos.z,
                type: this.selectedType,
                color: this.selectedColor,
                tag
            });
        }
    }

    deleteBlock(broadcast = true) {
        // Verify Builder/Admin permission
        if (window.game && window.game.security && !window.game.security.checkPermission('delete')) {
            if (window.game.ui) window.game.ui.addChatMessage('System', '❌ You need Builder permission to delete blocks!', '#E74C3C');
            return;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const customMeshes = this.customBlocks.map(c => c.mesh);
        const intersects = this.raycaster.intersectObjects(customMeshes, false);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const idx = this.customBlocks.findIndex(c => c.mesh === hitMesh);
            if (idx !== -1) {
                const col = this.customBlocks[idx];
                const blockPos = { x: col.mesh.position.x, y: col.mesh.position.y, z: col.mesh.position.z };

                this.scene.remove(col.mesh);
                col.mesh.geometry.dispose();

                // Remove from world lists
                const cIdx = this.world.colliders.indexOf(col);
                if (cIdx !== -1) this.world.colliders.splice(cIdx, 1);
                const hIdx = this.world.hazardBlocks.indexOf(col);
                if (hIdx !== -1) this.world.hazardBlocks.splice(hIdx, 1);
                const bIdx = this.world.bouncePads.indexOf(col);
                if (bIdx !== -1) this.world.bouncePads.splice(bIdx, 1);

                this.customBlocks.splice(idx, 1);
                this.saveCustomBlocks();

                // Broadcast deletion to all players
                if (broadcast && window.game && window.game.network) {
                    window.game.network.broadcastBlockDelete(blockPos);
                }
            }
        }
    }

    // Handle remote player block placement
    receiveRemoteBlockPlace(data) {
        let mat;
        if (data.type === 'lava') mat = this.world.mats.lava;
        else if (data.type === 'bounce') mat = this.world.mats.bounce;
        else if (data.type === 'boost') mat = this.world.mats.boost;
        else mat = new THREE.MeshLambertMaterial({ color: data.color });

        const col = this.world.addBlock(data.x, data.y, data.z, 2, 2, 2, mat, data.tag);
        this.customBlocks.push(col);
        if (window.soundEngine) window.soundEngine.playStep();
    }

    // Handle remote player block deletion
    receiveRemoteBlockDelete(pos) {
        const idx = this.customBlocks.findIndex(c =>
            Math.abs(c.mesh.position.x - pos.x) < 0.1 &&
            Math.abs(c.mesh.position.y - pos.y) < 0.1 &&
            Math.abs(c.mesh.position.z - pos.z) < 0.1
        );
        if (idx !== -1) {
            const col = this.customBlocks[idx];
            this.scene.remove(col.mesh);
            col.mesh.geometry.dispose();
            const cIdx = this.world.colliders.indexOf(col);
            if (cIdx !== -1) this.world.colliders.splice(cIdx, 1);
            this.customBlocks.splice(idx, 1);
        }
    }

    clearCustomBlocks() {
        this.customBlocks.forEach(col => {
            this.scene.remove(col.mesh);
            col.mesh.geometry.dispose();
            const cIdx = this.world.colliders.indexOf(col);
            if (cIdx !== -1) this.world.colliders.splice(cIdx, 1);
            const hIdx = this.world.hazardBlocks.indexOf(col);
            if (hIdx !== -1) this.world.hazardBlocks.splice(hIdx, 1);
        });
        this.customBlocks = [];
        localStorage.removeItem('roblox_custom_blocks');
    }

    saveCustomBlocks() {
        const data = this.customBlocks.map(c => ({
            x: c.mesh.position.x,
            y: c.mesh.position.y,
            z: c.mesh.position.z,
            tag: c.tag,
            color: c.mesh.material.color ? c.mesh.material.color.getHex() : 0xFFFFFF
        }));
        localStorage.setItem('roblox_custom_blocks', JSON.stringify(data));
    }

    loadCustomBlocks() {
        const saved = localStorage.getItem('roblox_custom_blocks');
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            data.forEach(d => {
                let mat;
                if (d.tag === 'lava') mat = this.world.mats.lava;
                else if (d.tag === 'bounce') mat = this.world.mats.bounce;
                else if (d.tag === 'boost') mat = this.world.mats.boost;
                else mat = new THREE.MeshLambertMaterial({ color: d.color });

                const col = this.world.addBlock(d.x, d.y, d.z, 2, 2, 2, mat, d.tag);
                this.customBlocks.push(col);
            });
        } catch (e) {
            console.error('Failed to load custom blocks:', e);
        }
    }
}

window.RobloxBuilder = RobloxBuilder;
