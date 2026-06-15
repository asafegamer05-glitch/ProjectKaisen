// ═══════════════════════════════════════
// MAP GENERATION - All 8 Areas
// ═══════════════════════════════════════

function generateMap(areaId) {
    let map;
    switch (areaId) {
        case 1: map = genArea1(); break;
        case 2: map = genArea2(); break;
        case 3: map = genArea3(); break;
        case 4: map = genArea4(); break;
        case 5: map = genArea5(); break;
        case 6: map = genArea6(); break;
        case 7: map = genArea7(); break;
        case 8: map = genArea8(); break;
        case 9: map = genGetoArena(); break;
        case 10: map = genGojoArena(); break;
        case 11: map = genSukunaArena(); break;
        case 12: map = genMahoragaArena(); break;
        case 14: map = genSixEyesArena(); break;
        case 15: map = genEastForest(); break;
        case 16: map = genPantheonArena(); break;
        case 17: map = genMountainStairs(); break;
        case 18: map = genIceSummit(); break;
        default: return null;
    }
    // Make portal tiles walkable
    for (const p of map.portals) {
        if (map.tiles[p.y] && map.tiles[p.y][p.x] !== undefined) {
            map.tiles[p.y][p.x] = 'I';
            if (p.y === 0 && map.tiles[1]) map.tiles[1][p.x] = 'I';
            if (p.y === map.h - 1 && map.tiles[map.h - 2]) map.tiles[map.h - 2][p.x] = 'I';
            if (p.x === 0 && map.tiles[p.y]) map.tiles[p.y][1] = 'I';
            if (p.x === map.w - 1 && map.tiles[p.y]) map.tiles[p.y][map.w - 2] = 'I';
        }
    }
    return map;
}

function createTileGrid(w, h, fill = 'F') {
    const tiles = [];
    for (let y = 0; y < h; y++) {
        tiles[y] = [];
        for (let x = 0; x < w; x++) tiles[y][x] = fill;
    }
    return tiles;
}

function addRect(tiles, x1, y1, x2, y2, type) {
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++)
            if (tiles[y] && tiles[y][x] !== undefined) tiles[y][x] = type;
}

function addBorder(tiles, x1, y1, x2, y2, type) {
    for (let x = x1; x <= x2; x++) { tiles[y1][x] = type; tiles[y2][x] = type; }
    for (let y = y1; y <= y2; y++) { tiles[y][x1] = type; tiles[y][x2] = type; }
}

// ── Area 1: School of Sorcery ──
function genArea1() {
    const w = 45, h = 35;
    const tiles = createTileGrid(w, h, 'g');
    // Border walls
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Paths
    addRect(tiles, 5, 16, 40, 18, 'P');  // main horizontal path
    addRect(tiles, 22, 5, 24, 30, 'P');  // main vertical path
    // Main building (school)
    addRect(tiles, 8, 3, 20, 10, 'B');
    addRect(tiles, 9, 4, 19, 9, 'H');
    tiles[10][14] = 'd'; // door
    // Training yard
    addRect(tiles, 28, 3, 40, 12, 'P');
    addBorder(tiles, 28, 3, 40, 12, 'O');
    tiles[12][34] = 'd';
    // Small buildings
    addRect(tiles, 5, 22, 13, 28, 'B');
    addRect(tiles, 6, 23, 12, 27, 'H');
    tiles[22][9] = 'd';
    addRect(tiles, 32, 22, 40, 28, 'B');
    addRect(tiles, 33, 23, 39, 27, 'H');
    tiles[22][36] = 'd';
    // Trees
    for (let i = 0; i < 15; i++) {
        const tx = randInt(2, w - 3), ty = randInt(2, h - 3);
        if (tiles[ty][tx] === 'g') { tiles[ty][tx] = 'T'; if (ty + 1 < h && tiles[ty + 1][tx] === 'g') tiles[ty + 1][tx] = 't'; }
    }
    // Water pond
    addRect(tiles, 35, 14, 39, 16, 'w');

    // North shop plaza
    addRect(tiles, 18, 1, 28, 4, 'P');
    // East route
    addRect(tiles, 38, 16, 44, 18, 'P');

    return {
        name: 'Escola de Feitiçaria', sub: 'Área 1', w, h, tiles,
        playerStart: { x: 22, y: 20 },
        npcs: [
            {
                x: 14, y: 6, preset: 'npc_master', name: 'Mestre Ancião', id: 'old_master',
                dialogue: ['Bem-vindo à Escola de Feitiçaria, jovem.', 'Treine bastante e fique forte!', 'Quando alcançar o nível 25, venha falar comigo sobre os 6 Olhos...']
            },
            {
                x: 10, y: 25, preset: 'npc_student', name: 'Estudante Yuki', id: 'student1',
                dialogue: ['Ei, você é novo? Cuidado com os espíritos malditos lá fora!', 'Use WASD para se mover e J para atacar.']
            },
            {
                x: 36, y: 25, preset: 'npc_student', name: 'Estudante Maki', id: 'student2',
                dialogue: ['Existem portões misteriosos na Área 4...', 'Dizem que um feiticeiro poderoso guarda a passagem.']
            },
            {
                x: 34, y: 7, preset: 'gojo', name: 'Professor Gojo', id: 'instructor',
                dialogue: ['Ora ora...', 'Treine bastante.', 'Quando estiver pronto, eu mesmo vou te ensinar uma técnica.']
            },
            {
                x: 20, y: 3, preset: 'npc_student', name: 'Loja de Clã', id: 'clan_shop',
                dialogue: ['Bem-vindo à Loja de Clãs.']
            },
            {
                x: 26, y: 3, preset: 'npc_student', name: 'Mercador Especial', id: 'special_shop',
                dialogue: ['Eu vendo técnicas raras... se você tiver moedas.']
            },
        ],
        enemies: [],
        portals: [
            { x: 22, y: h - 1, toArea: 2, toX: 22, toY: 2, label: 'Área 2 - Campos de Treinamento' },
            { x: w - 1, y: 17, toArea: 15, toX: 2, toY: 22, label: 'Floresta do Leste' }
        ],
        torches: []
    };
}

