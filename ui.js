/**
 * Roblox User Interface & Input Handler
 * Leaderboard, Chat, Menu, Mobile Controls & Studio Toolbar
 */
class RobloxUI {
    constructor(player, camera, builder, sound) {
        this.player = player;
        this.camera = camera;
        this.builder = builder;
        this.sound = sound;

        // Input states
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        // Game timer
        this.startTime = Date.now();
        this.elapsedSeconds = 0;

        this.initDom();
        this.initKeyListeners();
        this.initTouchControls();
    }

    initDom() {
        // Build elements dynamically or hook existing DOM
        this.stageEl = document.getElementById('hud-stage');
        this.coinsEl = document.getElementById('hud-coins');
        this.deathsEl = document.getElementById('hud-deaths');
        this.timeEl = document.getElementById('hud-time');
        this.healthFillEl = document.getElementById('hud-health-fill');
        this.bannerEl = document.getElementById('stage-banner');
        this.bannerText = document.getElementById('stage-banner-text');

        // Chat
        this.chatBox = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');

        // Menu Modal
        this.menuModal = document.getElementById('roblox-menu-modal');

        // Initial welcome chat messages
        this.addChatMessage('System', 'Welcome to Roblox Obby Simulator! Jump across blocks and reach the Golden Trophy!', '#00FF88');
        this.addChatMessage('RobloxBot', 'Press R to reset, Shift or Lock button for Shift-Lock, B for Studio Mode.', '#F39C12');
    }

