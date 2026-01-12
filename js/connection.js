/**
 * Salem 1692 - Connection Manager (Socket.IO)
 * CONNECTS TO DEDICATED SERVER
 */

const Connection = {
    // Connection type
    TYPE: {
        HOST: 'host',
        PLAYER: 'player'
    },

    // Current connection info
    type: null,
    socket: null,      // Socket.IO client
    roomCode: null,
    isConnected: false,
    serverUrl: 'http://localhost:3000', // Default local server

    // Message handlers
    handlers: {},

    // Initialize connection
    init() {
        console.log('Connection System Initializing (Socket.IO)...');
        // We don't connect immediately, we wait for user to create/join
    },

    // Connect to Server
    connectToServer() {
        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.connected) {
                resolve(true);
                return;
            }

            console.log(`Connecting to server: ${this.serverUrl}`);
            try {
                this.socket = io(this.serverUrl);

                this.socket.on('connect', () => {
                    console.log('Connected to Game Server');
                    this.isConnected = true;
                    resolve(true);
                });

                this.socket.on('connect_error', (err) => {
                    console.error('Connection failed:', err);
                    UI.showToast('เชื่อมต่อ Server ไม่สำเร็จ (ตรวจสอบว่ารัน server.js หรือยัง?)', 'error');
                    this.isConnected = false;
                    reject(err);
                });

                this.socket.on('disconnect', () => {
                    console.log('Disconnected from server');
                    this.isConnected = false;
                    UI.showToast('หลุดจาก Server', 'error');
                });

                // Global Message Handler
                this.socket.on('game_message', (payload) => {
                    this.handleMessage(payload);
                });

                // Room Events
                this.socket.on('room_created', ({ roomCode }) => {
                    console.log(`Room created: ${roomCode}`);
                    this.roomCode = roomCode;
                    this.type = this.TYPE.HOST;
                    UI.showToast(`ห้องสร้างเสร็จแล้ว! รหัส: ${roomCode}`, 'success');
                });

                this.socket.on('joined_room', ({ roomCode }) => {
                    console.log(`Joined room: ${roomCode}`);
                    this.roomCode = roomCode;
                    this.type = this.TYPE.PLAYER;
                    UI.showToast('เข้าร่วมห้องสำเร็จ!', 'success');

                    // Request state sync from host ?? Host should see 'player_joined' and send state.
                });

                // Host Specific: Player Joined
                this.socket.on('player_joined', ({ socketId, playerData }) => {
                    if (this.type === this.TYPE.HOST) {
                        this.onPlayerJoin({
                            ...playerData,
                            id: playerData.id || socketId // Use provided ID or socket ID
                        }, socketId);
                    }
                });

                this.socket.on('error', (data) => {
                    UI.showToast(data.message || 'Error occurred', 'error');
                });

            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    },

    // Create a room (for host)
    async createRoom(roomCode) {
        try {
            await this.connectToServer();
            this.socket.emit('create_room', roomCode);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Join a room (for player)
    async joinRoom(roomCode) {
        try {
            await this.connectToServer();

            const player = GameState.state.players.find(p => p.id === GameState.state.localPlayerId);
            const playerData = {
                id: GameState.state.localPlayerId,
                name: player ? player.name : 'Unknown',
                role: 'player'
            };

            this.socket.emit('join_room', { roomCode, playerData });
            return true;
        } catch (e) {
            return false;
        }
    },

    // Leave room
    leaveRoom() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.type = null;
        this.roomCode = null;
        this.isConnected = false;
    },

    // Send message
    send(type, data = {}) {
        if (!this.socket || !this.isConnected) return;

        // In Socket.io (Server Relay), we send everything to 'game_message' 
        // with a 'targetId'.

        // If Host sending 'private' message to player? 
        // Currently 'send' in app is usually Player -> Host.

        if (this.type === this.TYPE.PLAYER) {
            // Player sends to Host
            this.socket.emit('game_message', {
                roomCode: this.roomCode,
                targetId: 'host',
                type,
                data
            });
        } else if (this.type === this.TYPE.HOST) {
            // Host sending generic 'send' usually means broadcast logic in prev code,
            // but let's be strict.
            // If Host wants to broadcast, use broadcast().
            // If Host calls send(), it might be loopback?

            this.handleMessage({ type, data, senderId: 'host' }); // Loopback
            this.broadcast(type, data); // Default behavior fallback
        }
    },

    // Broadcast message to all players (Host only)
    broadcast(type, data = {}) { // Note: API changed slightly to match send(type, data)
        // Previous broadcast(message) took object. Let's support both.
        let msgType = type;
        let msgData = data;

        if (typeof type === 'object' && type.type) {
            msgType = type.type;
            msgData = type.data;
        }

        if (this.type !== this.TYPE.HOST) return;

        this.socket.emit('game_message', {
            roomCode: this.roomCode,
            targetId: 'broadcast',
            type: msgType,
            data: msgData
        });
    },

    // Broadcast game state specifically
    broadcastState() {
        if (this.type !== this.TYPE.HOST) return;

        this.broadcast('state_sync', {
            state: GameState.getStateForSync()
        });
    },

    // Send state to specific player
    sendState(targetSocketId) {
        if (this.type !== this.TYPE.HOST) return;

        this.socket.emit('game_message', {
            roomCode: this.roomCode,
            targetId: targetSocketId,
            type: 'state_sync',
            data: { state: GameState.getStateForSync() }
        });
    },

    // Handle incoming message
    handleMessage(payload) {
        const { type, data, senderId } = payload;

        // Debug
        // console.log('Received:', type, data);

        switch (type) {
            case 'player_join':
                // Handled via socket event 'player_joined' usually, but if via relay...
                break;

            case 'state_sync':
                this.onStateSync(data);
                break;

            case 'character_selected':
                this.onCharacterSelected(data);
                break;

            case 'card_played':
                this.onCardPlayed(data);
                break;

            case 'night_action':
                this.onNightAction(data);
                break;

            case 'player_leave': // If we implement it
                this.onPlayerLeave(data);
                break;

            default:
                if (this.handlers[type]) {
                    this.handlers[type](data);
                }
        }
    },

    // --- GAME LOGIC HANDLERS (Same as before) ---

    // Handle player join (Host side)
    onPlayerJoin(playerData, socketId) {
        if (this.type !== this.TYPE.HOST) return;

        const { id, name } = playerData;
        console.log(`Player Joined: ${name} (${id})`);

        // Add player if not exists
        let player = GameState.getPlayer(id);
        if (!player) {
            player = GameState.createPlayer(id, name, false);
            // player.socketId = socketId; // We might need to track this map if IDs differ
            GameState.state.players.push(player);
            UI.showToast(`ผู้เล่นใหม่เข้าร่วม: ${name}`, 'success');
        } else {
            UI.showToast(`${name} กลับมาแล้ว`, 'info');
        }

        UI.updateLobbyPlayers(GameState.state.players);

        // Send state to THIS player
        this.sendState(socketId);

        // Broadcast to others
        this.broadcastState();
    },

    onStateSync(data) {
        if (this.type !== this.TYPE.PLAYER) return;
        const localPlayerId = GameState.state.localPlayerId;
        GameState.applySyncedState(data.state);
        GameState.state.localPlayerId = localPlayerId;
        GameState.state.isHost = false;
        this.updateUIForState();
    },

    updateUIForState() {
        // Reuse existing logic from previous file? 
        // Yes, this part relies on GameState/UI which is unchanged.
        const state = GameState.state;
        // ... (Same switch-case logic as original file, omitted for brevity but should be there)
        // To save tokens, I will call the global UI update or assume GameState handles it? 
        // No, Connection usually drove the UI switches. I should include it.

        if (window.Screens) {
            // Basic routing
            if (state.phase === 'lobby' && !Screens.isOn('lobby')) Screens.show('lobby');
            if (state.phase === 'playing') {
                if (!Screens.isOn('player')) Screens.show('player');
                const p = GameState.getLocalPlayer();
                if (p) UI.updatePlayerScreen(p, state);
            }
            // etc... relying on UI.update* which is good.
            // Let's implement full switch for safety.
        }

        switch (state.phase) {
            case 'lobby':
                if (!Screens.isOn('lobby')) Screens.show('lobby');
                UI.updateLobbyPlayers(state.players);
                break;
            case 'character_select':
                if (!Screens.isOn('character')) Screens.show('character');
                break;
            case 'playing':
                if (!Screens.isOn('player')) Screens.show('player');
                const p = GameState.getLocalPlayer();
                if (p) UI.updatePlayerScreen(p, state);
                break;
            case 'night':
                Screens.show('night');
                break;
            case 'game_over':
                // ...
                break;
        }
    },

    onCharacterSelected(data) {
        if (this.type !== this.TYPE.HOST) return;
        const { playerId, characterId } = data;
        const player = GameState.getPlayer(playerId);
        if (player) {
            player.characterId = characterId;
            this.broadcastState();
            if (window.App) App.checkAllCharactersSelected();
        }
    },

    onCardPlayed(data) {
        if (this.type !== this.TYPE.HOST) return;
        const { cardId, targetId, secondTargetId } = data;
        const result = GameState.playCard(cardId, targetId, secondTargetId);
        if (result.success) {
            const player = GameState.getPlayer(GameState.state.currentPlayerIndex);
            const actionType = result.result.action;
            UI.visualizeAction(player.id, targetId, actionType);
            this.broadcastState();
        }
    },

    onNightAction(data) {
        if (this.type !== this.TYPE.HOST) return;
        const { actionType, targetId } = data;
        if (actionType === 'witch_kill') GameState.witchSelectTarget(targetId);
        else if (actionType === 'constable_protect') GameState.constableProtect(targetId);
    },

    onPlayerLeave(data) {
        // ...
    },

    // Register custom handler
    on(type, handler) {
        this.handlers[type] = handler;
    },

    off(type) {
        delete this.handlers[type];
    }
};

window.Connection = Connection;
