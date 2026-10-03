/**
 * Roblox Proximity & Squad Voice Chat Engine (WebRTC)
 * Features:
 * - Real-time Peer-to-Peer Voice Audio over WebRTC
 * - Proximity 3D Volume Falloff (louder when close, softer when far)
 * - Mic Toggle (Click or Press 'V')
 * - Audio-reactive speaking indicator above avatar head
 * - Graceful fallback if no microphone is connected
 */
class RobloxVoiceChat {
    constructor(player, scene, network, ui, sound) {
        this.player = player;
        this.scene = scene;
        this.network = network;
        this.ui = ui;
        this.sound = sound;

        this.localStream = null;
        this.isMicEnabled = false;
        this.isSpeaking = false;

        // WebRTC peer connections: Map<remotePlayerId, { pc, audioElement, gainNode, pannerNode }>
        this.peers = new Map();

        // Web Audio Context for audio analysis & spatial panning
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;

        // RTC Configuration with free public STUN servers
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        this.initKeybind();
        this.createLocalMicIndicator();
    }

    initKeybind() {
        window.addEventListener('keydown', (e) => {
            if (this.ui && this.ui.isChatFocused()) return;

            // Press 'V' to toggle voice microphone
            if (e.key === 'v' || e.key === 'V') {
                this.toggleMic();
            }
        });
    }

