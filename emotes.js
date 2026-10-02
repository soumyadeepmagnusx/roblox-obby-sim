/**
 * Roblox Emotes & Animation System
 * Supports /e dance, /e wave, /e cheer, /e point, and Emote Wheel UI
 */
class RobloxEmotes {
    constructor(player, sound) {
        this.player = player;
        this.sound = sound;

        this.currentEmote = 'none'; // 'dance', 'wave', 'cheer', 'point'
        this.emoteTimer = 0;
    }

    playEmote(name) {
        this.currentEmote = name;
        this.emoteTimer = 0;
        this.sound.playCheckpoint();
    }

    stopEmote() {
        if (this.currentEmote !== 'none') {
            this.currentEmote = 'none';
            this.player.leftArmPivot.rotation.set(0, 0, 0);
            this.player.rightArmPivot.rotation.set(0, 0, 0);
            this.player.leftLegPivot.rotation.set(0, 0, 0);
            this.player.rightLegPivot.rotation.set(0, 0, 0);
        }
    }

    // Process chat commands like "/e dance"
    handleChatCommand(text) {
        const lower = text.trim().toLowerCase();
        if (lower.startsWith('/e ') || lower.startsWith('/emote ')) {
            const emoteName = lower.replace('/e ', '').replace('/emote ', '').trim();
            if (['dance', 'wave', 'cheer', 'point'].includes(emoteName)) {
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
            this.player.group.rotation.y += dt * 1.8; // spin
        } else if (this.currentEmote === 'wave') {
            // Wave right arm overhead
            this.player.rightArmPivot.rotation.z = 2.4;
            this.player.rightArmPivot.rotation.y = Math.sin(this.emoteTimer * 2) * 0.6;
        } else if (this.currentEmote === 'cheer') {
            // Both arms pumped high, mini hop
            this.player.leftArmPivot.rotation.z = 2.8;
            this.player.rightArmPivot.rotation.z = -2.8;
            this.player.position.y = this.player.spawnPoint.y + Math.abs(Math.sin(this.emoteTimer * 1.5)) * 0.8;
        } else if (this.currentEmote === 'point') {
            // Point forward with right arm
            this.player.rightArmPivot.rotation.x = -1.57;
            this.player.rightArmPivot.rotation.y = -0.2;
        }

        return true; // emote is active, override default idle
    }
}

window.RobloxEmotes = RobloxEmotes;
