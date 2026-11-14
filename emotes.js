/**
 * Roblox Emotes & Animation System
 * Supports /e dance, /e floss, /e zombie, /e flip, /e spin, /e dab, /e wave, /e cheer, /e point
 * Hotkey [J] opens Emote Wheel modal.
 */
class RobloxEmotes {
    constructor(player, sound) {
        this.player = player;
        this.sound = sound;

        this.currentEmote = 'none';
        this.emoteTimer = 0;
        this.baseY = 0;

        this.bindEvents();
    }

    bindEvents() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (e.code === 'KeyJ') {
                if (typeof window.toggleEmotesModal === 'function') {
                    window.toggleEmotesModal();
                }
            }
        });
    }

    playEmote(name) {
        this.currentEmote = name;
        this.emoteTimer = 0;
        if (this.player && this.player.position) {
            this.baseY = this.player.position.y;
        }

        if (this.sound && this.sound.playCheckpoint) {
            this.sound.playCheckpoint();
        }

        if (window.game && window.game.ui && window.game.ui.showToastBanner) {
            window.game.ui.showToastBanner(`💃 Emote: /e ${name}`);
        }
    }

    stopEmote() {
        if (this.currentEmote !== 'none') {
            this.currentEmote = 'none';
            if (this.player) {
                if (this.player.leftArmPivot) this.player.leftArmPivot.rotation.set(0, 0, 0);
                if (this.player.rightArmPivot) this.player.rightArmPivot.rotation.set(0, 0, 0);
                if (this.player.leftLegPivot) this.player.leftLegPivot.rotation.set(0, 0, 0);
                if (this.player.rightLegPivot) this.player.rightLegPivot.rotation.set(0, 0, 0);
                if (this.player.torso) this.player.torso.rotation.set(0, 0, 0);
                if (this.player.head) this.player.head.rotation.set(0, 0, 0);
                if (this.player.group) {
                    this.player.group.rotation.x = 0;
                    this.player.group.rotation.z = 0;
                }
            }
        }
    }

    // Process chat commands like "/e dance" or "/e floss"
    handleChatCommand(text) {
        const lower = text.trim().toLowerCase();
        if (lower.startsWith('/e ') || lower.startsWith('/emote ')) {
            let emoteName = lower.replace('/e ', '').replace('/emote ', '').trim();
            if (emoteName === 'flip') emoteName = 'backflip';
            if (emoteName === 'spin') emoteName = 'headspin';

            const valid = ['dance', 'wave', 'cheer', 'point', 'floss', 'zombie', 'backflip', 'headspin', 'dab'];
            if (valid.includes(emoteName)) {
                this.playEmote(emoteName);
                return true;
            }
        }
        return false;
    }

    update(dt, isMoving, isGrounded) {
        // If player moves or jumps, cancel emote
        if (isMoving || !isGrounded) {
            this.stopEmote();
            return false;
        }

        if (this.currentEmote === 'none') return false;

        this.emoteTimer += dt * 8;

        if (this.currentEmote === 'dance') {
            // Rhythmic Roblox breakdance / arm wave
            const wave = Math.sin(this.emoteTimer);
            const side = Math.cos(this.emoteTimer * 0.5);

            this.player.leftArmPivot.rotation.z = Math.abs(wave) * 1.5;
            this.player.leftArmPivot.rotation.x = wave * 0.8;
            this.player.rightArmPivot.rotation.z = -Math.abs(wave) * 1.5;
            this.player.rightArmPivot.rotation.x = -wave * 0.8;

            this.player.leftLegPivot.rotation.x = side * 0.4;
            this.player.rightLegPivot.rotation.x = -side * 0.4;
            this.player.group.rotation.y += dt * 1.8;

        } else if (this.currentEmote === 'floss') {
            // Iconic Floss Dance: arms sway together left/right, hips swing opposite
            const swing = Math.sin(this.emoteTimer * 1.4);
            this.player.leftArmPivot.rotation.z = swing * 0.95;
            this.player.rightArmPivot.rotation.z = swing * 0.95;
            this.player.leftArmPivot.rotation.x = Math.cos(this.emoteTimer * 1.4) * 0.45;
            this.player.rightArmPivot.rotation.x = -Math.cos(this.emoteTimer * 1.4) * 0.45;
            if (this.player.torso) this.player.torso.rotation.y = -swing * 0.35;
            this.player.leftLegPivot.rotation.z = -swing * 0.2;
            this.player.rightLegPivot.rotation.z = -swing * 0.2;

        } else if (this.currentEmote === 'zombie') {
            // Spooky Zombie Walk: arms forward, limp tilt, shuffling legs
            this.player.leftArmPivot.rotation.set(-1.57, 0, Math.sin(this.emoteTimer) * 0.12);
            this.player.rightArmPivot.rotation.set(-1.57, 0, -Math.sin(this.emoteTimer) * 0.12);
            if (this.player.head) this.player.head.rotation.z = 0.22;
            this.player.leftLegPivot.rotation.x = Math.sin(this.emoteTimer * 0.8) * 0.25;
            this.player.rightLegPivot.rotation.x = -Math.sin(this.emoteTimer * 0.8) * 0.25;

        } else if (this.currentEmote === 'backflip') {
            // 360-degree Acrobatic Backflip
            const cycle = (this.emoteTimer * 0.6) % (Math.PI * 2);
            this.player.group.rotation.x = -cycle;
            if (this.player.position && this.baseY !== undefined) {
                this.player.position.y = this.baseY + Math.sin(cycle * 0.5) * 2.2;
            }
            this.player.leftLegPivot.rotation.x = Math.sin(cycle) * 0.6;
            this.player.rightLegPivot.rotation.x = Math.sin(cycle) * 0.6;

        } else if (this.currentEmote === 'headspin') {
            // Breakdance Headspin
            if (this.player.group) {
                this.player.group.rotation.z = Math.PI;
                this.player.group.rotation.y += dt * 14.0;
            }
            if (this.player.position && this.baseY !== undefined) {
                this.player.position.y = this.baseY + 1.2;
            }
            this.player.leftLegPivot.rotation.z = 0.7;
            this.player.rightLegPivot.rotation.z = -0.7;

        } else if (this.currentEmote === 'dab') {
            // Classic Roblox Dab
            this.player.leftArmPivot.rotation.set(-1.25, 0.45, 1.35);
            this.player.rightArmPivot.rotation.set(-0.85, -0.4, -1.55);
            if (this.player.head) this.player.head.rotation.set(0.35, 0.5, 0);

        } else if (this.currentEmote === 'wave') {
            // Wave right arm overhead
            this.player.rightArmPivot.rotation.z = 2.4;
            this.player.rightArmPivot.rotation.y = Math.sin(this.emoteTimer * 2) * 0.6;

        } else if (this.currentEmote === 'cheer') {
            // Both arms pumped high, mini hop
            this.player.leftArmPivot.rotation.z = 2.8;
            this.player.rightArmPivot.rotation.z = -2.8;
            if (this.player.position && this.baseY !== undefined) {
                this.player.position.y = this.baseY + Math.abs(Math.sin(this.emoteTimer * 1.5)) * 0.8;
            }

        } else if (this.currentEmote === 'point') {
            // Point forward with right arm
            this.player.rightArmPivot.rotation.x = -1.57;
            this.player.rightArmPivot.rotation.y = -0.2;
        }

        return true;
    }
}

if (typeof window !== 'undefined') {
    window.RobloxEmotes = RobloxEmotes;
}
