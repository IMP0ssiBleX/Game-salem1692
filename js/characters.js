/**
 * Salem 1692 - Characters Definition (ภาษาไทย)
 * ตัวละคร 12 ตัวจากประวัติศาสตร์ Salem
 */

const Characters = {
    list: [
        {
            id: 'mary_warren',
            name: 'แมรี่ วอร์เรน',
            nameEn: 'Mary Warren',
            icon: '👩',
            ability: 'มองดู Tryal Card ของตัวเอง 1 ใบเมื่อเริ่มเกม',
            abilityType: 'passive',
            description: 'คนรับใช้ที่เคยถูกกล่าวหาว่าเป็นแม่มด แต่ภายหลังกลับมาเป็นพยานให้ศาล'
        },
        {
            id: 'samuel_parris',
            name: 'ซามูเอล พาร์ริส',
            nameEn: 'Samuel Parris',
            icon: '👨‍⚖️',
            ability: 'เริ่มเกมด้วยการ์ด Piety (ศรัทธา) 1 ใบ',
            abilityType: 'start',
            description: 'บาทหลวงแห่ง Salem ผู้เริ่มต้นการล่าแม่มด'
        },
        {
            id: 'john_proctor',
            name: 'จอห์น พร็อคเตอร์',
            nameEn: 'John Proctor',
            icon: '👨‍🌾',
            ability: 'สามารถเล่นการ์ดใส่ตัวเองได้',
            abilityType: 'active',
            description: 'ชาวนาผู้ต่อต้านการล่าแม่มด และถูกประหารชีวิต'
        },
        {
            id: 'tituba',
            name: 'ทิทูบา',
            nameEn: 'Tituba',
            icon: '👩‍🦱',
            ability: 'มองดู 3 ใบบนของสำรับเมื่อจั่วการ์ด',
            abilityType: 'active',
            description: 'ทาสชาวอินเดียตะวันตกที่ถูกกล่าวหาว่าเป็นแม่มดคนแรก'
        },
        {
            id: 'sarah_good',
            name: 'ซาร่าห์ กู๊ด',
            nameEn: 'Sarah Good',
            icon: '👵',
            ability: 'จั่วการ์ดเพิ่ม 1 ใบต่อเทิร์น (รวม 3 ใบ)',
            abilityType: 'active',
            description: 'หญิงขอทานที่ถูกกล่าวหาและประหารชีวิต'
        },
        {
            id: 'giles_corey',
            name: 'กิลส์ คอเรย์',
            nameEn: 'Giles Corey',
            icon: '🧔',
            ability: 'ต้องการข้อกล่าวหา 9 แต้มถึงจะเปิด Tryal (แทนที่จะเป็น 7)',
            abilityType: 'passive',
            description: 'ชายชราที่ถูกทรมานจนตายเพราะปฏิเสธที่จะรับสารภาพ'
        },
        {
            id: 'rebecca_nurse',
            name: 'รีเบคก้า เนิร์ส',
            nameEn: 'Rebecca Nurse',
            icon: '👩‍🦳',
            ability: 'เมื่อถูกเปิด Tryal ที่ไม่ใช่แม่มด สามารถเปิด Tryal ผู้อื่น 1 ใบ',
            abilityType: 'reactive',
            description: 'หญิงชราที่มีชื่อเสียงดี แต่ถูกกล่าวหาและประหารชีวิต'
        },
        {
            id: 'ann_putnam',
            name: 'แอน พัทนัม',
            nameEn: 'Ann Putnam',
            icon: '👧',
            ability: 'เมื่อเล่นการ์ดกล่าวหา ได้รับ +1 แต้มพิเศษ',
            abilityType: 'active',
            description: 'เด็กหญิงผู้กล่าวหาผู้คนมากมายว่าเป็นแม่มด'
        },
        {
            id: 'cotton_mather',
            name: 'คอตตอน แม็ทเธอร์',
            nameEn: 'Cotton Mather',
            icon: '📖',
            ability: 'ป้องกันตัวเองจากการถูกฆ่าตอนกลางคืน 1 ครั้ง',
            abilityType: 'passive',
            description: 'นักบวชผู้มีอิทธิพลที่สนับสนุนการพิพากษาแม่มด'
        },
        {
            id: 'bridget_bishop',
            name: 'บริดเจ็ท บิชอป',
            nameEn: 'Bridget Bishop',
            icon: '👩‍🦰',
            ability: 'เมื่อถูกกล่าวหาครบ สามารถเลือกว่าจะให้ใครเปิด Tryal ของเธอ',
            abilityType: 'reactive',
            description: 'ผู้หญิงคนแรกที่ถูกประหารชีวิตในเหตุการณ์ Salem'
        },
        {
            id: 'sarah_osborne',
            name: 'ซาร่าห์ ออสบอร์น',
            nameEn: 'Sarah Osborne',
            icon: '🧓',
            ability: 'การ์ดสีเขียวที่เล่นกับเธอไม่มีผล',
            abilityType: 'passive',
            description: 'หญิงชราที่ถูกกล่าวหาแต่เสียชีวิตในคุกก่อนถูกพิพากษา'
        },
        {
            id: 'martha_corey',
            name: 'มาร์ธา คอเรย์',
            nameEn: 'Martha Corey',
            icon: '👩‍🦱',
            ability: 'เมื่อตาย (กลางคืน) เลือกผู้เล่น 1 คนเพื่อเปิด Tryal ของเขา',
            abilityType: 'reactive',
            description: 'ภรรยาของกิลส์ คอเรย์ ที่ถูกประหารชีวิตเช่นกัน'
        }
    ],

    // Get character by ID
    getById(id) {
        return this.list.find(c => c.id === id);
    },

    // Get random characters for selection (more than player count for choice)
    getSelectionPool(playerCount) {
        const shuffled = Utils.shuffle([...this.list]);
        return shuffled.slice(0, Math.min(playerCount + 4, 12));
    },

    // Create character card element
    createCharacterElement(character, options = {}) {
        const { selected = false, onClick = null } = options;

        const cardEl = Utils.createElement('div', {
            className: `character-card ${selected ? 'selected' : ''}`,
            dataId: character.id
        });

        if (onClick) {
            cardEl.addEventListener('click', () => onClick(character));
        }

        cardEl.innerHTML = `
            <div class="character-portrait">
                <span class="portrait-icon">${character.icon}</span>
            </div>
            <div class="character-info">
                <h4 class="character-name">${character.name}</h4>
                <p class="character-ability">${character.ability}</p>
            </div>
        `;

        return cardEl;
    },

    // Apply character ability (called at appropriate times)
    applyAbility(characterId, context, gameState) {
        const character = this.getById(characterId);
        if (!character) return;

        switch (characterId) {
            case 'mary_warren':
                // Reveal one of own Tryal cards at start
                if (context === 'start') {
                    return { action: 'reveal_own_tryal', count: 1 };
                }
                break;

            case 'samuel_parris':
                // Start with Piety card
                if (context === 'start') {
                    return { action: 'add_card', cardId: 'piety_1' };
                }
                break;

            case 'john_proctor':
                // Can play cards on self
                if (context === 'can_target_self') {
                    return true;
                }
                break;

            case 'tituba':
                // Look at top 3 cards when drawing
                if (context === 'draw') {
                    return { action: 'peek_deck', count: 3 };
                }
                break;

            case 'sarah_good':
                // Draw 3 cards instead of 2
                if (context === 'draw_count') {
                    return 3;
                }
                break;

            case 'giles_corey':
                // Need 9 accusations instead of 7
                if (context === 'accusation_threshold') {
                    return 9;
                }
                break;

            case 'rebecca_nurse':
                // When non-witch Tryal is revealed, can reveal another
                if (context === 'tryal_revealed_innocent') {
                    return { action: 'reveal_other_tryal' };
                }
                break;

            case 'ann_putnam':
                // +1 to accusation cards
                if (context === 'accusation_bonus') {
                    return 1;
                }
                break;

            case 'cotton_mather':
                // Survive death once
                if (context === 'night_death' && !gameState.cottonUsedAbility) {
                    return { action: 'survive_once' };
                }
                break;

            case 'bridget_bishop':
                // Choose who reveals Tryal when accused
                if (context === 'choose_revealer') {
                    return { action: 'choose_player' };
                }
                break;

            case 'sarah_osborne':
                // Green cards have no effect on her
                if (context === 'green_card_immunity') {
                    return true;
                }
                break;

            case 'martha_corey':
                // When killed at night, reveal someone's Tryal
                if (context === 'night_death') {
                    return { action: 'reveal_other_tryal' };
                }
                break;
        }

        return null;
    }
};

// Export for use in other modules
window.Characters = Characters;
