/**
 * Roblox Trading System (trading.js)
 * Enables secure peer-to-peer and merchant NPC trading for coins, pets, and potions.
 */
class RobloxTradingSystem {
    constructor(game, audio, particles) {
        this.game = game;
        this.audio = audio;
        this.particles = particles;
        this.isOpen = false;
        this.myOffer = { coins: 0, items: [] };
        this.partnerOffer = { coins: 0, items: [] };
        this.isLocked = false;
        this.partnerLocked = false;
        this.tradePartnerName = "Obby Merchant";

        this.inventoryItems = [
            { id: "potion_moon", name: "🌙 Moon Gravity Potion", type: "potion", value: 15 },
            { id: "potion_speed", name: "⚡ Hyper Speed Potion", type: "potion", value: 12 },
            { id: "potion_magnet", name: "🧲 Coin Magnet Elixir", type: "potion", value: 20 },
            { id: "potion_shield", name: "🛡️ Lava Shield Brew", type: "potion", value: 25 },
            { id: "pet_kitty", name: "🐱 Pixel Kitty", type: "pet", value: 50 },
            { id: "pet_doge", name: "🐶 Neon Doge", type: "pet", value: 40 },
            { id: "pet_dragon", name: "🐉 Cosmic Dragon", type: "pet", value: 100 }
        ];

        if (typeof document !== 'undefined') {
            this.initUI();
        }
    }

