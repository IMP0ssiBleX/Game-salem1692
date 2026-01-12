/**
 * Salem 1692 - Connection Manager (PeerJS WebRTC)
 * Allows playing across different devices over the internet
 */

const Connection = {
    // Connection type
    TYPE: {
        HOST: 'host',
        PLAYER: 'player'
    },

    // Current connection info
    type: null,
    peer: null,        // My Peer object
    conn: null,        // Connection to host (for player)
    connections: [],   // Connections to players (for host)
    roomCode: null,
    isConnected: false,
    prefix: 'salem-game-',

    // Message handlers
    handlers: {},

    // PeerJS Configuration with STUN servers
    peerConfig: {
        debug: 2,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    },
    connectionOptions: {
        serialization: 'json',
        reliable: true
    },
},

    // Initialize connection
    init() {
        console.log('Connection System Initialized (PeerJS)');
    },

        // Create a room (for host)
        createRoom(roomCode) {
    this.type = this.TYPE.HOST;
    this.roomCode = roomCode;
    this.connections = [];

    try {
        // Create Peer with specific ID
        const peerId = this.prefix + roomCode;
        this.peer = new Peer(peerId, this.peerConfig);

        this.peer.on('open', (id) => {
            console.log(`Room created with ID: ${id}`);
            this.isConnected = true;
            UI.showToast(`ห้องสร้างเสร็จแล้ว! รหัส: ${roomCode}`, 'success');
        });


        this.peer.on('connection', (conn) => {
            this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            if (err.type === 'unavailable-id') {
                UI.showToast('รหัสห้องนี้ถูกใช้แล้ว กรุณาลองใหม่', 'error');
                // Should probably return to menu or regen code, but basic handling for now
            } else {
                UI.showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            }
        });

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
},

// Handle incoming connection (Host side)
handleIncomingConnection(conn) {
    console.log(`New connection from ${conn.peer}`);
    UI.showToast(`มีการเชื่อมต่อใหม่จาก...`, 'info'); // Debug

    // Register connection immediately
    this.connections.push(conn);

    conn.on('data', (data) => {
        console.log('Received data:', data); // Debug
        this.handleMessage(data, conn);
    });

    conn.on('open', () => {
        // Connection established
    });

    conn.on('close', () => {
        this.handleDisconnect(conn);
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
    });
},

// Helper to send state to specific connection
sendState(conn) {
    if (!conn) return;
    const message = {
        type: 'state_sync',
        data: { state: GameState.getStateForSync() },
        timestamp: Date.now()
    };

    // Try to send if open, or if we just received data (which implies it's open enough)
    if (conn.open) {
        conn.send(message);
    } else {
        console.warn('Cannot send state, connection not open');
    }
},

// Handle disconnection
handleDisconnect(conn) {
    this.connections = this.connections.filter(c => c !== conn);
    // We'll need to know which player this was. 
    // Ideally mapped by peerId or passing playerId in close?
    // For now, rely on heartbeat or explicit leave. 
    // PeerJS 'close' event doesn't give much info.
},

// Join a room (for player)
joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
        this.type = this.TYPE.PLAYER;
        this.roomCode = roomCode;

        try {
            // Create anonymous peer
            this.peer = new Peer(null, this.peerConfig);

            // Timeout safety (10 seconds)
            const connectionTimeout = setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('Connection timed out'));
                    this.leaveRoom();
                }
            }, 20000);

            this.peer.on('open', (id) => {
                console.log(`Connected to PeerServer as ${id}`);
                UI.showToast('เชื่อมต่อกับ Server กลางสำเร็จ...', 'info');

                // Connect to host
                const hostId = this.prefix + roomCode;
                this.conn = this.peer.connect(hostId, this.connectionOptions);

                this.conn.on('open', () => {
                    clearTimeout(connectionTimeout);
                    this.isConnected = true;
                    console.log('Connected to Host');

                    // Send join message
                    this.send('player_join', {
                        playerId: GameState.state.localPlayerId,
                        playerName: GameState.getLocalPlayer() ? GameState.getLocalPlayer().name : 'Unknown'
                    });

                    // Force state sync request if needed, but Host should send it on join.
                    resolve(true);
                });

                this.conn.on('data', (data) => {
                    this.handleMessage(data);
                });

                this.conn.on('close', () => {
                    UI.showToast('การเชื่อมต่อกับโฮสต์หลุด', 'error');
                    this.leaveRoom();
                    // Force back to menu to avoid stuck state
                    if (window.Screens) Screens.show('menu');
                    if (window.GameState) GameState.init();
                });

                this.conn.on('error', (err) => {
                    console.error('Connection error:', err);
                    clearTimeout(connectionTimeout);
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                clearTimeout(connectionTimeout);
                reject(err);
            });

        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
},

// Leave room
leaveRoom() {
    if (this.type === this.TYPE.PLAYER && this.conn) {
        this.send('player_leave', {
            playerId: GameState.state.localPlayerId
        });
        this.conn.close();
    }

    if (this.type === this.TYPE.HOST && this.connections) {
        this.connections.forEach(c => c.close());
        this.connections = [];
    }

    if (this.peer) {
        this.peer.destroy();
        this.peer = null;
    }

    this.type = null;
    this.roomCode = null;
    this.isConnected = false;
    this.conn = null;
},

// Send message
send(type, data = {}) {
    const message = {
        type,
        data,
        senderId: GameState.state?.localPlayerId,
        timestamp: Date.now()
    };

    if (this.type === this.TYPE.PLAYER && this.conn && this.conn.open) {
        this.conn.send(message);
    } else if (this.type === this.TYPE.HOST) {
        // Host sending message usually means broadcast, 
        // but if we want to send to game logic as if it came from network (loopback for host player)
        // But usually Host Logic calls Host Game Functions directly.
        // If Host is also a player, they interact with UI which calls GameState/App directly.
        // But for 'broadcast', we use broadcastState.

        // If this is called by Host Player UI to "Send" something?
        // Usually UI calls App.** which calls Connection.send().
        // If Host sends 'card_played', it should be broadcasted.

        // Treat 'send' from HOST as 'broadcast' + 'loopback handle'?
        // Loopback:
        this.handleMessage(message);
        // Broadcast:
        this.broadcast(message);
    }
},

// Broadcast message to all players (Host only)
broadcast(message) {
    if (this.type !== this.TYPE.HOST) return;

    this.connections.forEach(conn => {
        if (conn.open) {
            conn.send(message);
        }
    });
},

// Broadcast game state specifically
broadcastState() {
    if (this.type !== this.TYPE.HOST) return;

    const message = {
        type: 'state_sync',
        data: {
            state: GameState.getStateForSync()
        },
        timestamp: Date.now()
    };

    this.broadcast(message);
},

// Handle incoming message
handleMessage(message, fromConn = null) {
    const { type, data, senderId } = message;

    // Skip own messages if echoed (though we handle loopback manually)
    // if (senderId === GameState.state?.localPlayerId && this.type === this.TYPE.PLAYER) return;

    console.log('Received:', type, data);

    switch (type) {
        case 'player_join':
            this.onPlayerJoin(data, fromConn);
            break;

        case 'player_leave':
            this.onPlayerLeave(data);
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

        default:
            if (this.handlers[type]) {
                this.handlers[type](data);
            }
    }
},

// Handle player join
onPlayerJoin(data, conn) {
    if (this.type !== this.TYPE.HOST) return;

    console.log('Handling player join:', data); // Debug
    const { playerId, playerName } = data;

    // Add player if not exists
    let player = GameState.getPlayer(playerId);
    if (!player) {
        player = GameState.createPlayer(playerId, playerName, false);
        player.id = playerId; // Force ID from client
        GameState.state.players.push(player);
        UI.showToast(`ผู้เล่นใหม่เข้าร่วม: ${playerName}`, 'success');
    } else {
        UI.showToast(`${playerName} กลับมาแล้ว`, 'info');
    }

    // Update UI
    UI.updateLobbyPlayers(GameState.state.players);

    // Send state specifically to the joining player (Critical fix)
    if (conn) {
        this.sendState(conn);
    }

    // Broadcast updated state to ALL
    this.broadcastState();
},

// Handle player leave
onPlayerLeave(data) {
    const { playerId } = data;
    const player = GameState.getPlayer(playerId);

    if (player) {
        GameState.removePlayer(playerId);
        UI.updateLobbyPlayers(GameState.state.players);
        UI.showToast(`${player.name} ออกจากห้อง`, 'info');

        if (this.type === this.TYPE.HOST) {
            this.broadcastState();
        }
    }
},

// Handle state sync
onStateSync(data) {
    if (this.type !== this.TYPE.PLAYER) return;

    const localPlayerId = GameState.state.localPlayerId;
    GameState.applySyncedState(data.state);
    GameState.state.localPlayerId = localPlayerId;
    GameState.state.isHost = false;

    this.updateUIForState();
},

// Update UI based on current state
updateUIForState() {
    const state = GameState.state;

    switch (state.phase) {
        case GameState.PHASES.LOBBY:
            if (!Screens.isOn('lobby')) {
                Screens.show('lobby');
            }
            UI.updateLobbyPlayers(state.players);
            break;

        case GameState.PHASES.CHARACTER_SELECT:
            if (state.localPlayerId === 'host_display') {
                if (!Screens.isOn('host')) {
                    Screens.show('host');
                }
                UI.updateHostScreen(state);
                UI.showHostEvent('รอผู้เล่นเลือกตัวละคร...');
            } else {
                if (!Screens.isOn('character')) {
                    Screens.show('character');
                }
            }
            break;

        case GameState.PHASES.PLAYING:
            if (state.isHost) {
                Screens.show('host');
                UI.updateHostScreen(state);
            } else {
                Screens.show('player');
                const localPlayer = GameState.getLocalPlayer();
                if (localPlayer) {
                    UI.updatePlayerScreen(localPlayer, state);
                }
            }
            break;

        case GameState.PHASES.NIGHT:
            Screens.show('night');
            break;

        case GameState.PHASES.GAME_OVER:
            const aliveWitches = GameState.getAliveWitches();
            const winner = aliveWitches.length === 0 ? 'villagers' : 'witches';
            UI.showEndGame(winner, state);
            break;
    }
},

// Handle character selection
onCharacterSelected(data) {
    if (this.type !== this.TYPE.HOST) return;

    const { playerId, characterId } = data;
    const player = GameState.getPlayer(playerId);

    if (player) {
        player.characterId = characterId;
        this.broadcastState();

        if (window.App) {
            App.checkAllCharactersSelected();
        }
    }
},

// Handle card played
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

// Handle night action
onNightAction(data) {
    if (this.type !== this.TYPE.HOST) return;

    const { actionType, targetId } = data;

    if (actionType === 'witch_kill') {
        GameState.witchSelectTarget(targetId);
    } else if (actionType === 'constable_protect') {
        GameState.constableProtect(targetId);
    }
},

// Register custom handler
on(type, handler) {
    this.handlers[type] = handler;
},

// Remove handler
off(type) {
    delete this.handlers[type];
}
};

window.Connection = Connection;
