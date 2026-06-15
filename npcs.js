// ═══════════════════════════════════════
// NPC & DIALOGUE SYSTEM
// ═══════════════════════════════════════

class NPC {
    constructor(data) {
        this.x = data.x * T;
        this.y = data.y * T;
        this.preset = data.preset || 'npc_student';
        this.name = data.name || 'NPC';
        this.id = data.id || '';
        this.dialogue = data.dialogue || ['...'];
        this.dir = 0;
        this.frame = 0;
        this.interactRange = 50;
        this.hasQuest = false;
    }

    update(dt) {
        // Face player if nearby
        const p = G.player;
        const d = dist({x:this.x+T/2,y:this.y+T/2}, {x:p.centerX,y:p.centerY});
        if (d < this.interactRange * 1.5) {
            const angle = Math.atan2(p.centerY-(this.y+T/2), p.centerX-(this.x+T/2));
            if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle)))
                this.dir = Math.cos(angle) > 0 ? 3 : 2;
            else
                this.dir = Math.sin(angle) > 0 ? 0 : 1;
        }
        // Check quest availability
        this.hasQuest = this.checkQuestAvailable();
    }

    checkQuestAvailable() {
        if (this.id === 'instructor') {
            return G.quests.punch.status === 'available' || (G.quests.punch.status === 'active' && G.quests.punch.kills >= 5);
        }
        if (this.id === 'dojo_master') {
            return G.quests.dojo.status !== 'complete';
        }
        if (this.id === 'old_master') {
            return G.quests.sixEyes.status === 'available';
        }
        if (this.id === 'domain_master') {
            return G.quests.domain.status === 'available' || G.quests.domain.stage === 1;
        }
        if (this.id === 'clan_shop' || this.id === 'special_shop') {
            return true;
        }
        return false;
    }

    interact() {
        const p = G.player;
        const d = dist({x:this.x+T/2,y:this.y+T/2}, {x:p.centerX,y:p.centerY});
        if (d > this.interactRange) return false;

        // Charged punch starter quest
        if (this.id === 'instructor') {
            if (G.quests.punch.status === 'available') {
                startDialogue(this.name, [
                    'TREINE DE VERDADE.',
                    'Quero ver seu punho amaldiçoado.',
                    'Vá ao Campo de Treinamento (Área 2) e derrote 5 espíritos.',
                    'Volte aqui e eu te ensino o SOC0 CARREGADO.'
                ], () => {
                    G.quests.punch.status = 'active';
                    G.quests.punch.kills = 0;
                    notify('👊 Missão iniciada: derrote 5 espíritos na Área 2!');
                });
                return true;
            }
            if (G.quests.punch.status === 'active' && G.quests.punch.kills >= 5) {
                startDialogue(this.name, [
                    'Bom. Você tem disciplina.',
                    'Agora canalize energia no punho...',
                    'Pressione 5 sem arma equipada: SOC0 CARREGADO!'
                ], () => {
                    G.quests.punch.status = 'complete';
                    G.abilities.chargedPunch = true;
                    updateSkillSlots();
                    notify('👊 Soco Carregado desbloqueado!');
                });
                return true;
            }
        }

        // Forest dojo quest chain (5 sequential missions)
        if (this.id === 'dojo_master') {
            const q = G.quests.dojo;
            if (q.status === 'available') {
                startDialogue(this.name, [
                    'Você quer ficar mais forte?',
                    'Então complete 5 provas, uma por vez.',
                    'Prova 1: derrote 3 espíritos aqui na Floresta.',
                    'Volte pra mim quando terminar.'
                ], () => {
                    q.status = 'active';
                    q.stage = 0;
                    q.kills = 0;
                    notify('🥋 Dojo: Prova 1 iniciada (3 kills na Área 3).');
                });
                return true;
            }
            if (q.status === 'active') {
                const reqs = [3,5,7,10,15];
                const req = reqs[q.stage] || 3;
                if ((q.kills || 0) >= req) {
                    const next = q.stage + 1;
                    if (next >= 5) {
                        startDialogue(this.name, [
                            'Você completou todas as provas.',
                            'Agora suas técnicas evoluem.',
                            'Habilidades 5 e 6: forma V2.',
                            'E seu dash fica mais forte.'
                        ], () => {
                            q.status = 'complete';
                            G.abilities.baseSkillsV2 = true;
                            G.abilities.dashV2 = true;
                            G.abilities.basicSkill6 = true;
                            updateSkillSlots();
                            notify('✅ Dojo completo! Skills V2 + Dash V2 desbloqueados!');
                        });
                        return true;
                    }
                    startDialogue(this.name, [
                        `Prova ${q.stage + 1} concluída.`,
                        `Prova ${next + 1}: derrote ${reqs[next]} espíritos na Floresta.`,
                        'Volte aqui depois.'
                    ], () => {
                        q.stage = next;
                        q.kills = 0;
                        notify(`🥋 Dojo: Prova ${next + 1} iniciada (${reqs[next]} kills na Área 3).`);
                    });
                    return true;
                }
                startDialogue(this.name, [
                    `Você ainda não terminou a Prova ${q.stage + 1}.`,
                    `Progresso: ${q.kills || 0}/${req}.`,
                    'Continue.'
                ]);
                return true;
            }
        }

        // Gatekeeper Gojo (Area 3 -> 4 requirement: at least belt from mission 3)
        if (this.id === 'gojo_gate') {
            const q = G.quests.dojo;
            const hasThirdBelt = q && (q.status === 'complete' || q.stage >= 3); // stage 3 means you already cleared mission 3
            if (!hasThirdBelt) {
                startDialogue(this.name, [
                    'Hmm...',
                    'Você está indo bem, mas ainda não.',
                    'Complete pelo menos a 3ª faixa do Dojo da Floresta.',
                    'Aí sim você estará forte o suficiente para seguir pelos Portões.'
                ]);
                return true;
            }
            startDialogue(this.name, [
                'Olha só...',
                'Você tá indo muito bem.',
                'Você já tá forte o suficiente pra ir pra lá.',
                'Boa sorte.'
            ]);
            return true;
        }

        // Ice pillar: accept Gojo route (genocida)
        if (this.id === 'ice_pillar') {
            if (G.gojoRoute && G.gojoRoute.unlocked) {
                startDialogue(this.name, [
                    'O pilar já respondeu ao seu desejo.',
                    'Volte aos Portões (Área 4).'
                ]);
                return true;
            }
            if (G.gojoRoute && G.gojoRoute.decided && !G.gojoRoute.accepted) {
                startDialogue(this.name, [
                    'Você recusou o pacto.',
                    'A rota alternativa permanece selada.'
                ]);
                return true;
            }
            startDialogue(this.name, [
                'Um frio atravessa sua espinha...',
                'O pilar pede um nome: "GOJO".',
                'No pedestal há um papel antigo.',
                'Aceitar este pedido mudará seu destino.',
                '[E] aceitar / [Q] recusar'
            ], () => {
                // Give pact item once
                if (!G.inventory.find(i => i.id === 'gojo_pact')) {
                    const pact = ITEMS_DB.find(i => i.id === 'gojo_pact');
                    if (pact) G.inventory.push({ ...pact });
                    notify('📜 Você obteve o Papel do Pacto.');
                }
                // Choice via dialogue keys
                G.dialogueChoice = {
                    onAccept: () => {
                        G.gojoRoute.decided = true;
                        G.gojoRoute.unlocked = true;
                        G.gojoRoute.accepted = true;
                        notify('⚠️ Rota alternativa aceita. Vá aos Portões (Área 4).');
                    },
                    onReject: () => {
                        G.gojoRoute.decided = true;
                        G.gojoRoute.unlocked = false;
                        G.gojoRoute.accepted = false;
                        notify('Você recusou o pacto. O portão de Gojo permanece fechado.');
                    }
                };
                const hint = document.querySelector('#dialogue-box .dialogue-hint');
                if (hint) hint.textContent = '[E] aceitar / [Q] recusar';
            });
            return true;
        }

        // Special quest interactions
        if (this.id === 'old_master' && G.quests.sixEyes.status === 'available') {
            startDialogue(this.name, [
                'Você atingiu o nível necessário...',
                'É hora de comungar com o espírito guardião.',
                'Feche os olhos... sinta a energia...',
                'Um inimigo surge! Derrote-o para despertar os 6 Olhos!'
            ], () => {
                G.quests.sixEyes.status = 'active';
                if (!G.maps[14]) G.maps[14] = generateMap(14);
                G.pendingBoss = 'sixEyes';
                const ps = G.maps[14].playerStart;
                changeArea(14, ps.x, ps.y, 'Santuário dos 6 Olhos');
            });
            return true;
        }

        if (this.id === 'domain_master') {
            // New requirement: only 6 Olhos + level 50
            if (!G.abilities.sixEyes || G.player.level < 50) {
                startDialogue(this.name, [
                    'Expansão de Domínio não é brincadeira.',
                    'Requisitos: 👁️ 6 Olhos e nível 50.',
                    'Volte quando estiver pronto.'
                ]);
                return true;
            }
            if (!G.abilities.domain) {
                startDialogue(this.name, [
                    'Você atingiu o nível necessário...',
                    'E seus 6 Olhos enxergam além do véu.',
                    'Agora... desperte a Expansão de Domínio.'
                ], () => {
                    G.abilities.domain = true;
                    G.quests.domain.status = 'complete';
                    notify('🌪️ Expansão de Domínio desbloqueada!');
                    updateSkillSlots();
                });
                return true;
            }
        }

        // Clan shop (change clan for coins)
        if (this.id === 'clan_shop') {
            const cost = 300;
            startDialogue(this.name, [
                `Clã atual: ${G.clan || 'Sem Clã'}`,
                `Trocar clã custa 🪙 ${cost}.`,
                'Pressione [E] para confirmar (uma troca aleatória).'
            ], () => {
                if ((G.money || 0) < cost) { notify('🪙 Moedas insuficientes.'); return; }
                G.money -= cost;
                const clans = ['Gojo','Zenin','Kamo','Inumaki','Fushiguro','Sem Clã'];
                G.clan = clans[randInt(0, clans.length - 1)];
                notify(`🏷️ Novo clã: ${G.clan}`);
            });
            return true;
        }

        // Special shop: buy Domain + Hollow Purple
        if (this.id === 'special_shop') {
            const domainCost = 2000;
            const purpleCost = 5000;
            const canDomain = G.abilities.sixEyes && G.player && G.player.level >= 50;
            const canPurple = G.abilities.gojoDefeated;

            // Simple shop UX: first buy Domain, then Purple (if eligible)
            if (!G.specialsOwned.domain && canDomain) {
                startDialogue(this.name, [
                    `🌪️ Expansão de Domínio — custo 🪙 ${domainCost}`,
                    `Seu dinheiro: 🪙 ${G.money || 0}`,
                    'Você quer comprar?'
                ], () => {
                    if ((G.money || 0) < domainCost) { notify('🪙 Moedas insuficientes.'); return; }
                    G.money -= domainCost;
                    G.specialsOwned.domain = true;
                    notify('🌪️ Especial comprado: Domínio (equipe na aba Especiais)');
                });
                return true;
            }

            if (!G.specialsOwned.hollowPurple && canPurple) {
                startDialogue(this.name, [
                    `🟣 Hollow Purple — custo 🪙 ${purpleCost}`,
                    `Seu dinheiro: 🪙 ${G.money || 0}`,
                    'Você quer comprar?'
                ], () => {
                    if ((G.money || 0) < purpleCost) { notify('🪙 Moedas insuficientes.'); return; }
                    G.money -= purpleCost;
                    G.specialsOwned.hollowPurple = true;
                    notify('🟣 Especial comprado: Hollow Purple (equipe na aba Especiais)');
                });
                return true;
            }

            startDialogue(this.name, [
                `🪙 Moedas: ${G.money || 0}`,
                `🌪️ Domínio: ${G.specialsOwned.domain ? '✅' : canDomain ? `🪙 ${domainCost}` : '🔒 (req: 6 Olhos + Nv.50)'}`,
                `🟣 Purple: ${G.specialsOwned.hollowPurple ? '✅' : canPurple ? `🪙 ${purpleCost}` : '🔒 (req: derrotar Gojo)'}`,
                'Volte quando cumprir os requisitos.'
            ]);
            return true;
        }

        // Default dialogue
        startDialogue(this.name, this.dialogue);
        return true;
    }

    draw(ctx) {
        const sx = this.x - G.camera.x;
        const sy = this.y - G.camera.y;
        drawChar(ctx, this.preset, sx, sy, this.dir, this.frame);
        // Name tag
        ctx.fillStyle = '#c084fc';
        ctx.font = '10px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, sx + T/2, sy - 8);
        // Quest/interact indicator
        const p = G.player;
        const d = dist({x:this.x+T/2,y:this.y+T/2}, {x:p.centerX,y:p.centerY});
        if (d < this.interactRange) {
            drawInteractIcon(ctx, sx, sy);
        }
        if (this.hasQuest) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 16px Rajdhani';
            ctx.fillText('❗', sx + T/2, sy - 16 + Math.sin(G.time*3)*3);
        }
    }
}

