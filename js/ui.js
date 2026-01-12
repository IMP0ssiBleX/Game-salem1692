/**
 * Salem 1692 - UI Manager
 */

const UI = {
    // DOM cache
    elements: {},

    // Initialize UI
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Screens
            loadingScreen: document.getElementById('loading-screen'),
            menuScreen: document.getElementById('menu-screen'),
            createRoomScreen: document.getElementById('create-room-screen'),
            joinRoomScreen: document.getElementById('join-room-screen'),
            lobbyScreen: document.getElementById('lobby-screen'),
            characterScreen: document.getElementById('character-screen'),
            hostScreen: document.getElementById('host-screen'),
            playerScreen: document.getElementById('player-screen'),
            nightScreen: document.getElementById('night-screen'),
            endScreen: document.getElementById('end-screen'),
            howtoScreen: document.getElementById('howto-screen'),

            // Menu buttons
            btnCreateRoom: document.getElementById('btn-create-room'),
            btnJoinRoom: document.getElementById('btn-join-room'),
            btnHowToPlay: document.getElementById('btn-how-to-play'),

            // Create room
            hostNameInput: document.getElementById('host-name'),
            btnConfirmCreate: document.getElementById('btn-confirm-create'),
            btnBackCreate: document.getElementById('btn-back-create'),

            // Join room
            playerNameInput: document.getElementById('player-name'),
            roomCodeInput: document.getElementById('room-code'),
            btnConfirmJoin: document.getElementById('btn-confirm-join'),
            btnBackJoin: document.getElementById('btn-back-join'),

            // Lobby
            lobbyRoomCode: document.getElementById('lobby-room-code'),
            lobbyPlayerCount: document.getElementById('lobby-player-count'),
            playersGrid: document.getElementById('players-grid'),
            qrCode: document.getElementById('qr-code'),
            btnAddBot: document.getElementById('btn-add-bot'),
            btnLeaveRoom: document.getElementById('btn-leave-room'),
            btnStartGame: document.getElementById('btn-start-game'),

            // Character select
            charactersGrid: document.getElementById('characters-grid'),
            selectedCharacter: document.getElementById('selected-character'),
            charTimer: document.getElementById('char-timer'),
            btnConfirmCharacter: document.getElementById('btn-confirm-character'),

            // Host screen
            hostPhase: document.getElementById('host-phase'),
            hostCurrentPlayer: document.getElementById('host-current-player'),
            hostDeckCount: document.getElementById('host-deck-count'),
            hostPlayersCircle: document.getElementById('host-players-circle'),
            hostEvent: document.getElementById('host-event'),
            revealedCards: document.getElementById('revealed-cards'),

            // Player screen
            playerAvatar: document.getElementById('player-avatar'),
            playerNameDisplay: document.getElementById('player-name-display'),
            playerCharacterDisplay: document.getElementById('player-character-display'),
            accusationFill: document.getElementById('accusation-fill'),
            accusationCount: document.getElementById('accusation-count'),
            tryalCards: document.getElementById('tryal-cards'),
            handCards: document.getElementById('hand-cards'),
            btnDrawCards: document.getElementById('btn-draw-cards'),
            btnEndTurn: document.getElementById('btn-end-turn'),

            // Night screen
            nightInstruction: document.getElementById('night-instruction'),
            nightActionArea: document.getElementById('night-action-area'),

            // End screen
            winnerTitle: document.getElementById('winner-title'),
            winnerSubtitle: document.getElementById('winner-subtitle'),
            finalReveal: document.getElementById('final-reveal'),
            btnPlayAgain: document.getElementById('btn-play-again'),
            btnBackMenu: document.getElementById('btn-back-menu'),

            // How to play
            btnBackHowto: document.getElementById('btn-back-howto'),

            // Modal
            modal: document.getElementById('modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalClose: document.getElementById('modal-close'),

            // Toast
            toastContainer: document.getElementById('toast-container')
        };
    },

    // Bind event listeners
    bindEvents() {
        // Menu
        this.elements.btnCreateRoom.onclick = () => Screens.show('create-room');
        this.elements.btnJoinRoom.onclick = () => Screens.show('join-room');
        this.elements.btnHowToPlay.onclick = () => Screens.show('howto');

        // Back buttons
        this.elements.btnBackCreate.onclick = () => Screens.show('menu');
        this.elements.btnBackJoin.onclick = () => Screens.show('menu');
        this.elements.btnBackHowto.onclick = () => Screens.show('menu');

        // Create/Join
        this.elements.btnConfirmCreate.onclick = () => App.createRoom();
        this.elements.btnConfirmJoin.onclick = () => App.joinRoom();

        // Lobby
        this.elements.btnAddBot.onclick = () => App.addBot();
        this.elements.btnLeaveRoom.onclick = () => App.leaveRoom();
        this.elements.btnStartGame.onclick = () => App.startGame();

        // Character select
        this.elements.btnConfirmCharacter.onclick = () => App.confirmCharacter();

        // Player actions
        this.elements.btnDrawCards.onclick = () => App.drawCards();
        this.elements.btnEndTurn.onclick = () => App.endTurn();

        // Modal
        this.elements.modalClose.onclick = () => this.hideModal();

        // End game
        this.elements.btnPlayAgain.onclick = () => App.playAgain();
        this.elements.btnBackMenu.onclick = () => App.backToMenu();

        // Toggle buttons in create room
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Room code input - auto uppercase
        this.elements.roomCodeInput.oninput = (e) => {
            e.target.value = e.target.value.toUpperCase();
        };
    },

    // Show modal
    showModal(title, content) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalBody.innerHTML = '';

        if (typeof content === 'string') {
            this.elements.modalBody.innerHTML = content;
        } else {
            this.elements.modalBody.appendChild(content);
        }

        this.elements.modal.classList.add('active');
    },

    // Hide modal
    hideModal() {
        this.elements.modal.classList.remove('active');
    },

    // Show toast
    showToast(message, type = 'info') {
        Utils.showToast(message, type);
    },

    // Update lobby players
    updateLobbyPlayers(players) {
        const grid = this.elements.playersGrid;
        grid.innerHTML = '';

        // Create 12 slots
        for (let i = 0; i < 12; i++) {
            const player = players[i];
            const slot = document.createElement('div');
            slot.className = `player-slot ${player ? 'filled' : 'empty'} ${player?.isHost ? 'host' : ''}`;

            if (player) {
                slot.innerHTML = `
                    <div class="player-slot-avatar">${player.avatar}</div>
                    <div class="player-slot-name">${player.name}</div>
                    ${player.isHost ? '<div class="player-slot-badge">👑 โฮสต์</div>' : ''}
                `;
            } else {
                slot.innerHTML = `
                    <div class="player-slot-avatar">?</div>
                    <div class="player-slot-name">รอผู้เล่น...</div>
                `;
            }

            grid.appendChild(slot);
        }

        // Update count
        this.elements.lobbyPlayerCount.textContent = players.length;

        // Enable/disable start button (need 4+ players)
        this.elements.btnStartGame.disabled = players.length < 4;
    },

    // Update character grid
    updateCharacterGrid(characters, selectedId = null) {
        const grid = this.elements.charactersGrid;
        grid.innerHTML = '';

        characters.forEach(char => {
            const card = Characters.createCharacterElement(char, {
                selected: char.id === selectedId,
                onClick: (c) => App.selectCharacter(c.id)
            });
            grid.appendChild(card);
        });
    },

    // Update selected character display
    updateSelectedCharacter(character) {
        const container = this.elements.selectedCharacter;

        if (character) {
            container.classList.add('visible');
            container.innerHTML = `
                <div class="character-portrait">
                    <span class="portrait-icon">${character.icon}</span>
                </div>
                <div class="character-info">
                    <h3 class="character-name">${character.name}</h3>
                    <p class="character-ability">${character.ability}</p>
                </div>
            `;
        } else {
            container.classList.remove('visible');
        }
    },

    // Update host screen
    updateHostScreen(state) {
        // Update phase
        const isNight = state.phase === 'night';
        this.elements.hostPhase.className = `game-phase ${isNight ? 'night' : ''}`;
        this.elements.hostPhase.innerHTML = `
            <span class="phase-icon">${isNight ? '🌙' : '☀️'}</span>
            <span class="phase-text">${isNight ? 'กลางคืน' : 'กลางวัน'}</span>
        `;

        // Update current player
        const currentPlayer = state.players[state.currentPlayerIndex];
        if (currentPlayer) {
            this.elements.hostCurrentPlayer.textContent = currentPlayer.name;
        }

        // Update deck count
        this.elements.hostDeckCount.textContent = state.playingDeck.length;

        // Update players circle
        this.updatePlayersCircle(state);

        // Update revealed cards
        this.updateRevealedCards(state.revealedWitches);
    },

    // Update players in circle formation
    updatePlayersCircle(state) {
        const circle = this.elements.hostPlayersCircle;
        circle.innerHTML = '';

        const alivePlayers = state.players.filter(p => p.isAlive);
        const positions = Utils.getCirclePositions(state.players.length);

        state.players.forEach((player, index) => {
            const pos = positions[index];
            const isCurrent = index === state.currentPlayerIndex;

            const playerEl = document.createElement('div');
            playerEl.className = `player-position ${isCurrent ? 'current-turn' : ''} ${!player.isAlive ? 'eliminated' : ''}`;
            playerEl.style.left = pos.x;
            playerEl.style.top = pos.y;
            playerEl.dataset.id = player.id;

            playerEl.innerHTML = `
                <div class="position-avatar">${player.avatar}</div>
                <div class="position-name">${player.name}</div>
                <div class="position-accusations">
                    ${Array(Math.min(player.accusations, 7)).fill('<span class="accusation-marker"></span>').join('')}
                </div>
            `;

            circle.appendChild(playerEl);
        });
    },

    // Update revealed witch cards
    updateRevealedCards(revealed) {
        const container = this.elements.revealedCards;
        container.innerHTML = '';

        if (revealed.length === 0) {
            container.innerHTML = '<p class="text-muted">ยังไม่มีแม่มดถูกเปิดเผย</p>';
            return;
        }

        revealed.forEach(witch => {
            const card = document.createElement('div');
            card.className = 'card card-tryal witch card-sm flipped';
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-back"></div>
                    <div class="card-front">
                        <span class="card-icon">🧙‍♀️</span>
                        <span class="card-name">${witch.playerName}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Update player screen
    updatePlayerScreen(player, state) {
        // Update header
        this.elements.playerAvatar.textContent = player.avatar;
        this.elements.playerNameDisplay.textContent = player.name;

        const character = Characters.getById(player.characterId);
        this.elements.playerCharacterDisplay.textContent = character ? character.name : '';

        // Update accusation meter
        const percentage = Math.min((player.accusations / 7) * 100, 100);
        this.elements.accusationFill.style.width = `${percentage}%`;
        this.elements.accusationCount.textContent = player.accusations;

        // Update deck count
        const deckCountEl = document.getElementById('player-deck-count');
        if (deckCountEl) {
            deckCountEl.textContent = state.playingDeck.length;
        }

        // Update Tryal cards
        this.updateTryalCards(player.tryalCards);

        // Update hand cards
        this.updateHandCards(player.handCards, state);

        // Update action buttons
        this.updateActionButtons(player, state);
    },

    // Update Tryal cards display
    updateTryalCards(tryals) {
        const container = this.elements.tryalCards;
        container.innerHTML = '';

        tryals.forEach((tryal, index) => {
            const card = Cards.createCardElement(tryal, {
                faceDown: !tryal.revealed,
                onClick: tryal.revealed ? null : () => App.peekTryalCard(index)
            });

            if (tryal.revealed) {
                card.classList.add('revealed');
                if (tryal.isWitch) {
                    card.classList.add('witch');
                }
            }

            container.appendChild(card);
        });
    },

    // Update hand cards display
    updateHandCards(hand, state) {
        const container = this.elements.handCards;
        container.innerHTML = '';

        if (hand.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">ไม่มีการ์ดในมือ</p>';
            return;
        }

        const canPlay = state.turnPhase === 'choose' || state.turnPhase === 'played';
        // Cannot play if has drawn

        hand.forEach(card => {
            const cardEl = Cards.createCardElement(card, {
                selectable: canPlay && !state.hasDrawn,
                onClick: () => App.selectCard(card)
            });
            container.appendChild(cardEl);
        });
    },

    // Update action buttons
    updateActionButtons(player, state) {
        const currentPlayer = state.players[state.currentPlayerIndex];
        const isMyTurn = currentPlayer && currentPlayer.id === player.id;

        // Draw button enabled if my turn AND haven't played yet AND haven't drawn yet
        this.elements.btnDrawCards.disabled = !isMyTurn || state.hasDrawn || state.hasPlayed;

        // End turn enabled if my turn AND (has drawn OR has played)
        // Or should we allow skipping? Assuming must do at least one action?
        // Let's allow end turn if they did either.
        this.elements.btnEndTurn.disabled = !isMyTurn || (!state.hasDrawn && !state.hasPlayed);
    },

    // Show target selection modal
    showTargetSelection(card, players, callback) {
        const content = document.createElement('div');
        content.className = 'target-selection';

        players.forEach(player => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary btn-full';
            btn.style.marginBottom = '8px';
            btn.innerHTML = `${player.avatar} ${player.name}`;
            btn.onclick = () => {
                callback(player.id);
                this.hideModal();
            };
            content.appendChild(btn);
        });

        this.showModal(`เล่น ${card.name} กับใคร?`, content);
    },

    // Update night screen
    updateNightScreen(player, state) {
        const actionArea = this.elements.nightActionArea;
        actionArea.innerHTML = '';

        if (player.isWitch) {
            this.elements.nightInstruction.textContent = 'แม่มด - เลือกเหยื่อที่จะสังหาร';

            const targets = state.players.filter(p => p.isAlive && !p.isWitch);
            targets.forEach(target => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-danger';
                btn.style.margin = '4px';
                btn.innerHTML = `${target.avatar} ${target.name}`;
                btn.onclick = () => App.witchSelectTarget(target.id);
                actionArea.appendChild(btn);
            });
        } else if (player.isConstable) {
            this.elements.nightInstruction.textContent = 'ตำรวจ - เลือกคนที่จะปกป้อง';

            const targets = state.players.filter(p => p.isAlive && p.id !== player.id);
            targets.forEach(target => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary';
                btn.style.margin = '4px';
                btn.innerHTML = `${target.avatar} ${target.name}`;
                btn.onclick = () => App.constableProtect(target.id);
                actionArea.appendChild(btn);
            });
        } else {
            this.elements.nightInstruction.textContent = 'ปิดตาของคุณ...';
            actionArea.innerHTML = '<p class="text-muted">รอให้กลางคืนผ่านไป</p>';
        }
    },

    // Show end game screen
    showEndGame(winner, state) {
        if (winner === 'villagers') {
            this.elements.winnerTitle.textContent = '🎉 ชาวบ้านชนะ!';
            this.elements.winnerSubtitle.textContent = 'แม่มดถูกเปิดเผยทั้งหมดแล้ว';
        } else {
            this.elements.winnerTitle.textContent = '🧙‍♀️ แม่มดชนะ!';
            this.elements.winnerSubtitle.textContent = 'ชาวบ้านถูกกำจัดหมดแล้ว';
        }

        // Show all player roles
        const reveal = this.elements.finalReveal;
        reveal.innerHTML = '';

        state.players.forEach(player => {
            const card = document.createElement('div');
            card.className = `card card-tryal ${player.isWitch ? 'witch' : ''} card-sm flipped`;
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-back"></div>
                    <div class="card-front">
                        <span class="card-icon">${player.isWitch ? '🧙‍♀️' : '✨'}</span>
                        <span class="card-name">${player.name}</span>
                    </div>
                </div>
            `;
            reveal.appendChild(card);
        });

        Screens.show('end');
    },

    // Show event on host screen
    showHostEvent(message) {
        this.elements.hostEvent.innerHTML = `<p class="event-text">${message}</p>`;
    },

    // Visualize action on host screen
    visualizeAction(fromId, toId, actionType) {
        const fromEl = document.querySelector(`.player-position[data-id="${fromId}"]`);
        const toEl = document.querySelector(`.player-position[data-id="${toId}"]`);

        if (!fromEl || !toEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        // Create flying element
        const flyer = document.createElement('div');
        flyer.className = 'anim-flying-object';

        // Icon based on action
        let icon = '✨';
        if (actionType === 'accused') icon = '☝️';
        if (actionType === 'arson') icon = '🔥';
        if (actionType === 'stocks') icon = '⛓️';
        if (actionType === 'robbery') icon = '🗡️';
        if (actionType === 'curse') icon = '💀';

        flyer.textContent = icon;

        // Set positions
        flyer.style.setProperty('--start-x', `${fromRect.left + fromRect.width / 2 - 30}px`);
        flyer.style.setProperty('--start-y', `${fromRect.top + fromRect.height / 2 - 30}px`);
        flyer.style.setProperty('--end-x', `${toRect.left + toRect.width / 2 - 30}px`);
        flyer.style.setProperty('--end-y', `${toRect.top + toRect.height / 2 - 30}px`);

        document.body.appendChild(flyer);

        // Remove after animation
        setTimeout(() => {
            flyer.remove();

            // Hit effect
            toEl.classList.add('attacked');
            setTimeout(() => toEl.classList.remove('attacked'), 500);

            this.showHostEvent(`${actionType} hit!`);
        }, 1500);
    }
};

// Export for use in other modules
window.UI = UI;