// ── Area 2: Training Grounds ──
function genArea2() {
    const w = 50, h = 40;
    const tiles = createTileGrid(w, h, 'G');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addRect(tiles, 10, 1, 40, 2, 'P');
    addRect(tiles, 22, 1, 24, 38, 'P');
    addRect(tiles, 5, 18, 45, 20, 'P');
    // Training areas
    addRect(tiles, 5, 5, 18, 15, 'P');
    // NOTE: no closed borders here, otherwise enemies can't reach player.
    addRect(tiles, 30, 5, 45, 15, 'P');
    // NOTE: no closed borders here, otherwise enemies can't reach player.
    addRect(tiles, 5, 25, 18, 35, 'P');
    // NOTE: no closed borders here, otherwise enemies can't reach player.
    // Trees scattered
    for (let i = 0; i < 10; i++) {
        const tx = randInt(2, w - 3), ty = randInt(2, h - 3);
        if (tiles[ty][tx] === 'G') tiles[ty][tx] = 'T';
    }
    return {
        name: 'Campos de Treinamento', sub: 'Área 2', w, h, tiles,
        playerStart: { x: 22, y: 3 },
        npcs: [],
        enemies: [
            { x: 10, y: 10, preset: 'cursed_spirit', name: 'Espírito Maldito', hp: 40, atk: 5, exp: 20, respawn: true },
            { x: 15, y: 10, preset: 'cursed_spirit', name: 'Espírito Maldito', hp: 40, atk: 5, exp: 20, respawn: true },
            { x: 35, y: 8, preset: 'cursed_spirit', name: 'Espírito Maldito', hp: 50, atk: 7, exp: 25, respawn: true },
            { x: 40, y: 12, preset: 'cursed_spirit', name: 'Espírito Maldito', hp: 50, atk: 7, exp: 25, respawn: true },
            { x: 10, y: 30, preset: 'cursed_spirit', name: 'Espírito Sombrio', hp: 60, atk: 8, exp: 30, respawn: true },
            { x: 15, y: 30, preset: 'cursed_spirit', name: 'Espírito Sombrio', hp: 60, atk: 8, exp: 30, respawn: true },
        ],
        portals: [
            { x: 22, y: 0, toArea: 1, toX: 22, toY: 33, label: 'Área 1 - Escola' },
            { x: 22, y: h - 1, toArea: 3, toX: 22, toY: 2, label: 'Área 3 - Floresta' },
        ],
        torches: []
    };
}