// ── DIALOGUE SYSTEM ──
function startDialogue(name, lines, callback = null) {
    G.dialogueQueue = [...lines];
    G.dialogueActive = true;
    G.dialogueCallback = callback;
    G.paused = false; // Don't pause, but block input
    const box = document.getElementById('dialogue-box');
    box.classList.remove('hidden');
    document.getElementById('dialogue-name').textContent = name;
    showNextDialogue();
}

function showNextDialogue() {
    if (G.dialogueQueue.length === 0) {
        endDialogue();
        return;
    }
    const line = G.dialogueQueue.shift();
    const el = document.getElementById('dialogue-text');
    el.textContent = '';
    // Typewriter effect
    let i = 0;
    G._typeInterval = setInterval(() => {
        if (i < line.length) {
            el.textContent += line[i];
            i++;
        } else {
            clearInterval(G._typeInterval);
        }
    }, 30);
}

function endDialogue() {
    G.dialogueActive = false;
    document.getElementById('dialogue-box').classList.add('hidden');
    if (G._typeInterval) clearInterval(G._typeInterval);
    if (G.dialogueCallback) {
        const cb = G.dialogueCallback;
        G.dialogueCallback = null;
        cb();
    }
}

// ── CUTSCENE SYSTEM ──
function showCutscene(lines, callback = null) {
    G.cutsceneLines = lines;
    G.cutsceneIdx = 0;
    G.cutsceneCallback = callback;
    const el = document.getElementById('cutscene');
    el.classList.remove('hidden');
    document.getElementById('cutscene-text').textContent = lines[0];
}

