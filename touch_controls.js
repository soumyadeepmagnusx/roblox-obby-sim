/**
 * Roblox Mobile Touch Controls & Gamepad Controller Engine
 * Provides:
 * - Dynamic touch joystick for smooth analog/directional movement on phones & tablets
 * - Dedicated responsive touch action buttons (Jump, Sprint, Board, Jetpack, Interact)
 * - Standard HTML5 Gamepad API polling for Xbox / PlayStation / Bluetooth controllers
 */
class RobloxTouchAndGamepadControls {
    constructor(player, cameraController, ui, sound) {
        this.player = player;
        this.camera = cameraController;
        this.ui = ui;
        this.sound = sound;

        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.gamepadIndex = null;

        // Joystick state
        this.joystickActive = false;
        this.touchId = null;
        this.originX = 0;
        this.originY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.maxRadius = 50;

        this.initTouchUI();
        this.bindGamepadEvents();
    }

    initTouchUI() {
        if (!this.isTouchDevice) return;

        // Container
        const container = document.createElement('div');
        container.id = 'mobile-touch-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            user-select: none;
            -webkit-user-select: none;
        `;

        // Left Joystick Area
        const joyZone = document.createElement('div');
        joyZone.id = 'touch-joystick-zone';
        joyZone.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            border: 2px solid rgba(255, 255, 255, 0.2);
            pointer-events: auto;
            touch-action: none;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        `;

        const joyKnob = document.createElement('div');
        joyKnob.id = 'touch-joystick-knob';
        joyKnob.style.cssText = `
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: radial-gradient(circle, #00FF88 0%, #009944 100%);
            box-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
            transform: translate(0px, 0px);
            transition: transform 0.05s ease-out;
            pointer-events: none;
        `;
        joyZone.appendChild(joyKnob);
        container.appendChild(joyZone);

        // Right Action Buttons Area
        const actionsZone = document.createElement('div');
        actionsZone.id = 'touch-actions-zone';
        actionsZone.style.cssText = `
            position: absolute;
            bottom: 24px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: flex-end;
            pointer-events: auto;
        `;

        // Big Jump Button
        const jumpBtn = this.createActionButton('🚀 JUMP', '#0074E4', 70, 70, () => {
            if (this.ui) this.ui.inputState.jump = true;
            setTimeout(() => { if (this.ui) this.ui.inputState.jump = false; }, 180);
        });

        // Quick row of utility buttons
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 10px;';

        const hoverBtn = this.createActionButton('🛹', 'rgba(0,255,255,0.25)', 46, 46, () => {
            if (window.game && window.game.vehicles) window.game.vehicles.toggleHoverboard();
        });

        const jetBtn = this.createActionButton('🚀', 'rgba(255,85,0,0.25)', 46, 46, () => {
            if (window.game && window.game.vehicles) window.game.vehicles.toggleJetpack();
        });

        const interactBtn = this.createActionButton('⚡ E', 'rgba(255,215,0,0.25)', 46, 46, () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
        });

        btnRow.appendChild(hoverBtn);
        btnRow.appendChild(jetBtn);
        btnRow.appendChild(interactBtn);

        actionsZone.appendChild(btnRow);
        actionsZone.appendChild(jumpBtn);
        container.appendChild(actionsZone);

        document.body.appendChild(container);

        // Bind Joystick Touch Events
        joyZone.addEventListener('touchstart', (e) => this.handleTouchStart(e, joyZone), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e, joyKnob), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e, joyKnob), { passive: false });
        window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e, joyKnob), { passive: false });
    }

    createActionButton(label, bg, width, height, onClick) {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            border-radius: 50%;
            background: ${bg};
            border: 2px solid rgba(255, 255, 255, 0.4);
            color: #FFF;
            font-size: ${width > 50 ? '14px' : '18px'};
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
        `;
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.style.transform = 'scale(0.9)';
            onClick();
        });
        btn.addEventListener('touchend', () => {
            btn.style.transform = 'scale(1.0)';
        });
        return btn;
    }

    handleTouchStart(e, zone) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.touchId = touch.identifier;
        this.joystickActive = true;

        const rect = zone.getBoundingClientRect();
        this.originX = rect.left + rect.width / 2;
        this.originY = rect.top + rect.height / 2;
    }

    handleTouchMove(e, knob) {
        if (!this.joystickActive) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.touchId) {
                const dx = touch.clientX - this.originX;
                const dy = touch.clientY - this.originY;
                const dist = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx);

                const clampedDist = Math.min(dist, this.maxRadius);
                const knobX = Math.cos(angle) * clampedDist;
                const knobY = Math.sin(angle) * clampedDist;

                knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

                // Map to inputs
                const deadzone = 12;
                if (this.ui && this.ui.inputState) {
                    this.ui.inputState.forward = dy < -deadzone;
                    this.ui.inputState.backward = dy > deadzone;
                    this.ui.inputState.left = dx < -deadzone;
                    this.ui.inputState.right = dx > deadzone;
                }
                break;
            }
        }
    }

    handleTouchEnd(e, knob) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                this.joystickActive = false;
                this.touchId = null;
                knob.style.transform = 'translate(0px, 0px)';

                if (this.ui && this.ui.inputState) {
                    this.ui.inputState.forward = false;
                    this.ui.inputState.backward = false;
                    this.ui.inputState.left = false;
                    this.ui.inputState.right = false;
                }
                break;
            }
        }
    }

    bindGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
            if (this.ui) {
                this.ui.showToastBanner(`🎮 Gamepad Connected: ${e.gamepad.id.slice(0, 24)}...`);
                this.ui.addChatMessage('System', `🎮 Controller detected! Left Stick to Move, A to Jump, Right Stick to Orbit.`, '#00FF88');
            }
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.gamepadIndex = null;
            if (this.ui) {
                this.ui.showToastBanner('🎮 Gamepad Disconnected.');
            }
        });
    }

    update(dt) {
        // Poll Gamepad
        if (this.gamepadIndex !== null) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[this.gamepadIndex];
            if (!gp) return;

            const deadzone = 0.22;
            const axisX = gp.axes[0];
            const axisY = gp.axes[1];

            if (this.ui && this.ui.inputState) {
                this.ui.inputState.left = axisX < -deadzone;
                this.ui.inputState.right = axisX > deadzone;
                this.ui.inputState.forward = axisY < -deadzone;
                this.ui.inputState.backward = axisY > deadzone;

                // Button 0 = A / Cross (Jump)
                if (gp.buttons[0] && gp.buttons[0].pressed) {
                    this.ui.inputState.jump = true;
                }
            }

            // Right stick camera orbit
            if (this.camera && gp.axes.length >= 4) {
                const camX = gp.axes[2];
                const camY = gp.axes[3];
                if (Math.abs(camX) > deadzone) {
                    this.camera.yaw -= camX * dt * 2.5;
                }
                if (Math.abs(camY) > deadzone) {
                    this.camera.pitch = Math.max(-1.1, Math.min(1.1, this.camera.pitch - camY * dt * 2.0));
                }
            }
        }
    }
}