// ── Area 9: Geto Arena (large) ──
function genGetoArena() {
    const w = 70, h = 50;
    const tiles = createTileGrid(w, h, 'A');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Extra-wide ring walls (feel like a coliseum)
    addBorder(tiles, 2, 2, w - 3, h - 3, 'O');
    // Pillars / cover
    for (let i = 0; i < 14; i++) {
        const tx = randInt(6, w - 7);
        const ty = randInt(6, h - 7);
        if ((tx - w/2) ** 2 + (ty - h/2) ** 2 < 600) tiles[ty][tx] = 'O';
    }
    return {
        name: 'Arena de Geto', sub: 'Arena', w, h, tiles,
        playerStart: { x: Math.floor(w / 2), y: h - 10 },
        npcs: [],
        enemies: [],
        portals: [
            { x: Math.floor(w / 2), y: h - 2, toArea: 4, toX: 22, toY: 26, label: 'Voltar aos Portões' }
        ],
        torches: [],
        bossSpawns: { geto: { x: Math.floor(w / 2), y: 10, preset: 'geto', name: 'Suguru Geto', id: 'geto' } }
    };
}

// ── Area 10: Gojo Arena (SUPER large) ──
function genGojoArena() {
    const w = 95, h = 70;
    const tiles = createTileGrid(w, h, 'A');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addBorder(tiles, 2, 2, w - 3, h - 3, 'O');
    // Lava moat corners for drama
    addRect(tiles, 3, 3, 10, 10, 'L');
    addRect(tiles, w - 11, 3, w - 4, 10, 'L');
    addRect(tiles, 3, h - 11, 10, h - 4, 'L');
    addRect(tiles, w - 11, h - 11, w - 4, h - 4, 'L');
    // More pillars
    for (let i = 0; i < 28; i++) {
        const tx = randInt(8, w - 9);
        const ty = randInt(8, h - 9);
        if ((tx - w/2) ** 2 + (ty - h/2) ** 2 < 1400) tiles[ty][tx] = 'O';
    }
    return {
        name: 'Arena Suprema', sub: 'Gojo', w, h, tiles,
        playerStart: { x: Math.floor(w / 2), y: h - 12 },
        npcs: [],
        enemies: [],
        portals: [
            { x: Math.floor(w / 2), y: h - 2, toArea: 6, toX: 25, toY: 8, label: 'Voltar à Arena Gigante' }
        ],
        torches: [],
        bossSpawns: { gojo: { x: Math.floor(w / 2), y: 14, preset: 'gojo', name: 'Satoru Gojo', id: 'gojo' } }
    };
}

// ── Area 11: Sukuna Arena (large, Geto-sized feel) ──
function genSukunaArena() {
    const w = 70, h = 50;
    const tiles = createTileGrid(w, h, 'R');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addBorder(tiles, 2, 2, w - 3, h - 3, 'O');
    // Lava stripes on the sides
    addRect(tiles, 3, 5, 6, h - 6, 'L');
    addRect(tiles, w - 7, 5, w - 4, h - 6, 'L');
    // Central path
    addRect(tiles, Math.floor(w/2) - 2, 3, Math.floor(w/2) + 2, h - 4, 'A');
    return {
        name: 'Sala do Rei das Maldições', sub: 'Sukuna', w, h, tiles,
        playerStart: { x: Math.floor(w / 2), y: h - 8 },
        npcs: [],
        enemies: [],
        portals: [
            { x: Math.floor(w / 2), y: h - 2, toArea: 6, toX: 57, toY: 10, label: 'Voltar à Cidade dos Templos' }
        ],
        torches: [],
        bossSpawns: { sukuna: { x: Math.floor(w / 2), y: 14, preset: 'sukuna', name: 'Ryomen Sukuna', id: 'sukuna' } }
    };
}