function advanceCutscene() {
    G.cutsceneIdx++;
    if (G.cutsceneIdx >= G.cutsceneLines.length) {
        document.getElementById('cutscene').classList.add('hidden');
        if (G.cutsceneCallback) {
            const cb = G.cutsceneCallback;
            G.cutsceneCallback = null;
            cb();
        }
        return;
    }
    document.getElementById('cutscene-text').textContent = G.cutsceneLines[G.cutsceneIdx];
}

// ── DOMAIN EXPANSION WAVES ──
function startDomainWaves() {
    G.quests.domain.waves = 0;
    spawnDomainWave();
}

function spawnDomainWave() {
    G.quests.domain.waves++;
    const wave = G.quests.domain.waves;
    if (wave > 5) {
        notify('✅ 5 ondas concluídas! O Guardião aparece!');
        spawnDomainGuardian();
        return;
    }
    const mult = 1 + (wave - 1) * 0.2;
    notify(`⚔️ Onda ${wave}/5!`);
    for (let i = 0; i < 3 + wave; i++) {
        const e = new Enemy({
            x: Math.floor(G.player.x/T) + randInt(-5,5),
            y: Math.floor(G.player.y/T) + randInt(-5,5),
            preset: 'cursed_spirit', name: `Espírito Lv.${wave}`,
            hp: Math.floor(80 * mult), atk: Math.floor(10 * mult), exp: Math.floor(40 * mult)
        });
        G.entities.push(e);
    }
    // Check when all wave enemies die
    G._waveCheck = setInterval(() => {
        const alive = G.entities.filter(e => e.type === 'enemy' && !e.dead && !e.isBoss);
        if (alive.length === 0) {
            clearInterval(G._waveCheck);
            setTimeout(() => spawnDomainWave(), 2000);
        }
    }, 500);
}