    createLocalMicIndicator() {
        // 3D Mic icon sprite attached to local player head
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw microphone icon
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.arc(64, 48, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(58, 64, 12, 24);
        ctx.fillRect(44, 88, 40, 8);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
        this.micSprite = new THREE.Sprite(mat);
        this.micSprite.position.set(0, 5.2, 0);
        this.micSprite.scale.set(1.4, 1.4, 1);

        if (this.player && this.player.group) {
            this.player.group.add(this.micSprite);
        }
    }

    async toggleMic() {
        if (!this.localStream) {
            try {
                // Request user microphone
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                });

                // Init Web Audio analyser for volume detection
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
                const source = this.audioCtx.createMediaStreamSource(this.localStream);
                this.analyser = this.audioCtx.createAnalyser();
                this.analyser.fftSize = 64;
                source.connect(this.analyser);
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                this.isMicEnabled = true;
                this.updateMicUi();
                this.ui.addChatMessage('Voice', '🎙️ Microphone connected! You can now talk to friends in your room.', '#00FF88');

                // Connect to existing peers in room
                this.connectToExistingPeers();

            } catch (err) {
                console.warn('[VoiceChat] Microphone permission denied or not available:', err);
                this.ui.addChatMessage('Voice', '⚠️ Microphone not found or permission denied. Text chat is active!', '#F39C12');
                return;
            }
        } else {
            // Toggle audio tracks
            this.isMicEnabled = !this.isMicEnabled;
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isMicEnabled;
            });

            this.updateMicUi();
            if (this.isMicEnabled) {
                this.ui.addChatMessage('Voice', '🎙️ Voice Chat: UNMUTED', '#00FF88');
            } else {
                this.ui.addChatMessage('Voice', '🔇 Voice Chat: MUTED', '#AAAAAA');
                if (this.micSprite) this.micSprite.material.opacity = 0;
            }
        }
    }

    updateMicUi() {
        const btn = document.getElementById('btn-voice');
        if (btn) {
            btn.innerHTML = this.isMicEnabled ? '🎙️ Voice: ON [V]' : '🔇 Voice: OFF [V]';
            btn.classList.toggle('active', this.isMicEnabled);
        }
    }

    connectToExistingPeers() {
        if (!this.network || !this.network.remotePlayers) return;

        this.network.remotePlayers.forEach((rp, id) => {
            if (!this.peers.has(id)) {
                this.initiatePeerConnection(id);
            }
        });
    }

    async initiatePeerConnection(targetId) {
        if (this.peers.has(targetId)) return;

        try {
            const pc = new RTCPeerConnection(this.rtcConfig);

            // Add local audio tracks if mic is active
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream);
                });
            }

            // Handle ICE candidate
            pc.onicecandidate = (event) => {
                if (event.candidate && this.network && this.network.ws) {
                    this.network.ws.send(JSON.stringify({
                        type: 'webrtc_signal',
                        to: targetId,
                        data: { candidate: event.candidate }
                    }));
                }
            };

            // Handle incoming remote audio stream
            pc.ontrack = (event) => {
                this.setupRemoteAudio(targetId, event.streams[0]);
            };

            this.peers.set(targetId, { pc });

            // Create and send WebRTC Offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (this.network && this.network.ws) {
                this.network.ws.send(JSON.stringify({
                    type: 'webrtc_signal',
                    to: targetId,
                    data: { offer }
                }));
            }

        } catch (e) {
            console.error('[VoiceChat] Failed to initiate peer connection to', targetId, e);
        }
    }

    async handleSignal(fromId, data) {
        if (!fromId) return;

        let record = this.peers.get(fromId);
        if (!record) {
            const pc = new RTCPeerConnection(this.rtcConfig);

            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream);
                });
            }

            pc.onicecandidate = (event) => {
                if (event.candidate && this.network && this.network.ws) {
                    this.network.ws.send(JSON.stringify({
                        type: 'webrtc_signal',
                        to: fromId,
                        data: { candidate: event.candidate }
                    }));
                }
            };

            pc.ontrack = (event) => {
                this.setupRemoteAudio(fromId, event.streams[0]);
            };

            record = { pc };
            this.peers.set(fromId, record);
        }

        const pc = record.pc;

        try {
            if (data.offer) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (this.network && this.network.ws) {
                    this.network.ws.send(JSON.stringify({
                        type: 'webrtc_signal',
                        to: fromId,
                        data: { answer }
                    }));
                }
            } else if (data.answer) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else if (data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (e) {
            console.error('[VoiceChat] Error handling signal from', fromId, e);
        }
    }

    setupRemoteAudio(remoteId, stream) {
        // Create audio element for playback
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;

        const record = this.peers.get(remoteId);
        if (record) {
            record.audioElement = audio;
        }

        console.log('[VoiceChat] Connected voice stream from', remoteId);
    }

    removePeer(remoteId) {
        if (this.peers.has(remoteId)) {
            const record = this.peers.get(remoteId);
            if (record.pc) record.pc.close();
            if (record.audioElement) {
                record.audioElement.srcObject = null;
                record.audioElement.remove();
            }
            this.peers.delete(remoteId);
        }
    }

    update(dt) {
        // 1. Audio volume analysis for speaking indicator
        if (this.isMicEnabled && this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            const avg = sum / this.dataArray.length;

            this.isSpeaking = avg > 18;

            if (this.micSprite) {
                this.micSprite.material.opacity = this.isSpeaking ? 1.0 : 0.25;
                if (this.isSpeaking) {
                    const scale = 1.3 + (avg / 255) * 0.8;
                    this.micSprite.scale.set(scale, scale, 1);
                } else {
                    this.micSprite.scale.set(1.2, 1.2, 1);
                }
            }
        }

        // 2. Spatial proximity volume falloff for remote peers
        if (this.network && this.network.remotePlayers && this.player) {
            const myPos = this.player.position;

            this.peers.forEach((peer, id) => {
                if (peer.audioElement && this.network.remotePlayers.has(id)) {
                    const rp = this.network.remotePlayers.get(id);
                    const dist = myPos.distanceTo(rp.group.position);

                    // Proximity curve: Full volume under 15 studs, fading to 0 at 90 studs
                    let vol = 1.0;
                    if (dist > 15) {
                        vol = Math.max(0, 1.0 - (dist - 15) / 75.0);
                    }
                    peer.audioElement.volume = vol;
                }
            });
        }
    }
}

window.RobloxVoiceChat = RobloxVoiceChat;
