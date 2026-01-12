/**
 * Salem 1692 - Main Application
 */

const App = {
    // Selected character during selection phase
    selectedCharacterId: null,

    // Selected card during play
    selectedCard: null,

    // Initialize app
    async init() {
        try {
            console.log('Salem 1692 - Initializing...');

            // Initialize modules
            if (window.GameState) GameState.init();
            if (window.Screens) Screens.init();
            if (window.UI) UI.init();
            if (window.Connection) Connection.init();

            if (window.location.protocol === 'file:') {
                // UI.showToast might fail if UI init failed
                if (window.UI) {
                    UI.showToast('⚠️ คำเตือน: การเปิดไฟล์โดยตรงอาจทำให้เล่นออนไลน์ไม่ได้', 'error', 10000);
                    UI.showToast('แนะนำให้ใช้ Local Server หรืออัปโหลดขึ้นเว็บ', 'info', 10000);
                }
            }

            if (window.GameLog) GameLog.init();

            // Show menu after loading
            await Utils.delay(1000);

            if (window.Screens) {
                Screens.show('menu', { animate: true });
            } else {
                console.error('Screens module not found');
                alert('Error: Screens module not loaded');
            }

            console.log('Salem 1692 - Ready!');
        } catch (err) {
            console.error('Initialization Error:', err);
            alert('Game Error: ' + err.message + '\n' + err.stack);
        }
    },

    // Create a new room
    createRoom() {
        const hostName = UI.elements.hostNameInput.value.trim();

        if (!hostName) {
            UI.showToast('กรุณาใส่ชื่อของคุณ', 'error');
            return;
        }

        // Get mode (host display or player)
        const isHostDisplay = document.querySelector('.toggle-btn.active')?.dataset.mode === 'host';

        // Initialize game state
        GameState.init();

        // Generate room code
        const roomCode = Utils.generateRoomCode();
        GameState.state.roomCode = roomCode;
        GameState.state.isHost = true;

        // Add host as player (if not host display mode)
        if (!isHostDisplay) {
            const host = GameState.addPlayer(hostName, true);
            GameState.state.localPlayerId = host.id;
            GameState.state.hostId = host.id;
        } else {
            // Host display mode - just set as host
            GameState.state.hostId = 'host_display';
            GameState.state.localPlayerId = 'host_display';
        }

        // Create room connection
        Connection.createRoom(roomCode);

        // Save player name for next time
        Utils.saveToStorage('playerName', hostName);

        // Show lobby
        Screens.show('lobby');

        UI.showToast(`ห้อง ${roomCode} ถูกสร้างแล้ว!`, 'success');
    },

    // Join a room
    async joinRoom() {
        const playerName = UI.elements.playerNameInput.value.trim();
        const roomCode = UI.elements.roomCodeInput.value.trim().toUpperCase();

        if (!playerName) {
            UI.showToast('กรุณาใส่ชื่อของคุณ', 'error');
            return;
        }

        if (!roomCode || roomCode.length !== 4) {
            UI.showToast('กรุณาใส่รหัสห้อง 4 ตัวอักษร', 'error');
            return;
        }

        // Initialize game state
        GameState.init();
        GameState.state.roomCode = roomCode;
        GameState.state.isHost = false;

        // Add self as player
        const player = GameState.addPlayer(playerName, false);
        GameState.state.localPlayerId = player.id;

        // Show connecting state
        UI.showToast('กำลังเชื่อมต่อ... กรุณารอสักครู่', 'info');
        const joinBtn = UI.elements.btnConfirmJoin;
        const originalText = joinBtn.textContent;
        joinBtn.textContent = 'Connecting...';
        joinBtn.disabled = true;

        try {
            // Join room connection
            await Connection.joinRoom(roomCode);

            // Success
            Utils.saveToStorage('playerName', playerName);
            Screens.show('lobby');
            UI.showToast(`เข้าร่วมห้อง ${roomCode} สำเร็จ!`, 'success');

        } catch (err) {
            // Error handling
            console.error('Join failed:', err);
            let msg = 'ไม่สามารถเชื่อมต่อได้';

            if (err.type === 'peer-unavailable') {
                msg = 'ไม่พบรหัสห้องนี้ (หรือโฮสต์ยังไม่ได้สร้างห้อง)';
            } else if (err.message === 'Connection timed out') {
                msg = 'หมดเวลาเชื่อมต่อ (ลองใหม่อีกครั้ง หรือตรวจสอบว่า Host ยังอยู่หรือไม่)';
            }

            UI.showToast(msg, 'error');

            // Clean up
            Connection.leaveRoom();
        } finally {
            // Reset button
            joinBtn.textContent = originalText;
            joinBtn.disabled = false;
        }
    },

    // Add a bot for testing
    addBot() {
        if (!GameState.state.isHost) {
            UI.showToast('เฉพาะโฮสต์เท่านั้นที่สามารถเพิ่มบอทได้', 'error');
            return;
        }

        const playerCount = GameState.state.players.length;
        if (playerCount >= 12) {
            UI.showToast('ผู้เล่นเต็มแล้ว (สูงสุด 12 คน)', 'error');
            return;
        }

        // Bot names in Thai
        const botNames = [
            'บอท-แอนนา', 'บอท-จอห์น', 'บอท-แมรี่', 'บอท-โทมัส',
            'บอท-ซาร่าห์', 'บอท-เจมส์', 'บอท-รีเบคก้า', 'บอท-วิลเลียม',
            'บอท-เอลิซาเบธ', 'บอท-ซามูเอล', 'บอท-มาร์ธา', 'บอท-กิลส์'
        ];

        const usedNames = GameState.state.players.map(p => p.name);
        const availableNames = botNames.filter(n => !usedNames.includes(n));

        if (availableNames.length === 0) {
            UI.showToast('ไม่มีชื่อบอทเหลือแล้ว', 'error');
            return;
        }

        const botName = availableNames[Math.floor(Math.random() * availableNames.length)];
        const bot = GameState.addPlayer(botName, false);
        bot.isBot = true; // Mark as bot

        // Update lobby UI
        UI.updateLobbyPlayers(GameState.state.players);
        UI.showToast(`🤖 ${botName} เข้าร่วมแล้ว!`, 'success');

        // Broadcast if connected
        Connection.broadcastState();
    },

    // Leave room
    leaveRoom() {
        Connection.leaveRoom();
        GameState.init();
        Screens.show('menu');
        UI.showToast('ออกจากห้องแล้ว', 'info');
    },

    // Start the game (host only)
    startGame() {
        if (!GameState.state.isHost) return;

        const playerCount = GameState.state.players.length;

        if (playerCount < 4) {
            UI.showToast('ต้องมีผู้เล่นอย่างน้อย 4 คน', 'error');
            return;
        }

        if (playerCount > 12) {
            UI.showToast('ผู้เล่นได้สูงสุด 12 คน', 'error');
            return;
        }

        // Setup game (distribute cards)
        GameState.setupGame();

        // Broadcast state to all players
        Connection.broadcastState();

        // Show character selection
        if (GameState.state.localPlayerId === 'host_display') {
            Screens.show('host');
            UI.updateHostScreen(GameState.state);
            UI.showHostEvent('รอผู้เล่นเลือกตัวละคร...');
            UI.showToast('เกมเริ่มแล้ว! รอผู้เล่นเลือกตัวละคร', 'success');
        } else {
            Screens.show('character');
            UI.showToast('เกมเริ่มแล้ว! เลือกตัวละครของคุณ', 'success');
        }
    },

    // Select a character
    selectCharacter(characterId) {
        this.selectedCharacterId = characterId;

        const character = Characters.getById(characterId);
        UI.updateSelectedCharacter(character);

        // Update grid selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.id === characterId);
        });
    },

    // Confirm character selection
    confirmCharacter() {
        if (!this.selectedCharacterId) {
            UI.showToast('กรุณาเลือกตัวละคร', 'error');
            return;
        }

        const localPlayer = GameState.getLocalPlayer();
        if (localPlayer) {
            localPlayer.characterId = this.selectedCharacterId;
        }

        // Notify host
        Connection.send('character_selected', {
            playerId: GameState.state.localPlayerId,
            characterId: this.selectedCharacterId
        });

        // Stop timer
        Screens.stopCharacterTimer();

        // Apply character start abilities
        const result = Characters.applyAbility(this.selectedCharacterId, 'start', GameState.state);
        if (result) {
            // Handle start ability (e.g., Samuel Parris gets Piety)
            this.handleCharacterAbility(result);
        }

        // If host, check if all players selected
        if (GameState.state.isHost) {
            this.checkAllCharactersSelected();
        } else {
            UI.showToast('รอผู้เล่นคนอื่นเลือกตัวละคร...', 'info');
        }
    },

    // Auto-select character if timer expires
    autoSelectCharacter() {
        if (!this.selectedCharacterId) {
            const characters = Characters.getSelectionPool(GameState.state.players.length);
            const available = characters.filter(c =>
                !GameState.state.players.some(p => p.characterId === c.id)
            );

            if (available.length > 0) {
                this.selectCharacter(Utils.randomFrom(available).id);
            }
        }

        this.confirmCharacter();
    },

    // Check if all players have selected characters
    checkAllCharactersSelected() {
        // Auto-select characters for bots
        BotAI.autoSelectBotCharacters();

        const allSelected = GameState.state.players.every(p => p.characterId);

        if (allSelected) {
            // Start playing phase
            GameState.startPlaying();
            Connection.broadcastState();

            // Log game start
            GameLog.logGameStart(
                GameState.state.players.length,
                GameState.state.totalWitches
            );

            // Show appropriate screen
            // If localPlayerId is 'host_display', show host screen (TV/monitor display)
            // Otherwise, show player screen (human player)
            if (GameState.state.localPlayerId === 'host_display') {
                Screens.show('host');
            } else {
                Screens.show('player');
                const localPlayer = GameState.getLocalPlayer();
                const currentPlayer = GameState.getCurrentPlayer();
                if (localPlayer.id === currentPlayer.id) {
                    UI.showToast('ตาของคุณ! เลือกจั่วการ์ด หรือ เล่นการ์ด', 'success');
                }
            }

            // Update player screen
            const localPlayer = GameState.getLocalPlayer();
            if (localPlayer) {
                UI.updatePlayerScreen(localPlayer, GameState.state);
            }

            // If first player is bot, run turn (Host only triggers this logic ideally, but checkAllCharactersSelected runs on all?)
            // checkAllCharactersSelected runs on Host.
            // But if I am Host Display, I run this.
            // If I am Player-Host, I run this.
            // So logic should appear here.
            const firstPlayer = GameState.getCurrentPlayer();
            if (firstPlayer.isBot) {
                setTimeout(() => BotAI.runBotTurn(), 2000);
            }

            UI.showToast('เกมเริ่มแล้ว!', 'success');

            // Log first turn
            const currentPlayer = GameState.getCurrentPlayer();
            if (currentPlayer) {
                GameLog.logTurn(currentPlayer.name);
            }

            // If first player is a bot, start bot turn
            if (currentPlayer && currentPlayer.isBot) {
                setTimeout(() => BotAI.runBotTurn(), 2000);
            }
        }
    },

    // Handle character ability result
    handleCharacterAbility(result) {
        switch (result.action) {
            case 'reveal_own_tryal':
                // Mary Warren - show one of your Tryal cards
                const localPlayer = GameState.getLocalPlayer();
                if (localPlayer && localPlayer.tryalCards.length > 0) {
                    const card = localPlayer.tryalCards[0];
                    UI.showModal('ความสามารถ: แมรี่ วอร์เรน', `
                        <p>คุณมองเห็น Tryal Card ใบแรกของตัวเอง:</p>
                        <div class="text-center mt-md">
                            <span style="font-size: 3rem">${card.icon}</span>
                            <p class="mt-sm">${card.name}</p>
                        </div>
                    `);
                }
                break;

            case 'add_card':
                // Samuel Parris - start with Piety
                const piety = Cards.playingCards.find(c => c.id === result.cardId);
                if (piety) {
                    const player = GameState.getLocalPlayer();
                    player.blueCards.push({ ...piety });
                    UI.showToast('คุณเริ่มเกมด้วยการ์ด ศรัทธา', 'success');
                }
                break;

            case 'peek_deck':
                // Tituba - will be handled during draw
                break;
        }
    },

    // Draw cards
    drawCards() {
        const currentPlayer = GameState.getCurrentPlayer();
        const localPlayer = GameState.getLocalPlayer();

        if (!currentPlayer || currentPlayer.id !== localPlayer.id) {
            UI.showToast('ยังไม่ใช่เทิร์นของคุณ', 'error');
            return;
        }

        if (GameState.state.hasDrawn) {
            UI.showToast('คุณจั่วการ์ดไปแล้ว', 'error');
            return;
        }

        if (GameState.state.hasPlayed) {
            UI.showToast('คุณเล่นการ์ดไปแล้ว ไม่สามารถจั่วได้', 'error');
            return;
        }

        // Check Sarah Good ability (draw 3)
        const drawCount = Characters.applyAbility(localPlayer.characterId, 'draw_count', GameState.state) || 2;

        // Check Tituba ability (peek before draw)
        const peekResult = Characters.applyAbility(localPlayer.characterId, 'draw', GameState.state);
        if (peekResult && peekResult.action === 'peek_deck') {
            // Show top 3 cards
            const topCards = GameState.state.playingDeck.slice(0, 3);
            UI.showModal('ความสามารถ: ทิทูบา', `
                <p>คุณมองเห็น 3 ใบบนของสำรับ:</p>
                <div class="hand-cards mt-md" style="justify-content: center;">
                    ${topCards.map(c => `
                        <div class="card card-${c.type} card-sm flipped">
                            <div class="card-inner">
                                <div class="card-back"></div>
                                <div class="card-front">
                                    <span class="card-icon">${c.icon}</span>
                                    <span class="card-name">${c.name}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `);
        }

        // Draw cards
        const result = GameState.drawCards(drawCount);

        if (result.action === 'night') {
            // Night phase triggered
            UI.showToast('การ์ดค่ำคืน! เข้าสู่ช่วงกลางคืน', 'info');
            GameState.startNight();
            Connection.broadcastState();
            Screens.show('night');
            return;
        }

        if (result.action === 'malice') {
            // Malice triggered
            UI.showToast('เจตนาร้าย! แมวดำและผู้จั่วเปิดไพ่ไต่สวน', 'info');

            const maliceResult = GameState.handleMalice();

            // Show reveals
            if (maliceResult.reveals && maliceResult.reveals.length > 0) {
                maliceResult.reveals.forEach(rev => {
                    const p = GameState.getPlayer(rev.playerId);
                    UI.showToast(`${p.name} เปิดเผยไพ่: ${rev.card.name}`, rev.card.isWitch ? 'error' : 'info');
                    GameLog.logReveal(p.name, rev.card.isWitch ? 'witch' : 'not_witch');
                });
            }

            UI.showToast('วนไพ่ไต่สวนไปทางซ้าย...', 'info');
            Connection.broadcastState();
        }

        // Update UI
        UI.updatePlayerScreen(localPlayer, GameState.state);
        Connection.broadcastState();

        Utils.vibrate(50);
    },

    // Select a card to play
    selectCard(card) {
        const state = GameState.state;

        if (state.turnPhase === 'drawn') {
            UI.showToast('คุณจั่วการ์ดแล้ว ไม่สามารถเล่นการ์ดได้', 'error');
            return;
        }

        if (state.turnPhase === 'end') {
            UI.showToast('จบเทิร์นแล้ว', 'info');
            return;
        }

        this.selectedCard = card;

        // Get valid targets
        const validTargets = state.players.filter(p => {
            if (!p.isAlive) return false;

            const canTargetSelf = Characters.applyAbility(
                GameState.getLocalPlayer().characterId,
                'can_target_self',
                state
            );

            if (p.id === state.localPlayerId && !canTargetSelf) return false;

            return true;
        });

        // Show target selection (except for Asylum/Shelter/Faith/Blue cards played on self?)
        // If playing Blue card on self, maybe skip target selection if no other target needed?
        // But UI usually handles generic target selection.

        UI.showTargetSelection(card, validTargets, (targetId) => {
            this.playCardOnTarget(card, targetId);
        });
    },

    // Play card on target
    playCardOnTarget(card, targetId) {
        // Special handling for cards requiring a second target
        const needsSecondTarget = ['scapegoat', 'robbery', 'curse', 'matchmaker'];
        const cardType = card.id.replace(/_\d+$/, ''); // Remove suffix

        if (needsSecondTarget.includes(cardType)) {
            const targets = GameState.state.players.filter(p =>
                p.isAlive && p.id !== targetId
            );

            let prompt = 'เลือกเป้าหมายที่สอง';
            if (cardType === 'scapegoat') prompt = 'ย้ายไปให้ใคร?';
            if (cardType === 'robbery') prompt = 'ขโมยไปให้ใคร?';
            if (cardType === 'curse') prompt = 'ย้ายคำสาปไปที่ใคร?';
            if (cardType === 'matchmaker') prompt = 'ผูกชะตากับใคร?';

            UI.showTargetSelection(
                { ...card, name: prompt },
                targets,
                (secondTargetId) => {
                    this.executePlayCard(card.id, targetId, secondTargetId);
                }
            );
            return;
        }

        this.executePlayCard(card.id, targetId);
    },

    // Execute playing a card
    executePlayCard(cardId, targetId, secondTargetId = null) {
        const localPlayer = GameState.getLocalPlayer();
        const result = GameState.playCard(cardId, targetId, secondTargetId);

        if (!result.success) {
            UI.showToast(result.error, 'error');
            return;
        }

        const target = GameState.getPlayer(targetId);

        // Handle result
        switch (result.result.action) {
            case 'reveal_tryal':
                // Trigger Tryal reveal
                const revealResult = GameState.revealTryalCard(targetId, GameState.state.localPlayerId);
                if (revealResult) {
                    if (revealResult.action === 'witch_revealed') {
                        UI.showToast(`${target.name} เป็นแม่มด!`, 'success');
                        Utils.vibrate([100, 50, 100]);

                        if (revealResult.gameOver) {
                            this.endGame('villagers');
                            return;
                        }
                    } else if (revealResult.action === 'innocent_killed') {
                        UI.showToast(`${target.name} เป็นผู้บริสุทธิ์ที่ถูกสังเวย...`, 'info');
                        GameLog.logDeath(target.name, 'ถูกกำจัดในฐานะผู้บริสุทธิ์');
                    } else if (revealResult.action === 'not_witch') {
                        UI.showToast(`${target.name} ไม่ใช่แม่มด`, 'info');
                        GameLog.logReveal(target.name, 'not_witch');
                    }
                }
                break;

            case 'accused':
                UI.showToast(`${target.name} ถูกกล่าวหา (+${result.result.value})`, 'info');
                GameLog.logAccuse(localPlayer.name, target.name, result.result.value);
                break;

            case 'alibi':
                UI.showToast(`ข้อกล่าวหาของ ${target.name} ถูกลบ`, 'success');
                GameLog.logHelper(localPlayer.name, 'ข้อแก้ตัว', target.name);
                break;

            case 'stocks':
                UI.showToast(`${target.name} ติดขื่อคา (ข้ามเทิร์น)`, 'info');
                GameLog.logHelper(localPlayer.name, 'ขื่อคา', target.name);
                break;

            case 'scapegoat':
                const scapeTarget = GameState.getPlayer(result.result.to);
                UI.showToast(`ย้ายความผิดจาก ${target.name} ไปที่ ${scapeTarget.name}`, 'info');
                GameLog.add(`${localPlayer.name} ย้ายแพะรับบาปไปที่ ${scapeTarget.name}`, 'helper');
                break;

            case 'robbery':
                const robTarget = GameState.getPlayer(result.result.to);
                UI.showToast(`${target.name} ถูกปล้นการ์ดไปให้ ${robTarget.name}!`, 'info');
                GameLog.add(`${localPlayer.name} ปล้นการ์ดจาก ${target.name} ไปให้ ${robTarget.name}`, 'accuse');
                break;

            case 'curse':
                if (result.result.moved) {
                    const curseTarget = GameState.getPlayer(result.result.to);
                    UI.showToast(`ย้ายคำสาปจาก ${target.name} ไปที่ ${curseTarget.name}`, 'info');
                } else {
                    UI.showToast(`การ์ดสีฟ้าของ ${target.name} ถูกทำลาย`, 'info');
                }
                break;

            case 'matchmaker':
                UI.showToast(`${result.result.target1} และ ${result.result.target2} ถูกผูกชะตากัน!`, 'info');
                GameLog.add(`${localPlayer.name} ผูกชะตา ${result.result.target1} + ${result.result.target2}`, 'helper');
                break;

            case 'arson':
                UI.showToast(`การ์ดในมือของ ${target.name} ถูกเผาทั้งหมด!`, 'info');
                GameLog.add(`${localPlayer.name} เผาการ์ดของ ${target.name}`, 'accuse');
                break;

            case 'attached':
                UI.showToast(`${card.name} ถูกวางที่ ${target.name}`, 'success');
                break;

            default:
                UI.showToast('เล่นการ์ดสำเร็จ', 'success');
        }

        // Update UI
        UI.updatePlayerScreen(localPlayer, GameState.state);

        // Broadcast
        Connection.send('card_played', { cardId, targetId, secondTargetId });
        Connection.broadcastState();

        this.selectedCard = null;
    },

    // End turn
    endTurn() {
        const currentPlayer = GameState.getCurrentPlayer();
        const localPlayer = GameState.getLocalPlayer();

        if (!currentPlayer || currentPlayer.id !== localPlayer.id) {
            UI.showToast('ยังไม่ใช่เทิร์นของคุณ', 'error');
            return;
        }

        if (!GameState.state.hasDrawn && !GameState.state.hasPlayed) {
            // Optional: warning if doing nothing?
            // Usually allows skipping turn?
            // Rule: "Players... can draw... or play"
            // If they do neither, they pass turn?
            // Let's allow passing.
        }

        // Check game over before ending turn
        const gameOver = GameState.checkGameOver();
        if (gameOver.over) {
            this.endGame(gameOver.winner);
            return;
        }

        // End turn
        const nextPlayer = GameState.endTurn();

        UI.showToast(`เทิร์นของ ${nextPlayer.name}`, 'info');
        if (nextPlayer.id === localPlayer.id) {
            UI.showToast('ตาของคุณ! เลือกจั่วการ์ด หรือ เล่นการ์ด', 'success');
        }
        GameLog.logTurn(nextPlayer.name);

        // Update UI
        UI.updatePlayerScreen(localPlayer, GameState.state);
        Connection.broadcastState();

        // If next player is a bot, run their turn automatically
        if (nextPlayer.isBot && nextPlayer.isAlive) {
            UI.showToast(`🤖 ${nextPlayer.name} กำลังเล่น...`, 'info');
            setTimeout(() => BotAI.runBotTurn(), 1500);
        }
    },

    // Witch selects target during night
    witchSelectTarget(targetId) {
        GameState.witchSelectTarget(targetId);

        Connection.send('night_action', {
            actionType: 'witch_kill',
            targetId
        });

        const target = GameState.getPlayer(targetId);
        UI.showToast(`คุณเลือกที่จะสังหาร ${target.name}`, 'info');

        // If host, check if night is complete
        if (GameState.state.isHost) {
            this.checkNightComplete();
        }
    },

    // Constable protects player during night
    constableProtect(targetId) {
        GameState.constableProtect(targetId);

        Connection.send('night_action', {
            actionType: 'constable_protect',
            targetId
        });

        const target = GameState.getPlayer(targetId);
        UI.showToast(`คุณปกป้อง ${target.name}`, 'success');

        // If host, check if night is complete
        if (GameState.state.isHost) {
            this.checkNightComplete();
        }
    },

    // Check if all night actions are done
    checkNightComplete() {
        // For simplicity, resolve night after a delay
        // In a full implementation, would wait for all actions
        setTimeout(() => {
            this.resolveNight();
        }, 3000);
    },

    // Resolve night phase
    resolveNight() {
        const result = GameState.resolveNight();

        if (result.killed) {
            const victims = Array.isArray(result.killed) ? result.killed : [result.killed];
            victims.forEach(victim => {
                UI.showToast(`${victim.name} ถูกสังหารในคืนนี้...`, 'error');
            });

            // Check game over
            if (result.gameOver) {
                this.endGame(result.gameOver.winner);
                return;
            }
        } else {
            UI.showToast('ไม่มีใครถูกสังหารในคืนนี้', 'success');
        }

        // Return to playing phase
        Connection.broadcastState();

        if (GameState.state.isHost) {
            Screens.show('host');
            UI.updateHostScreen(GameState.state);
        } else {
            Screens.show('player');
            UI.updatePlayerScreen(GameState.getLocalPlayer(), GameState.state);
        }
    },

    // End the game
    endGame(winner) {
        GameState.state.phase = GameState.PHASES.GAME_OVER;
        Connection.broadcastState();

        UI.showEndGame(winner, GameState.state);
    },

    // Peek at own Tryal card (for certain characters/abilities)
    peekTryalCard(index) {
        const localPlayer = GameState.getLocalPlayer();

        if (!localPlayer) return;

        const card = localPlayer.tryalCards[index];
        if (!card || card.revealed) return;

        // Only Mary Warren can peek at start
        if (localPlayer.characterId === 'mary_warren') {
            UI.showModal('Tryal Card ของคุณ', `
                <div class="text-center">
                    <span style="font-size: 4rem">${card.icon}</span>
                    <h3 class="mt-md">${card.name}</h3>
                    <p class="text-muted">${card.isWitch ? 'คุณเป็นแม่มด!' : 'คุณไม่ใช่แม่มด'}</p>
                </div>
            `);
        }
    },

    // Play again
    playAgain() {
        // Reset game but keep room
        const roomCode = GameState.state.roomCode;
        const players = GameState.state.players.map(p => ({
            ...p,
            isAlive: true,
            accusations: 0,
            tryalCards: [],
            handCards: [],
            blueCards: [],
            characterId: null,
            isWitch: false,
            isConstable: false
        }));

        GameState.init();
        GameState.state.roomCode = roomCode;
        GameState.state.players = players;
        GameState.state.isHost = Connection.type === Connection.TYPE.HOST;
        GameState.state.localPlayerId = players.find(p => p.isHost)?.id || players[0]?.id;

        Screens.show('lobby');
        Connection.broadcastState();
    },

    // Back to main menu
    backToMenu() {
        Connection.leaveRoom();
        GameState.init();
        Screens.show('menu');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for use
window.App = App;
