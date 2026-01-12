/**
 * Salem 1692 - Dedicated Game Server
 * Runs on Node.js with Socket.io
 */

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Game State
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create Room
    socket.on('create_room', (roomCode) => {
        if (rooms[roomCode]) {
            socket.emit('error', { message: 'Room already exists' });
            return;
        }

        socket.join(roomCode);
        rooms[roomCode] = {
            host: socket.id,
            players: [],
            state: null // Store game state if we want server-authoritative later
        };

        console.log(`Room created: ${roomCode} by ${socket.id}`);
        socket.emit('room_created', { roomCode });
    });

    // Join Room
    socket.on('join_room', ({ roomCode, playerData }) => {
        const room = rooms[roomCode];
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        socket.join(roomCode);
        room.players.push({
            id: socket.id,
            data: playerData
        });

        console.log(`Player ${playerData.name} joined room ${roomCode}`);

        // Notify Host (Host handles the logic)
        io.to(room.host).emit('player_joined', {
            socketId: socket.id,
            playerData
        });

        // Notify Player
        socket.emit('joined_room', { roomCode });
    });

    // Relay Messages (The core logic)
    // We allow any message to be sent to specific target or broadcasted
    socket.on('game_message', ({ roomCode, targetId, type, data }) => {
        if (!rooms[roomCode]) return;

        // Add sender ID to data
        const payload = {
            type,
            data,
            senderId: socket.id
        };

        if (targetId === 'broadcast') {
            // Broadcast to everyone in room EXCEPT sender
            socket.to(roomCode).emit('game_message', payload);
        } else if (targetId === 'host') {
            // Send to Host
            const hostId = rooms[roomCode].host;
            io.to(hostId).emit('game_message', payload);
        } else {
            // Send to specific player (by socket ID)
            io.to(targetId).emit('game_message', payload);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up rooms/players...
        // For MVP, we just let the client handle timeouts/drops based on ping
        // But ideally we notify the room
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