// ── Area 3: Forest Path ──
function genArea3() {
    const w = 55, h = 45;
    const tiles = createTileGrid(w, h, 'G');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Winding path
    addRect(tiles, 20, 1, 24, 15, 'P');
    addRect(tiles, 15, 13, 35, 16, 'P');
    addRect(tiles, 33, 14, 36, 30, 'P');
    addRect(tiles, 15, 28, 36, 31, 'P');
    addRect(tiles, 15, 29, 18, 43, 'P');
    // Dense trees
    for (let i = 0; i < 60; i++) {
        const tx = randInt(2, w - 3), ty = randInt(2, h - 3);
        if (tiles[ty][tx] === 'G') { tiles[ty][tx] = 'T'; }
    }
    // Clear the paths from trees
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
            if (tiles[y][x] === 'T' && isNearPath(tiles, x, y)) tiles[y][x] = 'G';
    // Water stream
    addRect(tiles, 40, 10, 42, 35, 'w');

    return {
        name: 'Floresta Maldita', sub: 'Área 3', w, h, tiles,
        playerStart: { x: 22, y: 3 },
        npcs: [
            {
                x: 30, y: 15, preset: 'npc_student', name: 'Viajante Perdido', id: 'traveler',
                dialogue: ['Cuidado! Os espíritos aqui são mais fortes...', 'Ouvi dizer que existem portões ao sul que levam a uma arena.']
            }
            ,
            {
                x: 44, y: 10, preset: 'npc_master', name: 'Mestre do Dojo', id: 'dojo_master',
                dialogue: ['Bem-vindo ao Dojo da Floresta.', 'Aqui, força vem em etapas.']
            }
            ,
            {
                x: 16, y: h - 3, preset: 'gojo', name: 'Professor Gojo', id: 'gojo_gate',
                dialogue: ['...']
            }
        ],
        enemies: [
            { x: 25, y: 10, preset: 'cursed_spirit', name: 'Espírito da Floresta', hp: 80, atk: 10, exp: 40, respawn: true },
            { x: 30, y: 20, preset: 'cursed_spirit', name: 'Espírito da Floresta', hp: 80, atk: 10, exp: 40, respawn: true },
            { x: 35, y: 25, preset: 'cursed_spirit', name: 'Sombra Maldita', hp: 100, atk: 12, exp: 50, respawn: true },
            { x: 20, y: 35, preset: 'cursed_spirit', name: 'Sombra Maldita', hp: 100, atk: 12, exp: 50, respawn: true },
            { x: 15, y: 38, preset: 'cursed_spirit', name: 'Espírito Ancião', hp: 120, atk: 15, exp: 60, respawn: true },
        ],
        portals: [
            { x: 22, y: 0, toArea: 2, toX: 22, toY: 38, label: 'Área 2 - Treinamento' },
            { x: 16, y: h - 1, toArea: 4, toX: 22, toY: 2, label: 'Área 4 - Os Portões' },
            { x: w - 1, y: 22, toArea: 15, toX: 2, toY: 22, label: 'Floresta do Leste' },
        ],
        torches: []
    };
}

// ── Area 12: Mahoraga Arena (separate) ──
function genMahoragaArena() {
    const w = 70, h = 55;
    const tiles = createTileGrid(w, h, 'A');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addBorder(tiles, 2, 2, w - 3, h - 3, 'O');
    // A few obstacles
    for (let i = 0; i < 18; i++) {
        const tx = randInt(6, w - 7);
        const ty = randInt(6, h - 7);
        if ((tx - w/2) ** 2 + (ty - h/2) ** 2 < 900) tiles[ty][tx] = 'O';
    }
    return {
        name: 'Arena de Mahoraga', sub: 'Ritual', w, h, tiles,
        playerStart: { x: Math.floor(w/2), y: h - 10 },
        npcs: [],
        enemies: [],
        portals: [
            { x: Math.floor(w/2), y: h - 2, toArea: 5, toX: 23, toY: 26, label: 'Voltar à Caverna' },
        ],
        bossSpawns: { mahoraga: { x: Math.floor(w/2), y: 12, preset: 'mahoraga', name: 'Mahoraga', id: 'mahoraga' } }
    };
}

// ── Area 14: Six Eyes Arena (small) ──
function genSixEyesArena() {
    const w = 26, h = 18;
    const tiles = createTileGrid(w, h, 'A');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addBorder(tiles, 2, 2, w - 3, h - 3, 'O');
    return {
        name: 'Santuário dos 6 Olhos', sub: 'Provação', w, h, tiles,
        playerStart: { x: Math.floor(w/2), y: h - 4 },
        npcs: [],
        enemies: [],
        portals: [
            { x: Math.floor(w/2), y: h - 2, toArea: 1, toX: 22, toY: 20, label: 'Voltar à Escola' },
        ],
        bossSpawns: { sixEyes: { x: Math.floor(w/2), y: 6, preset: 'cursed_spirit', name: 'Guardião', id: 'sixEyes' } }
    };
}

