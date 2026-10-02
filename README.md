# 🎮 Roblox 3D Obby Simulation - Advanced Multiplayer Edition

A high-performance 3D game prototype built in the true spirit of **Roblox**, featuring **Real-Time Multiplayer**, an **Anti-Glitch & Security Engine**, **Roblox Gears Inventory**, **Emotes**, **Avatar Wardrobe**, and an in-game **Roblox Studio Sandbox Builder**.

---

## 🌐 Instant Access Links

* **Live Web Server**: **[http://localhost:8080](http://localhost:8080)** *(Click to play in your browser)*
* **Direct File Link**: **[`index.html`](file:///C:/Users/SOUMYADEEP/.gemini/antigravity/scratch/roblox-obby-sim/index.html)**
* **Quick Launcher**: **[`start_game.bat`](file:///C:/Users/SOUMYADEEP/.gemini/antigravity/scratch/roblox-obby-sim/start_game.bat)**

---

## 🛡️ Anti-Glitch & Rock-Solid Security Engine (`security.js`)

To ensure the game never glitches or clips through geometry, a custom security layer protects physics and networking:
* **Continuous Collision Detection (CCD) with Sub-Stepping**:
  - Dynamically divides high-speed movement into discrete sub-steps (up to 5 checks per frame).
  - Eliminates "tunneling" — players can never fall through thin blocks or skip red lava killbricks by moving fast!
* **Speedhack & Flyhack Anomaly Detection**:
  - Validates delta distance and enforces gravity if abnormal air suspension is detected.
* **Strict Chat XSS Sanitizer**:
  - Strips and escapes all HTML/script tags before messages render or broadcast.
* **Fall Catcher**:
  - Guarantees immediate, clean ragdoll respawn when falling below void boundary without geometry lockups.

---

## 👥 Real-Time Multiplayer Network Engine (`server.js` & `network.js`)

* **WebSocket Server**: Built with zero external npm dependencies using native Node.js RFC 6455 framing on port `8080`.
* **Multi-Tab / Local Network Support**: Open multiple browser tabs or devices on your network to play together in the same 3D world in real-time!
* **Active Lobby Population**:
  - When alone, the lobby automatically hosts simulated AI players (`Guest_1337`, `NoobMaster`, `Builderman`, `SpeedyGamer`) with their own avatars, pathfinding, and banter in the live chat.
* **Dead-Reckoning & Interpolation**: Remote players move with smooth 20 Hz dead-reckoning lerp interpolation.

---

## 🎒 Roblox Gears & Backpack Inventory Hotbar (`gears.js`)

Use hotkeys **`1`**, **`2`**, **`3`**, **`4`** (or click the slots on the screen):
1. **Slot [1]: ⚡ Golden Speed Coil**:
   - Equips a 3D golden coiled spring in your right hand.
   - Increases movement speed by **1.8x** with golden sparkle effects and sci-fi hum.
2. **Slot [2]: 🌀 Blue Gravity Coil**:
   - Equips a 3D neon blue coil in your hand.
   - Reduces gravity by **60%**, granting soaring, floaty astronaut leaps!
3. **Slot [3]: ⚔️ Classic Roblox Sword**:
   - Equips the iconic silver blade with black crossguard.
   - **Left-Click to attack**: triggers a slash swing and launches your avatar forward with a sword lunge jump!
4. **Slot [4]: 🎯 Grappling Hook**:
   - Point and left-click at any distant block (up to 60 studs away) to fire a green tether cable and pull yourself smoothly through the air!

---

## 💃 Roblox Emotes System (`emotes.js`)

Trigger animations via chat or the **`[💃 Emotes]`** HUD button:
* **`/e dance`**: Classic Roblox breakdance / arm wave spin!
* **`/e wave`**: Raises right arm and waves overhead.
* **`/e cheer`**: Pumps both arms in the air with joyful hops.
* **`/e point`**: Points forward.
* *Moving or jumping automatically cancels the emote smoothly.*

---

## 🌅 Dynamic Atmosphere & Day/Night Cycle

Click **`[☀️ Day]`** on the bottom HUD to cycle between three atmospheric lighting modes:
1. **☀️ Bright Sunny Day**: Classic cartoon blue Roblox sky with crisp shadows.
2. **🌅 Sunset Hour**: Rich orange skybox and warm sunset glow.
3. **🌙 Cyber Neon Night**: Deep indigo midnight sky with glowing neon lava and laser beams.

---

## 🛍️ Avatar Shop & Cosmetics (`avatar_shop.js`)

Click **`[👕 Wardrobe]`** to customize:
* **Hats**: 🎩 Top Hat, 👷 Construction Hardhat, ⚔️ Viking Horns, 🎧 Neon Beats Headphones.
* **Skins**: Classic Noob, Midnight Ninja, Guest 666, Golden Legend, Cyber Neon.
* **Faces**: 🙂 Classic Smile, 🤪 Epic Face (wide tongue grin), 😎 Cool Shades.
* **Particle Trails**: 🌈 Rainbow Sparkles, 🔥 Flame, ✨ Cyan Sparkles that stream behind your character!

---

## 🌈 The Mega Sky Slide (`world.js`)

* Conquer Stage 6 and reach the Golden Trophy to unlock the **Mega Sky Slide** — a 40-segment looping rainbow slide that shoots you through the clouds all the way back to Spawn Island at high speed!

---

## 🕹️ Controls Guide

| Action | Keyboard / Mouse | Touch / Mobile |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` | On-Screen D-Pad |
| **Jump** | `Spacebar` | Circular **JUMP** Button |
| **Orbit Camera** | **Right-Click Drag** | Touch Drag |
| **Zoom Camera** | **Mouse Scroll Wheel** | Touch Pinch |
| **Shift-Lock** | `Shift` key or `[🔒 Shift Lock]` button | HUD button |
| **Equip Gears 1-4**| Keys `1`, `2`, `3`, `4` or click hotbar | Tap hotbar slot |
| **Use Gear (Slash/Grapple)**| **Left-Click** | Tap canvas |
| **Emotes Menu** | `[💃 Emotes]` button or type `/e dance` | HUD button |
| **Atmosphere Cycle**| Click `[☀️ Day]` button | HUD button |
| **Studio Builder** | `B` key or `[🔨 Studio Mode]` button | HUD button |
| **Reset ("OOF!")** | `R` key or `[💀 Reset]` button | HUD button |
| **Toggle Music** | `M` key or `[🎵 Music]` button | HUD button |
| **Menu / Pause** | `Esc` or click Roblox Logo / `☰` | Top-left button |

---

## 📁 Source Architecture

```
roblox-obby-sim/
├── server.js        # Zero-dependency WebSocket & static file HTTP server
├── network.js       # Client multiplayer network synchronization manager
├── security.js      # Anti-glitch CCD continuous collision & chat XSS sanitizer
├── gears.js         # Roblox backpack inventory (Speed/Gravity Coils, Sword, Grapple)
├── emotes.js        # Roblox emotes engine (/e dance, wave, cheer, point)
├── avatar_shop.js   # Hats, skins, faces, and cosmetic particle trails
├── player.js        # R6 avatar rig, ragdoll "break joints", and physics controller
├── world.js         # 6 Obby stages, moving hazards, and Mega Sky Slide
├── builder.js       # In-game Roblox Studio level editor with 2-stud grid snapping
├── camera.js        # 3rd-person orbit camera & Shift-Lock controller
├── audio.js         # Web Audio API sound synthesizer and 8-bit chiptune loop
├── ui.js            # HUD, chat commands, leaderboard, and touch controls
├── index.html       # Game viewport, hotbar, modals, and responsive layout
├── three.min.js     # Three.js 3D library (bundled offline)
└── start_game.bat   # Windows one-click game launcher
```