    initKeyListeners() {
        window.addEventListener('keydown', (e) => {
            // If typing in chat, do not move player
            if (document.activeElement === this.chatInput) {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
                return;
            }

            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.inputState.forward = true;
            if (key === 's' || key === 'arrowdown') this.inputState.backward = true;
            if (key === 'a' || key === 'arrowleft') this.inputState.left = true;
            if (key === 'd' || key === 'arrowright') this.inputState.right = true;
            if (e.code === 'Space') {
                this.inputState.jump = true;
                e.preventDefault();
            }

            // Quick keys
            if (key === 'r') {
                this.player.die();
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.camera.toggleShiftLock();
            }
            if (key === 'b') {
                this.toggleStudioMode();
            }
            if (key === 'm') {
                const playing = this.sound.toggleBgm();
                this.addChatMessage('System', `Music ${playing ? 'ON' : 'OFF'}`, '#3498DB');
            }
            if (e.key === 'Escape') {
                this.toggleMenu();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.inputState.forward = false;
            if (key === 's' || key === 'arrowdown') this.inputState.backward = false;
            if (key === 'a' || key === 'arrowleft') this.inputState.left = false;
            if (key === 'd' || key === 'arrowright') this.inputState.right = false;
            if (e.code === 'Space') this.inputState.jump = false;
        });
    }

    initTouchControls() {
        const dpadUp = document.getElementById('touch-up');
        const dpadDown = document.getElementById('touch-down');
        const dpadLeft = document.getElementById('touch-left');
        const dpadRight = document.getElementById('touch-right');
        const touchJump = document.getElementById('touch-jump');

        const bindTouch = (el, prop) => {
            if (!el) return;
            const start = (e) => { e.preventDefault(); this.inputState[prop] = true; };
            const end = (e) => { e.preventDefault(); this.inputState[prop] = false; };
            el.addEventListener('touchstart', start, { passive: false });
            el.addEventListener('touchend', end, { passive: false });
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', end);
        };

        bindTouch(dpadUp, 'forward');
        bindTouch(dpadDown, 'backward');
        bindTouch(dpadLeft, 'left');
        bindTouch(dpadRight, 'right');
        bindTouch(touchJump, 'jump');
    }

    toggleStudioMode() {
        const isActive = this.builder.toggleMode();
        const studioBar = document.getElementById('studio-toolbar');
        const modeBtn = document.getElementById('btn-toggle-mode');
        if (studioBar) studioBar.style.display = isActive ? 'flex' : 'none';
        if (modeBtn) {
            modeBtn.innerHTML = isActive ? '🎮 Switch to Play Mode' : '🔨 Roblox Studio Mode';
            modeBtn.className = isActive ? 'hud-btn active' : 'hud-btn';
        }
        this.addChatMessage('Studio', isActive ? 'Entered Studio Mode! Click to place blocks, Right-click to delete.' : 'Returned to Play Mode! Test your obstacle course.', '#00FF88');
    }

    toggleMenu() {
        if (!this.menuModal) return;
        const isShown = this.menuModal.style.display === 'flex';
        this.menuModal.style.display = isShown ? 'none' : 'flex';
    }

    showBanner(title, subtitle) {
        if (!this.bannerEl) return;
        this.bannerText.innerHTML = `<span style="font-size:24px; color:#FFE600;">${title}</span><br><span style="font-size:16px;">${subtitle}</span>`;
        this.bannerEl.style.opacity = '1';
        this.bannerEl.style.transform = 'translate(-50%, 0) scale(1)';

        setTimeout(() => {
            this.bannerEl.style.opacity = '0';
            this.bannerEl.style.transform = 'translate(-50%, -20px) scale(0.9)';
        }, 2800);
    }

    addChatMessage(sender, text, color = '#FFFFFF') {
        if (!this.chatBox) return;
        const cleanSender = window.game && window.game.security ? window.game.security.sanitizeChat(sender) : sender;
        const cleanText = window.game && window.game.security ? window.game.security.sanitizeChat(text) : text;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.innerHTML = `<span style="color:${color}; font-weight:bold;">[${cleanSender}]:</span> <span>${cleanText}</span>`;
        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    sendChatMessage() {
        if (!this.chatInput) return;
        const rawVal = this.chatInput.value.trim();
        if (rawVal.length > 0) {
            // Check Emote commands like /e dance, /e wave, /e cheer
            if (window.game && window.game.emotes && window.game.emotes.handleChatCommand(rawVal)) {
                this.addChatMessage('System', `Playing emote: ${rawVal}`, '#00FF88');
                this.chatInput.value = '';
                this.chatInput.blur();
                return;
            }

            // Check Admin commands like /admin roblox2026
            if (window.game && window.game.security) {
                const adminResult = window.game.security.handleAdminCommand(rawVal);
                if (adminResult) {
                    this.addChatMessage('System', adminResult.message, adminResult.success ? '#00FF88' : '#E74C3C');
                    this.chatInput.value = '';
                    this.chatInput.blur();
                    return;
                }
            }

            const cleanVal = window.game && window.game.security ? window.game.security.sanitizeChat(rawVal) : rawVal;
            this.addChatMessage('Player1', cleanVal, '#3498DB');
            this.chatInput.value = '';

            // Show 3D Speech Bubble over local player head
            if (window.game && window.game.speechBubbles && this.player && this.player.group) {
                window.game.speechBubbles.showBubble('me', this.player.group, cleanVal);
            }

            // Broadcast to multiplayer server
            if (window.game && window.game.network) {
                window.game.network.sendChat(cleanVal);
            }

            // Simulated bot responses for fun
            if (cleanVal.toLowerCase().includes('hi') || cleanVal.toLowerCase().includes('hello')) {
                setTimeout(() => this.addChatMessage('RobloxBot', 'Hey there! Good luck on Stage ' + this.player.currentStage + '!', '#F39C12'), 600);
            } else if (cleanVal.toLowerCase().includes('oof')) {
                this.player.die();
            }
        }
        this.chatInput.blur();
    }

    update(dt) {
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(this.elapsedSeconds % 60).padStart(2, '0');

        if (this.stageEl) this.stageEl.innerText = `${this.player.currentStage}/${this.player.maxStage}`;
        if (this.coinsEl) this.coinsEl.innerText = this.player.coins;
        if (this.deathsEl) this.deathsEl.innerText = this.player.deaths;
        if (this.timeEl) this.timeEl.innerText = `${mins}:${secs}`;

        // Health bar
        if (this.healthFillEl) {
            this.healthFillEl.style.width = `${this.player.health}%`;
        }

        // Stage progress check for banner trigger
        if (this.lastRecordedStage !== this.player.currentStage) {
            this.lastRecordedStage = this.player.currentStage;
            const stageNames = [
                "Spawn Island",
                "Rainbow Steps",
                "Neon Lava Leap",
                "Spinning Sweepers",
                "Hologram Platforms",
                "Speed & Launch Trampoline",
                "Winner's Peak & Trophy!"
            ];
            const name = stageNames[this.player.currentStage - 1] || `Stage ${this.player.currentStage}`;
            this.showBanner(`★ STAGE ${this.player.currentStage} REACHED! ★`, name);
            this.addChatMessage('System', `Checkpoint saved at Stage ${this.player.currentStage}: ${name}!`, '#00FF88');
        }

        // Victory celebration banner
        if (this.player.hasWon && !this.victoryAnnounced) {
            this.victoryAnnounced = true;
            this.showBanner('🏆 OBBY CONQUERED! 🏆', `Completed in ${mins}:${secs} with ${this.player.deaths} deaths!`);
            this.addChatMessage('Victory', `★ Player1 reached the Golden Trophy and earned the Winner's Halo! ★`, '#FFD700');
        }
    }
}

window.RobloxUI = RobloxUI;