// ── Area 15: East Forest + hidden sign + boss ──
function genEastForest() {
    const w = 65, h = 45;
    const tiles = createTileGrid(w, h, 'G');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Clear corridor from west entrance
    addRect(tiles, 0, 20, 10, 24, 'P');
    // Scatter trees
    for (let i = 0; i < 75; i++) {
        const tx = randInt(2, w - 3), ty = randInt(2, h - 3);
        if (tiles[ty][tx] === 'G') tiles[ty][tx] = 'T';
    }
    // Boss arena patch
    addRect(tiles, 40, 10, 60, 34, 'A');
    addBorder(tiles, 40, 10, 60, 34, 'O');
    return {
        name: 'Floresta do Leste', sub: 'Área Extra', w, h, tiles,
        playerStart: { x: 3, y: 22 },
        npcs: [
            { x: w - 4, y: h - 4, preset: 'npc_student', name: 'Placa', id: 'east_sign',
              dialogue: ['nao tem nada aqui kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'] }
        ],
        enemies: [
            // a few strong spirits
            { x: 18, y: 18, preset: 'cursed_spirit', name: 'Espírito Selvagem', hp: 180, atk: 20, exp: 80, respawn: true },
            { x: 22, y: 28, preset: 'cursed_spirit', name: 'Espírito Selvagem', hp: 180, atk: 20, exp: 80, respawn: true },
        ],
        portals: [
            { x: 0, y: 22, toArea: 1, toX: 43, toY: 17, label: 'Voltar à Escola' },
            { x: 10, y: 0, toArea: 3, toX: 53, toY: 22, label: 'Conexão com Floresta (Área 3)' },
        ],
        bossSpawn: { x: 50, y: 20, preset: 'guardian', name: 'Fera do Dojo', id: 'dojo_boss' }
    };
}

// ── Area 16: Pantheon Arena ──
function genPantheonArena() {
    const w = 90, h = 65;
    const tiles = createTileGrid(w, h, 'A');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addBorder(tiles, 2, 2, w - 3, h - 3, 'O');
    // Minimal obstacles, big open space
    for (let i = 0; i < 10; i++) {
        const tx = randInt(10, w - 11);
        const ty = randInt(10, h - 11);
        tiles[ty][tx] = 'O';
    }
    return {
        name: 'Panteão', sub: 'Extra', w, h, tiles,
        playerStart: { x: Math.floor(w/2), y: h - 10 },
        npcs: [],
        enemies: [],
        portals: [
            { x: Math.floor(w/2), y: h - 2, toArea: 1, toX: 22, toY: 20, label: 'Voltar ao Menu' }
        ],
        torches: []
    };
}

function isNearPath(tiles, x, y) {
    for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
            if (tiles[y + dy] && tiles[y + dy][x + dx] === 'P') return true;
    return false;
}

// ── Area 4: The Gates ──
function genArea4() {
    const w = 45, h = 40;
    const tiles = createTileGrid(w, h, 'S');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addRect(tiles, 20, 1, 24, 38, 'P');
    // Gate 1 - Porta de Gojo
    addRect(tiles, 5, 12, 18, 22, 'A');
    addBorder(tiles, 5, 12, 18, 22, 'B');
    tiles[22][11] = 'd';
    // Gate 2 - Porta Aberta
    addRect(tiles, 28, 12, 41, 22, 'A');
    addBorder(tiles, 28, 12, 41, 22, 'B');
    tiles[22][34] = 'd';
    // Connect gates to path
    addRect(tiles, 11, 22, 11, 25, 'P');
    addRect(tiles, 11, 25, 22, 25, 'P');
    addRect(tiles, 34, 22, 34, 25, 'P');
    addRect(tiles, 22, 25, 34, 25, 'P');

    return {
        name: 'Os Portões', sub: 'Área 4', w, h, tiles,
        playerStart: { x: 22, y: 5 },
        npcs: [
            {
                x: 11, y: 26, preset: 'npc_student', name: 'Guardião Esquerdo', id: 'guard_l',
                dialogue: ['Esta é a Porta de Satoru Gojo.', 'Apenas os dignos podem entrar. Derrote Geto para provar seu valor!']
            },
            {
                x: 34, y: 26, preset: 'npc_student', name: 'Guardião Direito', id: 'guard_r',
                dialogue: ['A Porta Aberta... mas não se engane, é igualmente perigosa.', 'Geto espera por você em ambos os portões.']
            },
        ],
        enemies: [],
        portals: [
            { x: 22, y: 0, toArea: 3, toX: 16, toY: 43, label: 'Área 3 - Floresta' },
            { x: 22, y: h - 1, toArea: 5, toX: 22, toY: 2, label: 'Área 5 - Caverna' },
            // Gojo gate (only when route unlocked)
            { x: 11, y: 22, toArea: 10, toX: 47, toY: 58, label: 'Porta de Gojo — Arena Suprema' },
        ],
        bossSpawn: { x: 11, y: 17, preset: 'geto', name: 'Suguru Geto', id: 'geto' },
        torches: []
    };
}

