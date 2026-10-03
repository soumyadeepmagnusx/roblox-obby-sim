/**
 * Unified Multiplayer WebSocket & HTTP Server with Rooms, PvP, and WebRTC Signaling
 * Zero-dependency RFC 6455 WebSocket implementation using standard Node.js libraries
 * Supports private/public rooms, combat sync, collaborative building, and low latency
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

// Connected multiplayer clients: Map<id, { socket, id, room, info }>
const clients = new Map();

// HTTP Static File Server
const server = http.createServer((req, res) => {
    let reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let reqPath = reqUrl.pathname;
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    const filePath = path.join(PUBLIC_DIR, reqPath);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Rate Limiting map: ip -> { count, resetTime }
    const clientIp = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (!server.rateLimits) server.rateLimits = new Map();
    let limiter = server.rateLimits.get(clientIp);
    if (!limiter || now > limiter.resetTime) {
        limiter = { count: 1, resetTime: now + 60000 };
        server.rateLimits.set(clientIp, limiter);
    } else {
        limiter.count++;
        if (limiter.count > 240) { // Max 240 requests/min
            res.writeHead(429, { 'Content-Type': 'text/plain' });
            res.end('Too Many Requests - Rate limit exceeded.');
            return;
        }
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            // High Security Headers & CSP
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'X-Frame-Options': 'SAMEORIGIN',
                'X-Content-Type-Options': 'nosniff',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
                'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss:;"
            });
            res.end(content);
        }
    });
});

// RFC 6455 WebSocket Upgrade Handler
server.on('upgrade', (req, socket, head) => {
    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }

    const key = req.headers['sec-websocket-key'];
    const acceptKey = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

    const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`
    ];

    socket.write(headers.join('\r\n') + '\r\n\r\n');

    // Extract requested room from URL query if present
    let initialRoom = 'Lobby';
    try {
        const reqUrl = new URL(req.url, 'http://localhost');
        if (reqUrl.searchParams.has('room')) {
            initialRoom = reqUrl.searchParams.get('room').trim() || 'Lobby';
        }
    } catch (e) {}

    const clientId = 'Player_' + Math.floor(Math.random() * 8999 + 1000);
    const clientRecord = { socket, id: clientId, room: initialRoom, info: {} };
    clients.set(clientId, clientRecord);

    console.log(`[Multiplayer] Client connected: ${clientId} in Room [${initialRoom}] (Total: ${clients.size})`);

    // Notify client of assignment and players in their room
    const roomPlayers = Array.from(clients.values())
        .filter(c => c.room === initialRoom)
        .map(c => ({ id: c.id, ...c.info }));

    sendWsMessage(socket, {
        type: 'welcome',
        id: clientId,
        room: initialRoom,
        players: roomPlayers
    });

    // Notify others in room
    broadcastWs({
        type: 'player_join',
        id: clientId,
        room: initialRoom
    }, clientId, initialRoom);

    // Handle incoming frames
    socket.on('data', (buffer) => {
        const message = parseWsFrame(buffer);
        if (message) {
            handleClientMessage(clientId, message);
        }
    });

    socket.on('close', () => {
        const record = clients.get(clientId);
        const room = record ? record.room : 'Lobby';
        clients.delete(clientId);
        console.log(`[Multiplayer] Client disconnected: ${clientId} from Room [${room}]`);
        broadcastWs({ type: 'player_leave', id: clientId }, null, room);
    });

    socket.on('error', (err) => {
        console.error(`[Multiplayer] Socket error (${clientId}):`, err.message);
        const record = clients.get(clientId);
        const room = record ? record.room : 'Lobby';
        clients.delete(clientId);
        broadcastWs({ type: 'player_leave', id: clientId }, null, room);
    });
});

function handleClientMessage(senderId, data) {
    const client = clients.get(senderId);
    if (!client) return;

    if (data.type === 'join_room') {
        const oldRoom = client.room;
        const newRoom = (data.room || 'Lobby').trim();
        if (oldRoom === newRoom) return;

        // Leave old room
        broadcastWs({ type: 'player_leave', id: senderId }, senderId, oldRoom);

        // Join new room
        client.room = newRoom;
        console.log(`[Multiplayer] ${senderId} switched from [${oldRoom}] to [${newRoom}]`);

        const roomPlayers = Array.from(clients.values())
            .filter(c => c.room === newRoom)
            .map(c => ({ id: c.id, ...c.info }));

        sendWsMessage(client.socket, {
            type: 'room_joined',
            room: newRoom,
            players: roomPlayers
        });

        // Notify new room members
        broadcastWs({
            type: 'player_join',
            id: senderId,
            room: newRoom
        }, senderId, newRoom);

    } else if (data.type === 'state_update') {
        client.info = data.payload;
        broadcastWs({
            type: 'player_update',
            id: senderId,
            payload: data.payload
        }, senderId, client.room);

    } else if (data.type === 'chat') {
        broadcastWs({
            type: 'chat',
            id: senderId,
            name: data.name || senderId,
            message: data.message
        }, null, client.room);

    } else if (data.type === 'block_place') {
        broadcastWs({
            type: 'remote_block_place',
            id: senderId,
            data: data.data
        }, senderId, client.room);

    } else if (data.type === 'block_delete') {
        broadcastWs({
            type: 'remote_block_delete',
            id: senderId,
            pos: data.pos
        }, senderId, client.room);

    } else if (data.type === 'combat_hit') {
        // PvP Combat hit: targetId, damage, attackerName
        broadcastWs({
            type: 'combat_hit',
            targetId: data.targetId,
            attackerId: senderId,
            attackerName: data.attackerName || senderId,
            damage: data.damage,
            crit: data.crit || false,
            knockback: data.knockback
        }, null, client.room);

    } else if (data.type === 'rocket_fire') {
        // Rocket Launcher projectile fire
        broadcastWs({
            type: 'rocket_fire',
            shooterId: senderId,
            origin: data.origin,
            dir: data.dir
        }, senderId, client.room);

    } else if (data.type === 'webrtc_signal') {
        // WebRTC peer-to-peer signaling forwarding
        if (data.to) {
            const targetClient = clients.get(data.to);
            if (targetClient) {
                sendWsMessage(targetClient.socket, {
                    type: 'webrtc_signal',
                    from: senderId,
                    data: data.data
                });
            }
        }

    } else if (data.type === 'ping') {
        sendWsMessage(client.socket, {
            type: 'pong',
            timestamp: data.timestamp
        });
    }
}

// Encode JSON message into RFC 6455 WebSocket frame
function sendWsMessage(socket, data) {
    if (!socket || socket.destroyed) return;
    const payload = Buffer.from(JSON.stringify(data));
    const len = payload.length;

    let header;
    if (len < 126) {
        header = Buffer.from([0x81, len]);
    } else if (len <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }

    try {
        socket.write(Buffer.concat([header, payload]));
    } catch (e) {
        // ignore write after close
    }
}

// Broadcast message to clients within a room, optionally excluding sender
function broadcastWs(data, excludeId = null, targetRoom = null) {
    clients.forEach((c, id) => {
        if (id !== excludeId) {
            if (!targetRoom || c.room === targetRoom) {
                sendWsMessage(c.socket, data);
            }
        }
    });
}

// Minimal RFC 6455 WebSocket frame decoder
function parseWsFrame(buffer) {
    if (buffer.length < 2) return null;
    const isMasked = (buffer[1] & 0x80) !== 0;
    let payloadLength = buffer[1] & 0x7F;
    let offset = 2;

    if (payloadLength === 126) {
        if (buffer.length < 4) return null;
        payloadLength = buffer.readUInt16BE(2);
        offset = 4;
    } else if (payloadLength === 127) {
        if (buffer.length < 10) return null;
        payloadLength = Number(buffer.readBigUInt64BE(2));
        offset = 10;
    }

    let mask = null;
    if (isMasked) {
        if (buffer.length < offset + 4) return null;
        mask = buffer.slice(offset, offset + 4);
        offset += 4;
    }

    const payload = buffer.slice(offset, offset + payloadLength);
    if (isMasked && mask) {
        for (let i = 0; i < payload.length; i++) {
            payload[i] ^= mask[i % 4];
        }
    }

    try {
        return JSON.parse(payload.toString('utf8'));
    } catch (e) {
        return null;
    }
}

server.listen(PORT, () => {
    console.log(`======================================================`);
    console.log(`🎮 ROBLOX OBBY SIMULATOR PRO MULTIPLAYER SERVER`);
    console.log(`📡 Local Port: ${PORT}`);
    console.log(`🌐 Rooms, PvP Combat, WebRTC Signaling & Building Active!`);
    console.log(`======================================================`);
});