// When the Six Eyes boss dies, clear trial state.

// ── SIX EYES TRIAL WAVES (arena 14) ──
function startSixEyesTrial() {
    G._sixEyesTrial = { wave: 0 };
    spawnSixEyesTrialWave();
}

function spawnSixEyesTrialWave() {
    if (!G._sixEyesTrial) G._sixEyesTrial = { wave: 0 };
    G._sixEyesTrial.wave++;
    const w = G._sixEyesTrial.wave;
    if (w > 4) {
        notify('✅ As ondas cessam... o Guardião aparece!');
        spawnSixEyesArenaFight();
        return;
    }
    notify(`👁️ Provação: Onda ${w}/4`);
    const mult = 1 + (w - 1) * 0.35;
    for (let i = 0; i < 4 + w; i++) {
        const e = new Enemy({
            x: Math.floor(G.player.x/T) + randInt(-6,6),
            y: Math.floor(G.player.y/T) + randInt(-4,4),
            preset: 'cursed_spirit', name: `Provação Lv.${w}`,
            hp: Math.floor(120 * mult), atk: Math.floor(14 * mult), exp: 0
        });
        e.aggroRange = 280;
        e.speed = 1.7 + w * 0.2;
        G.entities.push(e);
    }
    G._sixEyesWaveCheck = setInterval(() => {
        const alive = G.entities.filter(e => e.type === 'enemy' && !e.dead && !e.isBoss);
        if (alive.length === 0) {
            clearInterval(G._sixEyesWaveCheck);
            setTimeout(() => spawnSixEyesTrialWave(), 1400);
        }
    }, 400);
}
