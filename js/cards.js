/**
 * Salem 1692 - Cards Definition (ภาษาไทย)
 */

const Cards = {
    // Card Types
    TYPES: {
        TRYAL: 'tryal',
        RED: 'red',
        GREEN: 'green',
        BLUE: 'blue',
        BLACK: 'black',
        KILL: 'kill'
    },

    // Tryal Card Types
    TRYAL_TYPES: {
        WITCH: 'witch',
        NOT_WITCH: 'not_witch',
        CONSTABLE: 'constable'
    },

    // Tryal Cards Definition
    tryalCards: [
        // Witch Cards (7)
        { id: 'witch_1', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },
        { id: 'witch_2', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },
        { id: 'witch_3', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },
        { id: 'witch_4', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },
        { id: 'witch_5', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },
        { id: 'witch_6', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },
        { id: 'witch_7', type: 'witch', name: 'แม่มด', icon: '🧙‍♀️', isWitch: true },

        // Constable Cards (2)
        { id: 'constable_1', type: 'constable', name: 'สายตรวจ', icon: '🛡️', isWitch: false, ability: 'ปกป้องผู้เล่น 1 คนในช่วงกลางคืน' },
        { id: 'constable_2', type: 'constable', name: 'สายตรวจ', icon: '🛡️', isWitch: false, ability: 'ปกป้องผู้เล่น 1 คนในช่วงกลางคืน' },

        // Not a Witch Cards (30)
        ...Array.from({ length: 30 }, (_, i) => ({
            id: `not_witch_${i + 1}`,
            type: 'not_witch',
            name: 'ไม่ใช่แม่มด',
            icon: '✨',
            isWitch: false
        }))
    ],

    // Playing Cards Definition
    playingCards: [
        // Red Cards - Accusations
        // Witness (1) - 7 points
        {
            id: 'witness',
            type: 'red',
            name: 'พยาน',
            icon: '👁️',
            value: 7,
            count: 1,
            description: '+7 ข้อกล่าวหา (เปิดไพ่ไต่สวนทันที)'
        },

        // Evidence (5) - 3 points each
        ...Array.from({ length: 5 }, (_, i) => ({
            id: `evidence_${i + 1}`,
            type: 'red',
            name: 'หลักฐาน',
            icon: '📜',
            value: 3,
            description: '+3 ข้อกล่าวหา'
        })),

        // Accusation (35) - 1 point each
        ...Array.from({ length: 35 }, (_, i) => ({
            id: `accusation_${i + 1}`,
            type: 'red',
            name: 'ข้อกล่าวหา',
            icon: '☝️',
            value: 1,
            description: '+1 ข้อกล่าวหา'
        })),

        // Green Cards - One-time use
        // Alibi (3)
        ...Array.from({ length: 3 }, (_, i) => ({
            id: `alibi_${i + 1}`,
            type: 'green',
            name: 'ข้อแก้ต่าง',
            icon: '🕊️',
            description: 'ลบล้างข้อกล่าวหาทั้งหมด'
        })),

        // Stocks (3)
        ...Array.from({ length: 3 }, (_, i) => ({
            id: `stocks_${i + 1}`,
            type: 'green',
            name: 'ขื่อคา',
            icon: '⛓️',
            description: 'หยุดเล่นในตาถัดไป'
        })),

        // Scapegoat (2)
        ...Array.from({ length: 2 }, (_, i) => ({
            id: `scapegoat_${i + 1}`,
            type: 'green',
            name: 'แพะรับบาป',
            icon: '🐐',
            description: 'ย้ายไพ่สีเขียว/แดง/น้ำเงิน ไปให้ผู้เล่นอื่น'
        })),

        // Arson (1)
        {
            id: 'arson',
            type: 'green',
            name: 'วางเพลิง',
            icon: '🔥',
            count: 1,
            description: 'ผู้เล่นเป้าหมายทิ้งไพ่ในมือทั้งหมด'
        },

        // Curse (1)
        {
            id: 'curse',
            type: 'green',
            name: 'คำสาป',
            icon: '💀',
            count: 1,
            description: 'ย้ายไพ่สีน้ำเงินของผู้เล่นเป้าหมายไปให้คนอื่น'
        },

        // Robbery (1)
        {
            id: 'robbery',
            type: 'green',
            name: 'ปล้น',
            icon: '🗡️',
            count: 1,
            description: 'ย้ายไพ่ในมือทั้งหมดไปให้ผู้เล่นอีกคน'
        },

        // Blue Cards - Persistent
        // Matchmaker (2)
        ...Array.from({ length: 2 }, (_, i) => ({
            id: `matchmaker_${i + 1}`,
            type: 'blue',
            name: 'แม่สื่อ',
            icon: '💕',
            description: 'เชื่อมผู้เล่นสองคนเข้าด้วยกัน (ตายคู่)'
        })),

        // Shelter (2) - Formerly Asylum
        ...Array.from({ length: 2 }, (_, i) => ({
            id: `shelter_${i + 1}`,
            type: 'blue',
            name: 'ที่หลบภัย',
            icon: '🏥',
            description: 'ปกป้องผู้เล่นจากการถูกฆ่าในช่วงรัตติกาล'
        })),

        // Faith (3) - Formerly Piety
        ...Array.from({ length: 3 }, (_, i) => ({
            id: `faith_${i + 1}`,
            type: 'blue',
            name: 'พลังศรัทธา',
            icon: '✝️',
            description: 'ปกป้องผู้เล่นจากไพ่สีแดง'
        }))
    ],

    // Black Cards - Events
    blackCards: [
        {
            id: 'black_cat',
            type: 'black',
            name: 'แมวดำ',
            icon: '🐈‍⬛',
            description: 'ผู้ถือเริ่มเกม - ต้องเปิดไพ่ไต่สวนเมื่อเจอไพ่เจตนาร้าย'
        },
        {
            id: 'malice', // Formerly Conspiracy
            type: 'black',
            name: 'เจตนาร้าย',
            icon: '🌀',
            description: 'ผู้ถือแมวดำและผู้จั่วเปิดไพ่ไต่สวน 1 ใบ แล้วทุกคนวนไพ่ไต่สวน'
        },
        {
            id: 'night',
            type: 'black',
            name: 'รัตติกาล',
            icon: '🌙',
            description: 'เข้าสู่ช่วงกลางคืน'
        }
    ],

    // Kill Cards (15)
    killCards: Array.from({ length: 15 }, (_, i) => ({
        id: `kill_${i + 1}`,
        type: 'kill',
        name: 'สังหาร',
        icon: '💀'
    })),

    // Get setup config based on player count
    getSetupConfig(playerCount) {
        if (playerCount <= 5) {
            return { tryalPerPlayer: 5, witchCount: 3, constableCount: 1 };
        } else if (playerCount <= 8) {
            return { tryalPerPlayer: 4, witchCount: 4, constableCount: 1 };
        } else {
            return { tryalPerPlayer: 3, witchCount: 5, constableCount: 1 };
        }
    },

    // Create Tryal deck for game
    createTryalDeck(playerCount) {
        const config = this.getSetupConfig(playerCount);
        const totalTryalNeeded = playerCount * config.tryalPerPlayer;

        let deck = [];

        // Add witch cards
        const witches = this.tryalCards.filter(c => c.type === 'witch').slice(0, config.witchCount);
        deck.push(...witches);

        // Add constable cards
        const constables = this.tryalCards.filter(c => c.type === 'constable').slice(0, config.constableCount);
        deck.push(...constables);

        // Add not-witch cards to fill
        const notWitches = this.tryalCards.filter(c => c.type === 'not_witch');
        const neededNotWitch = totalTryalNeeded - deck.length;
        deck.push(...notWitches.slice(0, neededNotWitch));

        return Utils.shuffle(deck);
    },

    // Create Playing deck for game
    createPlayingDeck() {
        let deck = [...this.playingCards];

        // Add Malice card (shuffled in)
        deck.push(this.blackCards.find(c => c.id === 'malice'));

        // Shuffle deck
        deck = Utils.shuffle(deck);

        // Add Night card at bottom
        deck.push(this.blackCards.find(c => c.id === 'night'));

        return deck;
    },

    // Create card HTML element
    createCardElement(card, options = {}) {
        const {
            faceDown = false,
            size = 'normal',
            selectable = false,
            onClick = null
        } = options;

        const cardEl = Utils.createElement('div', {
            className: `card card-${card.type} card-${size} ${faceDown ? 'flipped' : ''} ${selectable ? 'selectable' : ''}`,
            dataId: card.id
        });

        if (onClick) {
            cardEl.addEventListener('click', () => onClick(card));
        }

        const inner = Utils.createElement('div', { className: 'card-inner' });

        // Card Back
        const back = Utils.createElement('div', { className: 'card-back' });
        back.innerHTML = '<span class="card-back-text">Salem</span>';

        // Card Front
        const front = Utils.createElement('div', { className: 'card-front' });

        if (card.value) {
            front.innerHTML += `<span class="card-value">${card.value}</span>`;
        }
        front.innerHTML += `<span class="card-icon">${card.icon}</span>`;
        front.innerHTML += `<span class="card-name">${card.name}</span>`;

        if (card.description && size !== 'sm') {
            front.innerHTML += `<span class="card-description">${card.description}</span>`;
        }

        inner.appendChild(back);
        inner.appendChild(front);
        cardEl.appendChild(inner);

        return cardEl;
    }
};

// Export for use in other modules
window.Cards = Cards;
