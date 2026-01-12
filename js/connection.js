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
    // Auto-detect server URL
    // If running on a web server (http/https), use that origin. 
    // If running locally via file://, fallback to localhost:3000
    serverUrl: (window.location.protocol === 'file:') ? 'http://localhost:3000' : window.location.origin,

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

                    // Start Heartbeat (Broadcast state every 3 seconds in lobby)
                    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = setInterval(() => {
                        if (this.type === this.TYPE.HOST && GameState.state.phase === 'lobby') {
                            this.broadcastState();
                        } else {
                            clearInterval(this.heartbeatInterval);
                        }
                    }, 3000);
                });

                this.socket.on('joined_room', ({ roomCode }) => {
                    console.log(`Joined room: ${roomCode}`);
                    this.roomCode = roomCode;
                    this.type = this.TYPE.PLAYER;
                    UI.showToast('เข้าร่วมห้องสำเร็จ!', 'success');

                    // Request state sync from host explicitly if not received
                    setTimeout(() => {
                        if (GameState.state.players.length <= 1) { // Still only me?
                            console.log('Requesting state from host...');
                            this.send('request_state');
                        }
                    }, 2000);
                });

                this.socket.on('player_joined', ({ socketId, playerData }) => {
                    this.onPlayerJoin({
                        ...playerData,
                        id: playerData.id || socketId
                    }, socketId);
                });

                // Player Left
                this.socket.on('player_left', ({ socketId }) => {
                    console.log('Player left:', socketId);

                    // Remove from GameState
                    if (window.GameState) {
                        const player = GameState.state.players.find(p => p.id === socketId || (p.id.includes(socketId))); // Try to match ID

                        if (player) {
                            UI.showToast(`${player.name} ออกจากห้อง`, 'info');
                            GameState.removePlayer(player.id);
                            UI.updateLobbyPlayers(GameState.state.players);

                            // If Host, we might need to re-check character selection
                            if (GameState.state.isHost && GameState.state.phase === 'character_select') {
                                if (window.App) App.checkAllCharactersSelected();
                            }
                        }
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

            case 'night_action':
                this.onNightAction(data);
                break;

            case 'draw_cards':
                this.onDrawCards(data);
                break;

            case 'end_turn':
                this.onEndTurn(data);
                break;

            case 'player_leave': // If we implement it
                this.onPlayerLeave(data);
                break;

            case 'request_state':
                if (this.type === this.TYPE.HOST) {
                    this.sendState(senderId);
                }
                break;

            default:
                if (this.handlers[type]) {
                    this.handlers[type](data);
                }
        }
    },

    // --- GAME LOGIC HANDLERS (Same as before) ---

    // Handle player join (Host & Player)
    onPlayerJoin(playerData, socketId) {
        // If I am the one who joined, ignore (already added self)
        if (playerData.id === GameState.state.localPlayerId) return;

        const { id, name } = playerData;
        console.log(`Player Joined: ${name} (${id})`);

        // Add player if not exists
        let player = GameState.getPlayer(id);
        if (!player) {
            player = GameState.createPlayer(id, name, false);
            GameState.state.players.push(player);
            UI.showToast(`ผู้เล่นใหม่เข้าร่วม: ${name}`, 'success');
        } else {
            // Already exists
        }

        UI.updateLobbyPlayers(GameState.state.players);

        // Host: Sync state to everyone when someone joins
        if (this.type === this.TYPE.HOST) {
            this.broadcastState();
        }
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



    onDrawCards(data) {
        if (this.type !== this.TYPE.HOST) return;

        // Calculate draw count based on character ability (Server Authoritative)
        const player = GameState.getCurrentPlayer();
        const drawCount = Characters.applyAbility(player.characterId, 'draw_count', GameState.state) || 2;

        const result = GameState.drawCards(drawCount);

        // Broadcast new state
        this.broadcastState();

        // Update Host UI logic because broadcast doesn't update self
        this.updateUIForState();

        // Also could broadcast specific event if needed, but state sync covers it
        if (result.action === 'night') {
            this.broadcast('game_message', { type: 'night_start' });
            // Night start UI update if needed
            this.updateUIForState();
        }
    },

    onEndTurn(data) {
        if (this.type !== this.TYPE.HOST) return;

        GameState.endTurn();
        this.broadcastState();
        this.updateUIForState();
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