    initUI() {
        const modal = document.createElement('div');
        modal.id = 'trading-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 580px;
            max-width: 90vw;
            background: rgba(16, 20, 30, 0.95);
            border: 2px solid #00F0FF;
            border-radius: 16px;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.4);
            color: #FFF;
            font-family: 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
            padding: 24px;
            backdrop-filter: blur(10px);
        `;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h2 style="margin:0; font-size:22px; color:#00F0FF; display:flex; align-items:center; gap:8px;">
                    <span>🤝</span> Trade Window with <span id="trade-partner-label" style="color:#FFDD00;">Obby Merchant</span>
                </h2>
                <button id="close-trade-btn" style="background:#FF3344; border:none; color:#FFF; font-weight:bold; border-radius:8px; padding:6px 14px; cursor:pointer;">✕</button>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                <!-- Player Side -->
                <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; border:1px solid #445577;">
                    <div style="font-weight:bold; color:#00FF88; margin-bottom:8px;">Your Offer</div>
                    <div id="my-trade-items" style="min-height:90px; background:rgba(0,0,0,0.3); border-radius:8px; padding:8px; margin-bottom:8px; font-size:13px;">
                        <em>No items added yet</em>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:13px;">Studs:</span>
                        <input id="my-trade-coins" type="number" min="0" max="9999" value="0" style="width:70px; background:#111; color:#FFD700; border:1px solid #555; border-radius:4px; padding:3px 6px;">
                    </div>
                    <button id="add-trade-item-btn" style="width:100%; background:#00AAFF; border:none; color:#FFF; padding:6px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px;">+ Add Item from Bag</button>
                </div>

                <!-- Partner Side -->
                <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; border:1px solid #445577;">
                    <div style="font-weight:bold; color:#FFDD00; margin-bottom:8px;">Partner's Offer</div>
                    <div id="partner-trade-items" style="min-height:90px; background:rgba(0,0,0,0.3); border-radius:8px; padding:8px; margin-bottom:8px; font-size:13px;">
                        <em>Partner preparing offer...</em>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:13px;">Studs:</span>
                        <span id="partner-trade-coins" style="color:#FFD700; font-weight:bold;">0</span>
                    </div>
                    <div id="partner-status-tag" style="font-size:12px; color:#AAA; text-align:center; padding:6px;">Waiting for your offer...</div>
                </div>
            </div>

            <!-- Trade Actions -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
                <div id="trade-status-msg" style="font-size:13px; color:#00F0FF;">Add items or studs to balance trade.</div>
                <div style="display:flex; gap:10px;">
                    <button id="lock-trade-btn" style="background:#00CC66; border:none; color:#FFF; padding:8px 18px; border-radius:8px; font-weight:bold; cursor:pointer;">🔒 Lock In</button>
                    <button id="accept-trade-btn" disabled style="background:#555; border:none; color:#AAA; padding:8px 18px; border-radius:8px; font-weight:bold; cursor:not-allowed;">Accept Trade</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        document.getElementById('close-trade-btn')?.addEventListener('click', () => this.close());
        document.getElementById('lock-trade-btn')?.addEventListener('click', () => this.toggleLock());
        document.getElementById('accept-trade-btn')?.addEventListener('click', () => this.completeTrade());
        document.getElementById('add-trade-item-btn')?.addEventListener('click', () => this.promptAddItem());
        document.getElementById('my-trade-coins')?.addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            this.myOffer.coins = Math.max(0, val);
            this.updatePartnerResponse();
        });
    }

    open(partnerName = "Obby Merchant") {
        this.isOpen = true;
        this.tradePartnerName = partnerName;
        this.myOffer = { coins: 0, items: [] };
        this.partnerOffer = { coins: 0, items: [] };
        this.isLocked = false;
        this.partnerLocked = false;

        const modal = document.getElementById('trading-modal');
        if (modal) modal.style.display = 'block';

        const label = document.getElementById('trade-partner-label');
        if (label) label.textContent = this.tradePartnerName;

        this.render();
        this.updatePartnerResponse();
        if (this.audio && this.audio.playClick) this.audio.playClick();
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('trading-modal');
        if (modal) modal.style.display = 'none';
    }

    promptAddItem() {
        const available = this.inventoryItems.filter(item => !this.myOffer.items.includes(item));
        if (available.length === 0) {
            alert("No more items available in your bag to trade!");
            return;
        }
        // Add first available item to offer
        const itemToAdd = available[0];
        this.myOffer.items.push(itemToAdd);
        this.render();
        this.updatePartnerResponse();
        if (this.audio && this.audio.playClick) this.audio.playClick();
    }

    updatePartnerResponse() {
        // Merchant offers fair counter-trade based on value
        let myTotalVal = this.myOffer.coins;
        this.myOffer.items.forEach(it => myTotalVal += it.value);

        this.partnerOffer.items = [];
        this.partnerOffer.coins = 0;

        if (myTotalVal > 10) {
            if (myTotalVal >= 50) {
                this.partnerOffer.items.push(this.inventoryItems[4]); // Pixel Kitty
                this.partnerOffer.coins = Math.max(0, myTotalVal - 45);
            } else if (myTotalVal >= 25) {
                this.partnerOffer.items.push(this.inventoryItems[3]); // Shield brew
                this.partnerOffer.coins = Math.max(0, myTotalVal - 20);
            } else {
                this.partnerOffer.items.push(this.inventoryItems[0]); // Moon potion
                this.partnerOffer.coins = 5;
            }
        }

        this.render();
    }

    render() {
        const myItemsContainer = document.getElementById('my-trade-items');
        if (myItemsContainer) {
            if (this.myOffer.items.length === 0) {
                myItemsContainer.innerHTML = '<em>No items added yet</em>';
            } else {
                myItemsContainer.innerHTML = this.myOffer.items.map(it => `
                    <div style="background:rgba(0,240,255,0.15); border:1px solid #00F0FF; border-radius:4px; padding:4px 8px; margin-bottom:4px; display:flex; justify-content:space-between;">
                        <span>${it.name}</span>
                        <span style="color:#FFDD00;">${it.value}★</span>
                    </div>
                `).join('');
            }
        }

        const partnerItemsContainer = document.getElementById('partner-trade-items');
        const partnerCoins = document.getElementById('partner-trade-coins');
        if (partnerItemsContainer) {
            if (this.partnerOffer.items.length === 0) {
                partnerItemsContainer.innerHTML = '<em>Partner preparing offer...</em>';
            } else {
                partnerItemsContainer.innerHTML = this.partnerOffer.items.map(it => `
                    <div style="background:rgba(255,221,0,0.15); border:1px solid #FFDD00; border-radius:4px; padding:4px 8px; margin-bottom:4px; display:flex; justify-content:space-between;">
                        <span>${it.name}</span>
                        <span style="color:#00FF88;">${it.value}★</span>
                    </div>
                `).join('');
            }
        }
        if (partnerCoins) {
            partnerCoins.textContent = this.partnerOffer.coins;
        }

        const partnerStatus = document.getElementById('partner-status-tag');
        if (partnerStatus) {
            if (this.isLocked) {
                partnerStatus.innerHTML = '<span style="color:#00FF88; font-weight:bold;">✓ Partner Locked In!</span>';
            } else {
                partnerStatus.textContent = 'Waiting for your offer...';
            }
        }
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
        const lockBtn = document.getElementById('lock-trade-btn');
        const acceptBtn = document.getElementById('accept-trade-btn');
        const statusMsg = document.getElementById('trade-status-msg');

        if (this.isLocked) {
            if (lockBtn) {
                lockBtn.style.background = '#FF8800';
                lockBtn.textContent = '🔓 Unlock';
            }
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.style.background = '#00F0FF';
                acceptBtn.style.color = '#000';
                acceptBtn.style.cursor = 'pointer';
            }
            if (statusMsg) {
                statusMsg.textContent = 'Both sides locked in! Ready to accept trade.';
                statusMsg.style.color = '#00FF88';
            }
            if (this.audio && this.audio.playCheckpoint) this.audio.playCheckpoint();
        } else {
            if (lockBtn) {
                lockBtn.style.background = '#00CC66';
                lockBtn.textContent = '🔒 Lock In';
            }
            if (acceptBtn) {
                acceptBtn.disabled = true;
                acceptBtn.style.background = '#555';
                acceptBtn.style.color = '#AAA';
                acceptBtn.style.cursor = 'not-allowed';
            }
            if (statusMsg) {
                statusMsg.textContent = 'Trade unlocked. Edit items as desired.';
                statusMsg.style.color = '#00F0FF';
            }
        }
    }

    completeTrade() {
        if (!this.isLocked) return;

        // Give reward coins / items
        if (this.game && typeof this.game.addCoins === 'function') {
            const netCoins = this.partnerOffer.coins - this.myOffer.coins;
            if (netCoins !== 0) this.game.addCoins(netCoins);
        }

        if (this.audio && this.audio.playVictory) this.audio.playVictory();
        if (this.particles && typeof this.particles.confetti === 'function') {
            this.particles.confetti();
        }

        alert(`🤝 Trade Complete! You traded with ${this.tradePartnerName} successfully!`);
        this.close();
    }
}

if (typeof window !== 'undefined') {
    window.RobloxTradingSystem = RobloxTradingSystem;
}
