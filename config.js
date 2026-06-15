'use strict';
// ═══════════════════════════════════════
// CONFIG & GAME STATE
// ═══════════════════════════════════════
const T = 32; // tile size
const CANVAS_W = () => window.innerWidth;
const CANVAS_H = () => window.innerHeight;

const COLORS = {
    cursed: '#8b5cf6', cursedDark: '#6d28d9', cursedLight: '#c084fc',
    fire: '#ef4444', fireGlow: '#f97316',
    ice: '#22d3ee', poison: '#22c55e', electric: '#fbbf24',
    hpBar: '#ef4444', powerBar: '#8b5cf6', expBar: '#22d3ee',
    bg: '#0a0014', uiBg: '#0f0a1a'
};

const TILE_COLORS = {
    W: '#1a1a2e', // wall
    B: '#252547', // building wall
    F: '#1b2a1b', // floor/grass
    G: '#1a3a1a', // darker grass
    P: '#3d3522', // path
    D: '#0d0d1a', // dark floor (cave)
    A: '#2a1a3a', // arena floor
    w: '#1a2a4a', // water
    T: '#0a1a0a', // tree top
    t: '#2a1a0a', // tree trunk
    d: '#4a3a1a', // door
    L: '#3a2a0a', // lava
    S: '#3a3a2a', // sand
    O: '#2a2a3a', // obstacle
    X: '#000',    // void
    R: '#2a1a1a', // red floor (boss)
    H: '#1a1a3a', // house floor
    g: '#223322', // light grass
    p: '#443322', // light path
    I: '#4a3a5a', // portal
};

// Items database
const ITEMS_DB = [
    { id:'fire_sword', name:'Espada de Fogo', icon:'🗡️🔥', desc:'Lâmina infundida com chamas malditas.',
      atk:15, skill1:{name:'Corte Flamejante',icon:'🔥',cost:10,dmg:25,type:'fire'},
      skill2:{name:'Pilar de Fogo',icon:'🌋',cost:10,dmg:40,type:'fire_aoe'} },
    { id:'armor', name:'Armadura Maldita', icon:'🛡️', desc:'Armadura que absorve energia maldita.',
      def:20, skill1:{name:'Escudo Maldito',icon:'🛡️',cost:10,dmg:0,type:'shield'},
      skill2:{name:'Reflexo de Dor',icon:'💥',cost:10,dmg:20,type:'reflect'} },
    { id:'amulet', name:'Amuleto Ancestral', icon:'📿', desc:'Amuleto dos antigos feiticeiros.',
      pow:10, skill1:{name:'Cura Ancestral',icon:'💚',cost:10,dmg:-30,type:'heal'},
      skill2:{name:'Purificação',icon:'✨',cost:10,dmg:35,type:'holy'} },
    { id:'gauntlet', name:'Manopla Sombria', icon:'🥊', desc:'Manopla que canaliza escuridão.',
      atk:12, skill1:{name:'Soco Sombrio',icon:'👊',cost:10,dmg:30,type:'dark'},
      skill2:{name:'Garra Noturna',icon:'🌑',cost:10,dmg:22,type:'dark_multi'} },
    { id:'ring', name:'Anel de Gelo', icon:'💍', desc:'Anel que congela inimigos.',
      spd:1, skill1:{name:'Estilhaço Gélido',icon:'❄️',cost:10,dmg:20,type:'ice'},
      skill2:{name:'Blizzard',icon:'🌨️',cost:10,dmg:35,type:'ice_aoe'} },
    { id:'cape', name:'Capa Elétrica', icon:'🧥', desc:'Capa tecida com relâmpagos.',
      spd:2, skill1:{name:'Raio',icon:'⚡',cost:10,dmg:28,type:'electric'},
      skill2:{name:'Tempestade',icon:'🌩️',cost:10,dmg:45,type:'electric_aoe'} },
    { id:'mountain_key', name:'Chave da Montanha', icon:'🗝️', desc:'Uma chave antiga obtida em um ritual.',
      atk:0, skill1:{name:'—',icon:'—',cost:0,dmg:0,type:'none'}, skill2:{name:'—',icon:'—',cost:0,dmg:0,type:'none'} },
    { id:'gojo_pact', name:'Papel do Pacto', icon:'📜', desc:'Um pacto frio oferecendo a rota alternativa.',
      atk:0, skill1:{name:'—',icon:'—',cost:0,dmg:0,type:'none'}, skill2:{name:'—',icon:'—',cost:0,dmg:0,type:'none'} },
];

// Game state - global mutable
const G = {
    screen: 'title',
    paused: false,
    time: 0,
    dt: 0,
    lastTime: 0,
    keys: {},
    mouse: { x: 0, y: 0, down: false, clicked: false },
    camera: { x: 0, y: 0 },
    cameraZoom: 1.45,
    player: null,
    entities: [],   // enemies, projectiles, particles
    npcs: [],
    portals: [],
    torches: [],     // for mahoraga quest
    currentArea: 1,
    maps: {},
    dialogueQueue: [],
    dialogueActive: false,
    dialogueCallback: null,
    cutsceneLines: [],
    cutsceneIdx: 0,
    dialogueChoice: null, // { onAccept, onReject }
    bossActive: null,
    survivalTimer: 0,
    survivalActive: false,
    lastAttackTime: 0,
    powerRegenTimer: 0,
    quests: {
        punch: { status: 'available', stage: 0, kills: 0 },
        dojo: { status: 'available', stage: 0, kills: 0 },
        caveScroll: { status: 'available', found: false },
        arenaSwitches: { status: 'available', on: 0 },
        sixEyes: { status: 'locked', stage: 0 },      // locked -> available -> active -> complete
        mahoraga: { status: 'locked', stage: 0, torchesLit: 0 },
        domain: { status: 'locked', stage: 0, fragments: { fire:false, ice:false, dark:false }, waves: 0 },
        gojo: { status: 'locked', phase: 0 },
        sukuna: { status: 'locked', phase: 0 }
    },
    abilities: {
        chargedPunch: false,
        baseSkillsV2: false,
        dashV2: false,
        basicSkill6: false,
        invincible: false,
        sixEyes: false, sixEyesCharges: 0, sixEyesCooldown: 0,
        mahoraga: false, mahoragaReady: true, mahoragaActive: false, mahoragaTimer: 0,
        domain: false,
        domainActive: false, domainTimer: 0,
        hollowPurple: false,
        gojoDefeated: false, sukunaDefeated: false
    },
    money: 0,
    clan: 'Sem Clã',
    specialsOwned: { domain: false, hollowPurple: false },
    specialsEquipped: { slot5: null, slot6: null },
    pantheon: {
        active: false,
        level: 0, // 1 or 2
        idx: 0,
        noHit: false,
        gotHit: false,
        timer: 0,
        unlockedLevel2: false,
    },
    inventory: [],
    equipped: null,
    screenShake: 0,
    areaTransition: false,
    notifications: [],
    damageNumbers: [],
    particles: [],
    invertControls: false,
    invertTimer: 0,
    hpReduction: 0,
    titleAnimT: 0,
    gojoDomainActive: false,
    gojoDomainTimer: 0,
    pendingBoss: null,
    levelPerKill: true,
    debugMode: false,
    gojoRoute: { unlocked: false, accepted: false, decided: false },
};

// Utility functions
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    G.screen = id;
}
function notify(text, duration = 3000) {
    G.notifications.push({ text, time: duration });
}
function spawnDamageNumber(x, y, val, type = '') {
    G.damageNumbers.push({ x, y, val, type, life: 1 });
}