// ── Area 5: Cave of Torches + Mahoraga Arena ──
function genArea5() {
    const w = 55, h = 50;
    const tiles = createTileGrid(w, h, 'D');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Main corridor
    addRect(tiles, 20, 1, 24, 20, 'D');
    // Torch rooms (5 torches)
    addRect(tiles, 5, 8, 15, 14, 'D');
    addBorder(tiles, 5, 8, 15, 14, 'W');
    tiles[14][10] = 'D'; // entrance
    addRect(tiles, 35, 8, 48, 14, 'D');
    addBorder(tiles, 35, 8, 48, 14, 'W');
    tiles[14][42] = 'D';
    // Connect to main
    addRect(tiles, 10, 14, 22, 16, 'D');
    addRect(tiles, 24, 14, 42, 16, 'D');
    // Mahoraga Arena
    addRect(tiles, 10, 25, 44, 42, 'A');
    addBorder(tiles, 10, 25, 44, 42, 'O');
    addRect(tiles, 22, 20, 24, 25, 'D');
    tiles[25][23] = 'A'; // entrance
    // Domain Master area
    addRect(tiles, 5, 35, 9, 42, 'D');
    addBorder(tiles, 5, 35, 9, 42, 'W');
    tiles[35][7] = 'D';
    addRect(tiles, 7, 42, 10, 44, 'D');

    return {
        name: 'Caverna das Tochas', sub: 'Área 5', w, h, tiles,
        playerStart: { x: 22, y: 3 },
        npcs: [
            {
                x: 7, y: 38, preset: 'domain_master', name: 'Mestre de Domínio', id: 'domain_master',
                dialogue: ['Você busca o poder da Expansão de Domínio?', 'Precisa de nível 30 e dominar 50% das técnicas...', 'Encontre os 3 fragmentos: fogo, gelo e escuridão nesta caverna.']
            },
        ],
        enemies: [
            { x: 12, y: 18, preset: 'cursed_spirit', name: 'Espírito da Caverna', hp: 120, atk: 14, exp: 55, respawn: true },
            { x: 38, y: 18, preset: 'cursed_spirit', name: 'Espírito da Caverna', hp: 120, atk: 14, exp: 55, respawn: true },
            { x: 20, y: 30, preset: 'cursed_spirit', name: 'Sombra Profunda', hp: 150, atk: 18, exp: 70, respawn: true },
            { x: 35, y: 35, preset: 'cursed_spirit', name: 'Sombra Profunda', hp: 150, atk: 18, exp: 70, respawn: true },
        ],
        portals: [
            { x: 22, y: 0, toArea: 4, toX: 22, toY: 38, label: 'Área 4 - Os Portões' },
            { x: 22, y: h - 1, toArea: 6, toX: 22, toY: 2, label: 'Área 6 - Arena Gigante' },
        ],
        torches: [
            { x: 8, y: 10, lit: false }, { x: 13, y: 10, lit: false },
            { x: 38, y: 10, lit: false }, { x: 45, y: 10, lit: false },
            { x: 27, y: 18, lit: false },
        ],
        fragments: [
            { x: 10, y: 12, type: 'fire', collected: false },
            { x: 42, y: 12, type: 'ice', collected: false },
            { x: 30, y: 38, type: 'dark', collected: false },
        ],
        relics: [
            { x: 24, y: 6, id: 'cave_scroll', collected: false },
        ],
        bossSpawn: { x: 27, y: 33, preset: 'mahoraga', name: 'Mahoraga', id: 'mahoraga' },
    };
}

