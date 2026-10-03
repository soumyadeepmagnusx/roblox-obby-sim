/**
 * Roblox 3D Speech Bubbles Engine
 * Renders iconic cartoon speech bubbles floating directly above avatar heads in world space
 * Triggers on both local player, remote player, and bot chat messages
 */
class RobloxSpeechBubbles {
    constructor(scene) {
        this.scene = scene;
        this.activeBubbles = new Map(); // targetId/rig -> { sprite, life, targetMesh }
    }

    /**
     * Show speech bubble over a 3D target mesh
     */
    showBubble(targetId, targetMesh, text) {
        if (!targetMesh) return;

        // Clean up previous bubble on this target if active
        if (this.activeBubbles.has(targetId)) {
            const old = this.activeBubbles.get(targetId);
            this.scene.remove(old.sprite);
            if (old.sprite.material.map) old.sprite.material.map.dispose();
            old.sprite.material.dispose();
            this.activeBubbles.delete(targetId);
        }

        // Generate 2D Canvas bubble texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');

        // Draw Speech Bubble rounded rectangle with shadow
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#1E2026';
        ctx.lineWidth = 6;

        const bx = 16, by = 16, bw = 480, bh = 110, r = 24;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + bw - r, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
        ctx.lineTo(bx + bw, by + bh - r);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
        // Bottom pointer tail
        ctx.lineTo(256 + 20, by + bh);
        ctx.lineTo(256, by + bh + 32);
        ctx.lineTo(256 - 20, by + bh);
        ctx.lineTo(bx + r, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
        ctx.lineTo(bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Reset shadow for text
        ctx.shadowColor = 'transparent';

        // Draw text (wrap if too long)
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let displayText = text;
        if (displayText.length > 32) {
            displayText = displayText.substring(0, 30) + '...';
        }
        ctx.fillText(displayText, 256, 70);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            opacity: 1.0,
            depthTest: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(6.0, 2.1, 1);

        this.scene.add(sprite);

        this.activeBubbles.set(targetId, {
            sprite,
            life: 5.5,
            targetMesh
        });
    }

    update(dt) {
        this.activeBubbles.forEach((b, id) => {
            b.life -= dt;

            if (b.life <= 0 || !b.targetMesh) {
                this.scene.remove(b.sprite);
                if (b.sprite.material.map) b.sprite.material.map.dispose();
                b.sprite.material.dispose();
                this.activeBubbles.delete(id);
                return;
            }

            // Anchor above target mesh head
            const pos = b.targetMesh.position;
            b.sprite.position.set(pos.x, pos.y + 5.2, pos.z);

            // Fade out in last 0.8 seconds
            if (b.life < 0.8) {
                b.sprite.material.opacity = Math.max(0, b.life / 0.8);
            }
        });
    }
}

window.RobloxSpeechBubbles = RobloxSpeechBubbles;
