# Contributing to Roblox Obby Simulator Pro 🎮

Thank you for your interest in contributing to **Roblox Obby Simulator Pro**! We welcome all contributions ranging from new obby obstacle courses, vehicle mechanics, custom pets, procedural synth songs, and multiplayer enhancements.

---

## 🛠️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/soumyadeepmagnusx/roblox-obby-sim.git
   cd roblox-obby-sim
   ```

2. **Prerequisites**:
   - Node.js (v18.0.0 or higher)
   - Modern Web Browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari)

3. **Start the local server**:
   ```bash
   npm start
   # or run 'node server.js'
   ```
   Open your browser at `http://localhost:8080`.

4. **Run syntax validation**:
   ```bash
   npm test
   ```

---

## 📁 Architecture Overview

| Module | Purpose |
| :--- | :--- |
| `server.js` | Zero-dependency HTTP & WebSocket server, WebRTC signaling relay, rooms, PvP damage routing |
| `game.js` | Main orchestrator, scene lifecycle, lighting, Speedrun PB timer & splits |
| `player.js` | R6 blocky avatar rig, animations, continuous collision detection (CCD), ragdoll |
| `world.js` | Procedural 3D obby stages, spinning lasers, disappearing tiles, Zero-G gravity pads |
| `combat.js` | Health bar, sword melee detection, rocket launcher projectile physics, floating damage text |
| `voice.js` | WebRTC Peer-to-Peer Voice Chat with 3D positional audio falloff and mic toggle (`V`) |
| `speech_bubbles.js` | Cartoon 3D billboard speech bubbles rendered above avatars upon chatting |
| `vehicles.js` | Cyber Hoverboard (`H`) with banking tilt & Jetpack (`J`) thrust physics |
| `pets.js` | 4 bobbing 3D companion pets & interactive Mystery Egg Hatching pedestal |
| `collectibles.js` | 3D spinning gold coins distributed across stages with persistent saving |
| `music_player.js` | Procedural Web Audio synth engine with 9 Bengali & English tracks |
| `builder.js` | In-game block building mode with persistent `localStorage` block saves |

---

## 🚀 How to Add New Content

### 1. Adding a New Obby Stage
Edit `world.js` inside `createObstacles()`:
- Add a new stage group with your unique geometric platforms, hazard lasers, or low-gravity zones.
- Add a checkpoint pad using `this.createCheckpointPad(stageNumber, x, y, z)`.

### 2. Adding a New Procedural Song
Edit `music_player.js`:
- Add a new song entry to `this.songs` array with a descriptive title, tempo (BPM), scale/key, and sequence note array.
- The procedural Web Audio synthesizer will automatically synthesize square/triangle chiptune melodies without needing large external MP3 files!

### 3. Adding a New Pet
Edit `pets.js`:
- Add a pet configuration inside `this.petCatalog`:
  ```javascript
  neon_cat: { name: 'Neon Cat', cost: 120, color: 0x00FFCC, rarity: 'Epic' }
  ```
- Build its 3D mesh inside `createPetMesh(type)`.

---

## 🧪 Testing Before Submitting a PR

Always run the syntax validator to ensure all files are cleanly parsed:
```bash
npm test
```

Create your feature branch and submit a Pull Request:
```bash
git checkout -b feature/my-new-feature
git commit -m "feat: add my new feature"
git push origin feature/my-new-feature
```
Our GitHub Actions CI pipeline will automatically validate your code!

---

## 📜 Code of Conduct
Please be polite, constructive, and respectful when creating issues and discussing pull requests. Happy building! 🚀