// ── Area 6: City Night (exploration) ──
function genArea6() {
    const w = 60, h = 45;
    const tiles = createTileGrid(w, h, 'G');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Main street
    addRect(tiles, 5, 20, 54, 22, 'P');
    addRect(tiles, 28, 5, 31, 40, 'P');
    // Clear, explicit route to mountain stairs gate (x:3,y:6)
    addRect(tiles, 3, 6, 28, 8, 'P');
    addRect(tiles, 3, 8, 5, 22, 'P');
    // Temple-like blocks
    addRect(tiles, 8, 8, 18, 15, 'B');
    addRect(tiles, 9, 9, 17, 14, 'H');
    addRect(tiles, 42, 8, 52, 15, 'B');
    addRect(tiles, 43, 9, 51, 14, 'H');
    // Lantern posts / obstacles
    for (let i = 0; i < 10; i++) {
        const tx = randInt(6, w - 7), ty = randInt(6, h - 7);
        if (tiles[ty][tx] === 'G') tiles[ty][tx] = 'O';
    }
    // Keep routes always open (avoid random blockage)
    addRect(tiles, 3, 6, 28, 8, 'P');
    addRect(tiles, 3, 8, 5, 22, 'P');

    return {
        name: 'Cidade dos Templos', sub: 'Área 6', w, h, tiles,
        playerStart: { x: 30, y: 40 },
        npcs: [
            { x: 12, y: 24, preset: 'npc_student', name: 'Morador Aki', id: 'city_npc_1', dialogue: ['A cidade nunca dorme...', 'Mas hoje algo está errado.'] },
            { x: 46, y: 24, preset: 'npc_student', name: 'Moradora Rei', id: 'city_npc_2', dialogue: ['A porta de Sukuna fica no leste.', 'Só os loucos entram lá.'] },
            { x: 30, y: 12, preset: 'npc_master', name: 'Monge do Templo', id: 'city_npc_3', dialogue: ['A noite está pesada.', 'Prepare-se antes de enfrentar o Rei das Maldições.'] },
        ],
        enemies: [
            { x: 12, y: 26, preset: 'cursed_spirit', name: 'Espírito Noturno', hp: 180, atk: 20, exp: 80, respawn: true },
            { x: 46, y: 26, preset: 'cursed_spirit', name: 'Espírito Noturno', hp: 180, atk: 20, exp: 80, respawn: true },
            { x: 22, y: 18, preset: 'cursed_spirit', name: 'Sombra Urbana', hp: 220, atk: 24, exp: 100, respawn: true },
            { x: 38, y: 30, preset: 'cursed_spirit', name: 'Sombra Urbana', hp: 220, atk: 24, exp: 100, respawn: true },
            { x: 30, y: 24, preset: 'cursed_spirit', name: 'Arauto do Caos', hp: 260, atk: 28, exp: 130, respawn: true },
        ],
        switches: [],
        portals: [
            // Sukuna door: one of the doors leads to his arena (normal ending route)
            { x: w - 1, y: 10, toArea: 11, toX: 35, toY: 42, label: 'Porta — Arena de Sukuna' },
            // Stairs to mountain (needs Mahoraga key)
            { x: 3, y: 6, toArea: 17, toX: 10, toY: 30, label: 'Escadaria — Montanha' },
        ],
        torches: []
    };
}

// ── Area 17: Mountain Stairs (locked by key) ──
function genMountainStairs() {
    const w = 40, h = 35;
    const tiles = createTileGrid(w, h, 'D');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Stairs path
    addRect(tiles, 6, 28, 33, 30, 'P');
    addRect(tiles, 18, 5, 21, 30, 'P');
    // Rocks
    for (let i = 0; i < 18; i++) {
        const tx = randInt(3, w - 4), ty = randInt(3, h - 4);
        if (tiles[ty][tx] === 'D') tiles[ty][tx] = 'O';
    }
    return {
        name: 'Escadaria da Montanha', sub: 'Trilha', w, h, tiles,
        playerStart: { x: 10, y: 30 },
        npcs: [],
        enemies: [
            { x: 22, y: 18, preset: 'cursed_spirit', name: 'Espírito da Neve', hp: 220, atk: 22, exp: 90, respawn: true },
        ],
        portals: [
            { x: 0, y: 30, toArea: 6, toX: 4, toY: 6, label: 'Voltar à Cidade' },
            { x: 20, y: 0, toArea: 18, toX: 20, toY: 20, label: 'Topo — Gelo' },
        ],
        torches: []
    };
}

// ── Area 18: Ice Summit + pillar ──
function genIceSummit() {
    const w = 45, h = 30;
    const tiles = createTileGrid(w, h, 'S');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addRect(tiles, 18, 6, 26, 14, 'A'); // small platform
    addBorder(tiles, 18, 6, 26, 14, 'O');
    tiles[14][22] = 'A';
    return {
        name: 'Topo Congelado', sub: 'Montanha', w, h, tiles,
        playerStart: { x: 20, y: 20 },
        npcs: [
            { x: 22, y: 10, preset: 'npc_master', name: 'Pilar Antigo', id: 'ice_pillar',
              dialogue: ['Um pilar antigo coberto de gelo...'] }
        ],
        enemies: [],
        portals: [
            { x: 20, y: h - 1, toArea: 17, toX: 20, toY: 2, label: 'Descer a Montanha' },
        ],
        torches: []
    };
}

