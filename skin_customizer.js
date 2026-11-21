/**
 * Roblox Avatar Skin & Body Part Color Palette Customizer
 * Allows players to tint Head, Torso, Arms, and Legs with classic Roblox palettes.
 * Persists customized colors across game sessions in localStorage.
 */
class RobloxSkinCustomizer {
    constructor(player, sound, ui) {
        this.player = player;
        this.sound = sound;
        this.ui = ui;

        this.palettes = [
            { name: "Classic Noob", head: 0xFFDE00, torso: 0x0D69AB, arms: 0xFFDE00, legs: 0x00A859 },
            { name: "Golden Robloxian", head: 0xFFD700, torso: 0xFFB300, arms: 0xFFD700, legs: 0xFFA000 },
            { name: "Neon Cyber", head: 0x00FFFF, torso: 0xFF007F, arms: 0x00FFFF, legs: 0x7928CA },
            { name: "Obsidian Stealth", head: 0x222222, torso: 0x111111, arms: 0x222222, legs: 0x0A0A0A },
            { name: "Ruby Champion", head: 0xFFD1A4, torso: 0xCC0022, arms: 0xFFD1A4, legs: 0x880015 },
            { name: "Emerald Explorer", head: 0xF0C090, torso: 0x2ECC71, arms: 0xF0C090, legs: 0x27AE60 },
            { name: "Pastel Dream", head: 0xFFE0BD, torso: 0xFFB6C1, arms: 0xFFE0BD, legs: 0x87CEEB },
            { name: "Frost Knight", head: 0xDEF3F8, torso: 0x4A90E2, arms: 0xDEF3F8, legs: 0x1B3B6F }
        ];

        this.currentColors = this.loadSavedColors() || {
            head: 0xFFDE00,
            torso: 0x0D69AB,
            arms: 0xFFDE00,
            legs: 0x00A859
        };

        this.initDOM();
        this.applyColors(this.currentColors, false);
    }

    loadSavedColors() {
        try {
            const raw = localStorage.getItem('roblox_avatar_skin_colors');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    saveColors(colors) {
        try {
            localStorage.setItem('roblox_avatar_skin_colors', JSON.stringify(colors));
        } catch (e) {}
    }

    applyColors(colors, showToast = true) {
        this.currentColors = { ...colors };
        this.saveColors(this.currentColors);

        if (!this.player) return;

        // Apply Head
        if (this.player.head) {
            if (Array.isArray(this.player.head.material)) {
                this.player.head.material.forEach((mat, i) => {
                    if (i !== 4) mat.color.setHex(this.currentColors.head); // Keep face texture slot intact
                });
            } else if (this.player.head.material) {
                this.player.head.material.color.setHex(this.currentColors.head);
            }
        }

        // Apply Torso
        if (this.player.torso && this.player.torso.material) {
            this.player.torso.material.color.setHex(this.currentColors.torso);
        }

        // Apply Arms
        if (this.player.leftArm && this.player.leftArm.material) {
            this.player.leftArm.material.color.setHex(this.currentColors.arms);
        }
        if (this.player.rightArm && this.player.rightArm.material) {
            this.player.rightArm.material.color.setHex(this.currentColors.arms);
        }

        // Apply Legs
        if (this.player.leftLeg && this.player.leftLeg.material) {
            this.player.leftLeg.material.color.setHex(this.currentColors.legs);
        }
        if (this.player.rightLeg && this.player.rightLeg.material) {
            this.player.rightLeg.material.color.setHex(this.currentColors.legs);
        }

        if (showToast && this.ui) {
            this.ui.showToastBanner('🎨 Avatar Skin Palette Updated!');
        }
        if (showToast && this.sound) {
            this.sound.playStep('ice');
        }
    }

    initDOM() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('skin-customizer-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'skin-customizer-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 14, 22, 0.88);
            backdrop-filter: blur(10px);
            z-index: 120;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            width: 500px;
            max-width: 92%;
            background: rgba(22, 27, 38, 0.96);
            border: 2px solid #00FFFF;
            box-shadow: 0 12px 40px rgba(0, 255, 255, 0.35);
            border-radius: 16px;
            padding: 24px;
            color: #FFF;
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                <div style="font-size:18px; font-weight:800; color:#00FFFF; display:flex; align-items:center; gap:8px;">
                    🎨 <span>AVATAR BODY COLOR PALETTES</span>
                </div>
                <span style="cursor:pointer; font-size:22px; color:#AAA;" onclick="window.game.skinCustomizer.toggleModal()">✕</span>
            </div>
            <div style="font-size:12px; color:#CCC;">
                Choose an iconic Roblox color theme or preset below to customize your avatar's appearance in real time!
            </div>
            <div id="skin-palettes-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:10px;"></div>
            <button class="menu-btn primary" onclick="window.game.skinCustomizer.toggleModal()" style="width:100%; padding:10px; font-weight:bold; background:#00FFFF; color:#000; border:none; border-radius:8px; cursor:pointer;">
                Close Customizer
            </button>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);
        this.modal = modal;

        this.renderPalettes();
    }

    renderPalettes() {
        const grid = document.getElementById('skin-palettes-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.palettes.forEach(p => {
            const btn = document.createElement('div');
            btn.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                padding: 10px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 8px;
                transition: transform 0.2s, border-color 0.2s;
            `;
            btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.borderColor = '#00FFFF'; };
            btn.onmouseout = () => { btn.style.transform = 'none'; btn.style.borderColor = 'rgba(255,255,255,0.15)'; };

            const toHex = (c) => '#' + c.toString(16).padStart(6, '0');

            btn.innerHTML = `
                <div style="font-weight:bold; font-size:13px; color:#FFF;">${p.name}</div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <div title="Head" style="width:20px; height:20px; border-radius:4px; background:${toHex(p.head)}; border:1px solid rgba(0,0,0,0.4);"></div>
                    <div title="Torso" style="width:28px; height:20px; border-radius:4px; background:${toHex(p.torso)}; border:1px solid rgba(0,0,0,0.4);"></div>
                    <div title="Arms" style="width:14px; height:20px; border-radius:4px; background:${toHex(p.arms)}; border:1px solid rgba(0,0,0,0.4);"></div>
                    <div title="Legs" style="width:16px; height:20px; border-radius:4px; background:${toHex(p.legs)}; border:1px solid rgba(0,0,0,0.4);"></div>
                </div>
            `;

            btn.addEventListener('click', () => {
                this.applyColors(p);
            });

            grid.appendChild(btn);
        });
    }

    toggleModal() {
        if (!this.modal) return;
        const isOpen = this.modal.style.display === 'flex';
        this.modal.style.display = isOpen ? 'none' : 'flex';
    }
}

if (typeof window !== 'undefined') {
    window.RobloxSkinCustomizer = RobloxSkinCustomizer;
}