// ── Area 7: Post-game Ruins ──
function genArea7() {
    const w = 45, h = 40;
    const tiles = createTileGrid(w, h, 'D');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    addRect(tiles, 10, 5, 35, 35, 'A');
    addRect(tiles, 20, 1, 24, 5, 'D');
    // Scattered pillars
    for (let i = 0; i < 12; i++) {
        const tx = randInt(12, 33), ty = randInt(7, 33);
        tiles[ty][tx] = 'O';
    }
    return {
        name: 'Ruínas Ancestrais', sub: 'Área 7', w, h, tiles,
        playerStart: { x: 22, y: 3 },
        npcs: [],
        enemies: [
            { x: 15, y: 15, preset: 'cursed_spirit', name: 'Espírito Ancestral', hp: 250, atk: 25, exp: 120, respawn: true },
            { x: 30, y: 15, preset: 'cursed_spirit', name: 'Espírito Ancestral', hp: 250, atk: 25, exp: 120, respawn: true },
            { x: 15, y: 30, preset: 'cursed_spirit', name: 'Demônio Antigo', hp: 300, atk: 30, exp: 150, respawn: true },
            { x: 30, y: 30, preset: 'cursed_spirit', name: 'Demônio Antigo', hp: 300, atk: 30, exp: 150, respawn: true },
        ],
        portals: [
            { x: 22, y: 0, toArea: 6, toX: 25, toY: 48, label: 'Área 6 - Arena' },
            { x: 22, y: h - 1, toArea: 8, toX: 22, toY: 2, label: 'Área 8 - Abismo' },
        ],
        torches: []
    };
}

// ── Area 8: Post-game Abyss ──
function genArea8() {
    const w = 50, h = 45;
    const tiles = createTileGrid(w, h, 'X');
    addBorder(tiles, 0, 0, w - 1, h - 1, 'W');
    // Floating platforms
    addRect(tiles, 10, 5, 20, 15, 'A');
    addRect(tiles, 30, 5, 40, 15, 'A');
    addRect(tiles, 15, 20, 35, 30, 'R');
    addRect(tiles, 10, 35, 40, 42, 'A');
    // Bridges
    addRect(tiles, 20, 1, 24, 5, 'P');
    addRect(tiles, 20, 15, 30, 17, 'P');
    addRect(tiles, 22, 17, 24, 20, 'P');
    addRect(tiles, 22, 30, 24, 35, 'P');
    // Lava pits
    addRect(tiles, 22, 22, 28, 28, 'L');

    return {
        name: 'Abismo Maldito', sub: 'Área 8', w, h, tiles,
        playerStart: { x: 22, y: 3 },
        npcs: [],
        enemies: [
            { x: 15, y: 10, preset: 'cursed_spirit', name: 'Horror Abissal', hp: 400, atk: 35, exp: 200, respawn: true },
            { x: 35, y: 10, preset: 'cursed_spirit', name: 'Horror Abissal', hp: 400, atk: 35, exp: 200, respawn: true },
            { x: 25, y: 25, preset: 'cursed_spirit', name: 'Entidade Suprema', hp: 500, atk: 40, exp: 250, respawn: true },
            { x: 20, y: 38, preset: 'cursed_spirit', name: 'Pesadelo Vivo', hp: 450, atk: 38, exp: 220, respawn: true },
            { x: 35, y: 38, preset: 'cursed_spirit', name: 'Pesadelo Vivo', hp: 450, atk: 38, exp: 220, respawn: true },
        ],
        portals: [
            { x: 22, y: 0, toArea: 7, toX: 22, toY: 38, label: 'Área 7 - Ruínas' },
        ],
        torches: []
    };
}

// Check if a tile is solid (blocks movement)
function isSolid(type) {
    return type === 'W' || type === 'B' || type === 'O' || type === 'T' || type === 't' || type === 'w' || type === 'L';
}

function getTile(x, y) {
    const map = G.maps[G.currentArea];
    if (!map) return 'W';
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (tx < 0 || ty < 0 || ty >= map.h || tx >= map.w) return 'W';
    return map.tiles[ty][tx];
}
