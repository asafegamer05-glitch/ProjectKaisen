// ═══════════════════════════════════════
// SYSTEMS - Inventory, Quests, HUD, Area
// ═══════════════════════════════════════

// ── INVENTORY ──
function toggleInventory() {
    const el = document.getElementById('inventory-panel');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) renderInventory();
}

function setInventoryTab(tab) {
    G.inventoryTab = tab;
    renderInventory();
}

function renderInventory() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    const tab = G.inventoryTab || 'items';

    if (tab === 'specials') {
        // Specials equipment: slot 5 and slot 6
        const title = document.createElement('div');
        title.style.color = '#a78bfa';
        title.style.margin = '4px 0 10px 0';
        title.innerHTML = `<b>Equipe especiais nos slots 5/6</b>`;
        grid.appendChild(title);

        const makeRow = (label, slotKey) => {
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.gap = '10px';
            wrap.style.alignItems = 'center';
            wrap.style.flexWrap = 'wrap';

            const cur = G.specialsEquipped[slotKey];
            const curLabel = cur === 'domain' ? '🌪️ Domínio' : cur === 'hollowPurple' ? '🟣 Hollow Purple' : '—';
            const t = document.createElement('div');
            t.style.minWidth = '140px';
            t.style.color = '#e5e7eb';
            t.textContent = `${label}: ${curLabel}`;
            wrap.appendChild(t);

            const btnNone = document.createElement('button');
            btnNone.className = 'menu-btn';
            btnNone.innerHTML = `<span class="btn-text">Remover</span>`;
            btnNone.onclick = () => { G.specialsEquipped[slotKey] = null; updateSkillSlots(); renderInventory(); };
            wrap.appendChild(btnNone);

            const btnDomain = document.createElement('button');
            btnDomain.className = 'menu-btn';
            btnDomain.innerHTML = `<span class="btn-text">🌪️ Domínio</span>`;
            btnDomain.onclick = () => {
                if (!G.specialsOwned.domain) { notify('🔒 Você não possui Domínio.'); return; }
                G.specialsEquipped[slotKey] = 'domain'; updateSkillSlots(); renderInventory(); notify('Especial equipado!');
            };
            wrap.appendChild(btnDomain);

            const btnHP = document.createElement('button');
            btnHP.className = 'menu-btn';
            btnHP.innerHTML = `<span class="btn-text">🟣 Purple</span>`;
            btnHP.onclick = () => {
                if (!G.specialsOwned.hollowPurple) { notify('🔒 Você não possui Hollow Purple.'); return; }
                G.specialsEquipped[slotKey] = 'hollowPurple'; updateSkillSlots(); renderInventory(); notify('Especial equipado!');
            };
            wrap.appendChild(btnHP);

            return wrap;
        };

        grid.appendChild(makeRow('Slot 5', 'slot5'));
        grid.appendChild(makeRow('Slot 6', 'slot6'));

        const el = document.getElementById('inv-detail');
        if (el) {
            el.innerHTML = `<h4>⭐ Especiais</h4>
                <p>Você compra especiais na loja da Escola.</p>
                <p>Depois equipe aqui e use 5/6.</p>`;
        }
        return;
    }

    // "Equip fists" option
    const fists = document.createElement('div');
    fists.className = 'inv-item' + (!G.equipped ? ' equipped' : '');
    fists.innerHTML = `<div class="item-icon">👊</div><div class="item-name">Punhos</div>`;
    fists.onclick = () => {
        G.equipped = null;
        updateSkillSlots();
        renderInventory();
        notify('Punhos equipados!');
    };
    fists.onmouseenter = () => {
        const el = document.getElementById('inv-detail');
        el.innerHTML = `<h4>👊 Punhos</h4><p>Lutar sem arma. (Habilidades base 5/6 se estiverem desbloqueadas.)</p>`;
    };
    grid.appendChild(fists);
    // Show all items player has + locked ones
    for (const item of ITEMS_DB) {
        const owned = G.inventory.find(i => i.id === item.id);
        const div = document.createElement('div');
        div.className = 'inv-item' + (G.equipped && G.equipped.id === item.id ? ' equipped' : '');
        div.innerHTML = `<div class="item-icon">${owned ? item.icon : '🔒'}</div>
                         <div class="item-name">${owned ? item.name : '???'}</div>`;
        if (owned) {
            div.onclick = () => {
                G.equipped = owned;
                updateSkillSlots();
                renderInventory();
                notify(`${item.name} equipado!`);
            };
            div.onmouseenter = () => showItemDetail(item);
        }
        grid.appendChild(div);
    }
}

function showItemDetail(item) {
    const el = document.getElementById('inv-detail');
    el.innerHTML = `<h4>${item.icon} ${item.name}</h4>
        <p>${item.desc}</p>
        <p>Habilidade 1 (5): ${item.skill1.icon} ${item.skill1.name} - ${item.skill1.dmg > 0 ? item.skill1.dmg+' dano' : item.skill1.type} (${item.skill1.cost} poder)</p>
        <p>Habilidade 2 (6): ${item.skill2.icon} ${item.skill2.name} - ${item.skill2.dmg > 0 ? item.skill2.dmg+' dano' : item.skill2.type} (${item.skill2.cost} poder)</p>`;
}

function updateSkillSlots() {
    const s5 = document.getElementById('slot5-icon');
    const s6 = document.getElementById('slot6-icon');
    const n5 = document.getElementById('slot5-name');
    const n6 = document.getElementById('slot6-name');
    // If specials equipped, show them
    if (G.specialsEquipped && (G.specialsEquipped.slot5 || G.specialsEquipped.slot6)) {
        const s5spec = G.specialsEquipped.slot5;
        const s6spec = G.specialsEquipped.slot6;
        s5.textContent = s5spec === 'domain' ? '🌪️' : s5spec === 'hollowPurple' ? '🟣' : (G.abilities.chargedPunch ? '👊' : '🔒');
        n5.textContent = s5spec === 'domain' ? 'Domínio' : s5spec === 'hollowPurple' ? 'Purple' : (G.abilities.chargedPunch ? (G.abilities.baseSkillsV2 ? 'Soco Carregado V2' : 'Soco Carregado') : '???');
        s6.textContent = s6spec === 'domain' ? '🌪️' : s6spec === 'hollowPurple' ? '🟣' : (G.abilities.basicSkill6 ? '💢' : '🔒');
        n6.textContent = s6spec === 'domain' ? 'Domínio' : s6spec === 'hollowPurple' ? 'Purple' : (G.abilities.basicSkill6 ? (G.abilities.baseSkillsV2 ? 'Impacto Maldito V2' : 'Impacto Maldito') : '???');
        return;
    }

    if (G.abilities.domain) {
        s5.textContent = '🌀'; n5.textContent = 'Domínio';
        s6.textContent = '💥'; n6.textContent = 'Explosão';
    } else if (G.equipped) {
        s5.textContent = G.equipped.skill1.icon; n5.textContent = G.equipped.skill1.name;
        s6.textContent = G.equipped.skill2.icon; n6.textContent = G.equipped.skill2.name;
    } else if (G.abilities.chargedPunch) {
        s5.textContent = '👊'; n5.textContent = G.abilities.baseSkillsV2 ? 'Soco Carregado V2' : 'Soco Carregado';
        if (G.abilities.basicSkill6) {
            s6.textContent = '💢'; n6.textContent = G.abilities.baseSkillsV2 ? 'Impacto Maldito V2' : 'Impacto Maldito';
        } else {
            s6.textContent = '🔒'; n6.textContent = '???';
        }
    } else {
        s5.textContent = '🔒'; n5.textContent = '???';
        s6.textContent = '🔒'; n6.textContent = '???';
    }
}

// ── QUEST LOG ──
function toggleQuestLog() {
    const el = document.getElementById('quest-panel');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) renderQuestLog();
}

function renderQuestLog() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    const quests = [
        { key:'punch', title:'👊 Primeiro Poder: Soco Carregado', desc:getPunchDesc() },
        { key:'dojo', title:'🥋 Dojo da Floresta', desc:getDojoDesc() },
        { key:'caveScroll', title:'📜 Segredo da Caverna', desc:getCaveScrollDesc() },
        { key:'arenaSwitches', title:'🧩 Selo da Arena', desc:getArenaSwitchesDesc() },
        { key:'sixEyes', title:'👁️ Quest dos 6 Olhos', desc:getSixEyesDesc() },
        { key:'mahoraga', title:'🌀 Quest de Mahoraga', desc:getMahoragaDesc() },
        { key:'domain', title:'🌪️ Expansão de Domínio', desc:getDomainDesc() },
        { key:'gojo', title:'⚔️ Batalha: Satoru Gojo', desc:getGojoDesc() },
        { key:'sukuna', title:'👹 Batalha Final: Sukuna', desc:getSukunaDesc() },
    ];
    for (const q of quests) {
        const status = G.quests[q.key].status;
        if (status === 'locked') continue;
        const div = document.createElement('div');
        div.className = 'quest-entry ' + status;
        div.innerHTML = `<h4>${q.title} ${status === 'complete' ? '✅' : ''}</h4><p>${q.desc}</p>`;
        list.appendChild(div);
    }
    if (list.children.length === 0) {
        list.innerHTML = '<p style="color:#6b7280;text-align:center">Nenhuma missão disponível ainda.<br>Treine e suba de nível!</p>';
    }
}

function getPunchDesc() {
    const q = G.quests.punch;
    if (q.status === 'available') return 'Fale com o Instrutor Todo na Escola (Área 1) para começar.';
    if (q.status === 'active') return `Derrote 5 espíritos no Campo de Treinamento (Área 2). Progresso: ${q.kills}/5`;
    return 'Soco Carregado desbloqueado! Use o botão 5 sem item equipado.';
}

function getDojoDesc() {
    const q = G.quests.dojo;
    if (q.status === 'available') return 'Encontre o Mestre do Dojo na Floresta (Área 3).';
    if (q.status === 'active') {
        const req = [3,5,7,10,15][q.stage] || 3;
        return `Missão ${q.stage + 1}/5: derrote ${req} espíritos na Floresta (Área 3). Progresso: ${q.kills}/${req}`;
    }
    return 'Dojo concluído! Habilidades 5/6 V2 + dash mais forte desbloqueados.';
}

function getCaveScrollDesc() {
    const q = G.quests.caveScroll;
    if (q.status === 'available') return 'Encontre o pergaminho escondido na Área 5. (Não é de kill.)';
    return 'Pergaminho encontrado! +10% de poder máximo permanente.';
}

function getArenaSwitchesDesc() {
    const q = G.quests.arenaSwitches;
    if (q.status === 'available') return 'Ative 4 selos (switches) na Arena Gigante (Área 6).';
    return 'Selo completo! Recuperação de poder melhorada.';
}

function getSixEyesDesc() {
    const q = G.quests.sixEyes;
    if (q.status === 'available') return 'Fale com o Mestre Ancião na Escola (Área 1). Requer nível 25.';
    if (q.status === 'active') return 'Sobreviva às ondas no Santuário para despertar os 6 Olhos!';
    return '6 Olhos desbloqueados! 8 esquivas automáticas a cada 30s.';
}
function getMahoragaDesc() {
    const q = G.quests.mahoraga;
    if (q.status === 'available') return 'Vá até a Área 4 e derrote Geto nos portões.';
    if (q.status === 'active') {
        if (q.stage <= 1) return `Acenda as tochas na caverna (${q.torchesLit||0}/5). Use a Espada de Fogo.`;
        if (q.stage === 2) return 'Tochas acesas! Vá até a Arena de Mahoraga na Área 5.';
    }
    return 'Mahoraga derrotado! Habilidade especial desbloqueada.';
}
function getDomainDesc() {
    const q = G.quests.domain;
    if (q.status === 'available') return 'Requer 👁️ 6 Olhos + nível 50. Fale com o Mestre de Domínio na Área 5.';
    return 'Expansão de Domínio desbloqueada!';
}
function getGojoDesc() {
    const q = G.quests.gojo;
    if (q.status === 'available') return 'Gojo espera na Arena Gigante (Área 6). 6 fases!';
    if (q.status === 'active') return `Lutando contra Gojo - Fase ${q.phase}/6`;
    return 'Satoru Gojo derrotado! Conquista desbloqueada!';
}
function getSukunaDesc() {
    const q = G.quests.sukuna;
    if (q.status === 'available') return 'Sukuna espera na parte inferior da Arena Gigante. 3 fases!';
    if (q.status === 'active') return `Lutando contra Sukuna - Fase ${q.phase}/3`;
    return 'Sukuna derrotado! Você é o Soberano da Maldição!';
}

// ── HUD UPDATE ──
function updateHUD() {
    const p = G.player;
    if (!p) return;
    document.getElementById('hud-name').textContent = p.name;
    document.getElementById('hud-level').textContent = `Nv.${p.level}`;
    const moneyEl = document.getElementById('hud-money');
    if (moneyEl) moneyEl.textContent = `🪙 ${G.money || 0}`;
    // HP
    const hpPct = (p.hp / p.maxHp * 100);
    document.getElementById('hp-fill').style.width = hpPct + '%';
    document.getElementById('hp-text').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
    // Power
    const pwPct = (p.power / p.maxPower * 100);
    document.getElementById('power-fill').style.width = pwPct + '%';
    document.getElementById('power-text').textContent = `${Math.ceil(p.power)}/${p.maxPower}`;
    // EXP
    const expPct = (p.exp / p.expToNext * 100);
    document.getElementById('exp-fill').style.width = expPct + '%';
    document.getElementById('exp-text').textContent = `${p.exp}/${p.expToNext}`;
    // Boss bar
    if (G.bossActive && !G.bossActive.dead) {
        const bPct = (G.bossActive.hp / G.bossActive.maxHp * 100);
        document.getElementById('boss-hp-fill').style.width = Math.max(0, bPct) + '%';
    }
    // Cooldowns
    updateCooldownOverlay('cd-dash', p.dashCooldown, 0.8);
    updateCooldownOverlay('cd-5', p.skill5Cooldown, 1.5);
    updateCooldownOverlay('cd-6', p.skill6Cooldown, 2);
    // Survival timer
    if (G.survivalActive) {
        const mins = Math.floor(G.survivalTimer / 60);
        const secs = Math.floor(G.survivalTimer % 60);
        document.getElementById('timer-val').textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
    }
    // Area name
    const map = G.maps[G.currentArea];
    if (map) document.getElementById('area-name').textContent = `${map.sub} — ${map.name}`;

    // Pantheon timer/status
    const pt = document.getElementById('pantheon-timer');
    if (pt) {
        if (G.pantheon && G.pantheon.active && G.pantheon.level === 2) {
            pt.classList.remove('hidden');
            const t = Math.max(0, Math.floor(G.pantheon.timer));
            const mins = Math.floor(t / 60);
            const secs = (t % 60).toString().padStart(2, '0');
            pt.textContent = `PANTEÃO L2  ${mins}:${secs}  ${G.pantheon.gotHit ? 'HIT' : 'NO-HIT'}`;
            // Fail immediately on first hit
            if (G.pantheon.gotHit) {
                notify('❌ Levou hit! Panteão L2 falhou.');
                G.pantheon.active = false;
                respawn();
                return;
            }
        } else {
            pt.classList.add('hidden');
            pt.textContent = '';
        }
    }
    // Buffs display
    const buffs = document.getElementById('hud-buffs');
    buffs.innerHTML = '';
    if (G.abilities.sixEyes) {
        buffs.innerHTML += `<div style="background:#0f0a1acc;border:1px solid #4fc3f7;border-radius:4px;padding:2px 8px;font-size:.7rem;color:#4fc3f7">👁️ ${G.abilities.sixEyesCharges}/8</div>`;
    }
    if (G.abilities.mahoragaActive) {
        buffs.innerHTML += `<div style="background:#0f0a1acc;border:1px solid #fbbf24;border-radius:4px;padding:2px 8px;font-size:.7rem;color:#fbbf24">🌀 ${Math.ceil(G.abilities.mahoragaTimer)}s</div>`;
    }
    if (G.abilities.domainActive) {
        buffs.innerHTML += `<div style="background:#0f0a1acc;border:1px solid #8b5cf6;border-radius:4px;padding:2px 8px;font-size:.7rem;color:#8b5cf6">🌪️ ${Math.ceil(G.abilities.domainTimer)}s</div>`;
    }
    if (G.invertControls) {
        buffs.innerHTML += `<div style="background:#0f0a1acc;border:1px solid #ef4444;border-radius:4px;padding:2px 8px;font-size:.7rem;color:#ef4444">⚠️ Invertido ${Math.ceil(G.invertTimer)}s</div>`;
    }
}

// ── PANTHEON ──
function startPantheon(level) {
    // Level 2 only after clearing level 1
    if (level === 2 && !(G.pantheon && G.pantheon.unlockedLevel2)) {
        const st = document.getElementById('pantheon-status');
        if (st) st.textContent = '🔒 Complete o Nível 1 para liberar o Nível 2.';
        return;
    }

    // Grant "all skills" for pantheon
    G.abilities.chargedPunch = true;
    G.abilities.basicSkill6 = true;
    G.abilities.baseSkillsV2 = true;
    G.abilities.dashV2 = true;
    G.abilities.sixEyes = true;
    G.abilities.sixEyesCharges = 8;
    G.abilities.sixEyesCooldown = 30;
    G.abilities.mahoraga = true;
    G.abilities.mahoragaReady = true;
    // Pantheon should NOT grant Gojo specials (Domain special / Hollow Purple).
    // Only allow the normal player domain system.
    G.specialsOwned.domain = false;
    G.specialsOwned.hollowPurple = false;
    G.specialsEquipped.slot5 = null;
    G.specialsEquipped.slot6 = null;
    G.abilities.domain = true;
    updateSkillSlots();

    G.pantheon.active = true;
    G.pantheon.level = level;
    G.pantheon.idx = 0;
    G.pantheon.noHit = (level === 2);
    G.pantheon.gotHit = false;
    G.pantheon.timer = (level === 2) ? 30 * 60 : 0;

    if (!G.maps[16]) G.maps[16] = generateMap(16);
    const ps = G.maps[16].playerStart;
    showScreen('game-screen');
    changeArea(16, ps.x, ps.y, 'Panteão');
}

function pantheonBossList() {
    // Order: trials/side -> main bosses
    return [
        { id: 'sixEyes', spawn: () => spawnSixEyesArenaFight() },
        { id: 'geto', spawn: () => spawnGetoFightArena() },
        { id: 'mahoraga', spawn: () => spawnMahoragaArenaFight() },
        { id: 'gojo', spawn: () => spawnGojoFightArena() },
        { id: 'sukuna', spawn: () => spawnSukunaFightArena() },
    ];
}

function pantheonStartNextBoss() {
    if (!G.pantheon.active) return;
    const list = pantheonBossList();
    if (G.pantheon.idx >= list.length) {
        // Completed
        G.pantheon.active = false;
        if (G.pantheon.level === 1) {
            G.pantheon.unlockedLevel2 = true;
            notify('🏛 Panteão Nível 1 concluído! Nível 2 liberado.');
        } else {
            notify('🏛 Panteão Nível 2 concluído! Você é insano.');
        }
        const st = document.getElementById('pantheon-status');
        if (st) st.textContent = G.pantheon.unlockedLevel2 ? '✅ Nível 2 liberado.' : '';
        return;
    }
    // Clear remaining enemies/projectiles
    G.entities = G.entities.filter(e => e.type === 'enemy' && e.isBoss && !e.dead);
    G.entities = G.entities.filter(e => e.type !== 'projectile');
    // Spawn next
    const entry = list[G.pantheon.idx];
    notify(`🏛 Panteão: Boss ${G.pantheon.idx + 1}/${list.length}`);
    entry.spawn();
}

// ── VIDEO CUTSCENE ──
function playVideoCutscene(src, onDone) {
    const wrap = document.getElementById('video-cutscene');
    const vid = document.getElementById('cutscene-video');
    if (!wrap || !vid) { if (onDone) onDone(); return; }
    // Block gameplay update during video to avoid lag/overlap.
    G.paused = true;
    wrap.classList.remove('hidden');
    vid.preload = 'auto';
    vid.src = src;
    vid.currentTime = 0;
    vid.volume = 0.9;
    vid.onended = () => {
        wrap.classList.add('hidden');
        vid.src = '';
        G.paused = false;
        if (onDone) onDone();
    };
    vid.play().catch(() => {
        // If autoplay blocked, just close
        wrap.classList.add('hidden');
        vid.src = '';
        G.paused = false;
        if (onDone) onDone();
    });
}

function updateCooldownOverlay(id, cd, maxCd) {
    const el = document.getElementById(id);
    if (!el) return;
    if (cd > 0) {
        el.classList.add('active');
        el.textContent = cd.toFixed(1);
    } else {
        el.classList.remove('active');
        el.textContent = '';
    }
}

// ── AREA TRANSITION ──
function changeArea(areaId, toX, toY, label) {
    if (G.areaTransition) return;
    G.areaTransition = true;
    const trans = document.getElementById('area-transition');
    const transName = document.getElementById('trans-name');
    const transSub = document.getElementById('trans-sub');
    trans.classList.remove('hidden');
    // Generate map if not cached
    if (!G.maps[areaId]) G.maps[areaId] = generateMap(areaId);
    const map = G.maps[areaId];
    transName.textContent = map.name;
    transSub.textContent = map.sub;
    setTimeout(() => {
        G.currentArea = areaId;
        G.player.x = toX * T;
        G.player.y = toY * T;
        loadAreaEntities(areaId);
        setTimeout(() => {
            trans.classList.add('hidden');
            G.areaTransition = false;
            // Area 6 is a normal exploration map (no auto boss trigger).
            // Spawn pending boss after teleport to arenas
            if (G.pendingBoss) {
                const pb = G.pendingBoss;
                G.pendingBoss = null;
                if (pb === 'geto' && areaId === 9) spawnGetoFightArena();
                if (pb === 'gojo' && areaId === 10) spawnGojoFightArena();
                if (pb === 'sukuna' && areaId === 11) spawnSukunaFightArena();
                if (pb === 'mahoraga' && areaId === 12) spawnMahoragaArenaFight();
                if (pb === 'sixEyes' && areaId === 14) startSixEyesTrial();
            }
            // Pantheon: spawn first boss when arena loads
            if (areaId === 16 && G.pantheon && G.pantheon.active && !G.bossActive) {
                setTimeout(() => pantheonStartNextBoss(), 400);
            }
        }, 500);
    }, 1000);
}

function loadAreaEntities(areaId) {
    const map = G.maps[areaId];
    if (!map) return;
    // Area transitions should not keep old bosses alive across maps.
    // This was blocking new boss triggers because G.bossActive stayed set.
    if (!G.pantheon || !G.pantheon.active) {
        G.entities = [];
        if (G.bossActive) {
            G.bossActive = null;
            const bar = document.getElementById('boss-bar');
            if (bar) bar.classList.add('hidden');
        }
    } else {
        // Pantheon keeps its own controlled flow.
        G.entities = G.entities.filter(e => e.isBoss && !e.dead);
    }
    G.npcs = [];
    // Spawn NPCs
    for (const npcData of map.npcs) {
        G.npcs.push(new NPC(npcData));
    }
    // Spawn enemies
    for (const eData of map.enemies) {
        const e = new Enemy(eData);
        G.entities.push(e);
    }
    // Auto spawn Geto in area 4
    if (areaId === 4 && map.bossSpawn && G.quests.mahoraga.status !== 'complete' && !G.entities.find(e => e.bossId === 'geto')) {
        G.quests.mahoraga.status = 'available';
    }

    // Auto spawn Sukuna when entering his arena (normal ending route)
    if (areaId === 11 && !G.abilities.sukunaDefeated && !G.bossActive) {
        setTimeout(() => {
            if (G.currentArea !== 11 || G.bossActive) return;
            spawnSukunaFightArena();
        }, 300);
    }
}

// (Intentionally removed) checkArea6Bosses: Area 6 is exploration-only.

// ── SIX EYES REGEN ──
function updateSixEyesRegen(dt) {
    if (!G.abilities.sixEyes) return;
    // Start cooldown as soon as you spend any charge
    if (G.abilities.sixEyesCharges < 8 && G.abilities.sixEyesCooldown <= 0) {
        G.abilities.sixEyesCooldown = 30;
    }
    if (G.abilities.sixEyesCooldown > 0) {
        G.abilities.sixEyesCooldown -= dt;
    } else if (G.abilities.sixEyesCharges < 8) {
        G.abilities.sixEyesCharges = 8;
        G.abilities.sixEyesCooldown = 30;
        notify('👁️ 6 Olhos recarregados!');
    }
    if (G.abilities.sixEyesCharges <= 0 && G.abilities.sixEyesCooldown <= 0) {
        G.abilities.sixEyesCooldown = 30;
    }
}

// ── SURVIVAL TIMER ──
function updateSurvivalTimer(dt) {
    if (!G.survivalActive) return;
    G.survivalTimer -= dt;
    if (G.survivalTimer <= 0) {
        G.survivalActive = false;
        document.getElementById('survival-timer').classList.add('hidden');
        // Kill Mahoraga (survival complete)
        if (G.bossActive && G.bossActive.bossId === 'mahoraga_boss') {
            G.bossActive.hp = 0;
            G.bossActive.die();
        }
    }
}

// ── GAME OVER / RESPAWN ──
function gameOver() {
    document.getElementById('game-over').classList.remove('hidden');
    G.paused = true;
}

function respawn() {
    document.getElementById('game-over').classList.add('hidden');
    G.paused = false;
    const p = G.player;
    p.hp = p.maxHp;
    p.power = p.maxPower;
    G.hpReduction = 0;
    G.invertControls = false;
    G.gojoDomainActive = false;
    G.gojoDomainTimer = 0;
    // Go back to area start
    if (!G.maps[1]) G.maps[1] = generateMap(1);
    G.currentArea = 1;
    const map = G.maps[1];
    p.x = map.playerStart.x * T;
    p.y = map.playerStart.y * T;
    loadAreaEntities(1);
    // Clear boss state
    if (G.bossActive) {
        G.bossActive.dead = true;
        G.bossActive = null;
        document.getElementById('boss-bar').classList.add('hidden');
    }
    G.survivalActive = false;
    document.getElementById('survival-timer').classList.add('hidden');
    // Remove projectiles
    G.entities = G.entities.filter(e => e.type !== 'projectile');
}

// ── CODES / DEBUG ──
function applyCode() {
    const inp = document.getElementById('code-input');
    const out = document.getElementById('code-result');
    if (!inp || !out) return;
    const code = (inp.value || '').trim().toLowerCase();
    inp.value = '';
    if (!code) { out.textContent = 'Digite um código.'; return; }
    if (code === 'debugmode') {
        G.debugMode = !G.debugMode;
        out.textContent = G.debugMode ? '✅ Debug Mode ativado!' : '❌ Debug Mode desativado!';
        notify(out.textContent);
        // If already in game, reveal dev menu button behavior via hotkey
        return;
    }
    out.textContent = 'Código inválido.';
}

function toggleDevMenu() {
    if (!G.debugMode) { notify('⚠️ Ative debugmode nas opções.'); return; }
    const el = document.getElementById('dev-menu');
    if (!el) return;
    el.classList.toggle('hidden');
}

function devToggleInvincible() {
    if (!G.debugMode) return;
    G.abilities.invincible = !G.abilities.invincible;
    notify(G.abilities.invincible ? '🛡️ Invencibilidade ON' : '🛡️ Invencibilidade OFF');
}

function devAddLevel(delta) {
    if (!G.debugMode || !G.player) return;
    if (delta > 0) {
        for (let i = 0; i < delta; i++) G.player.levelUp();
    } else {
        G.player.level = Math.max(1, G.player.level + delta);
        // Recompute stats from level
        G.player.maxHp = Math.floor(100 * Math.pow(1.05, G.player.level - 1));
        G.player.maxPower = Math.floor(100 * Math.pow(1.04, G.player.level - 1));
        G.player.hp = Math.min(G.player.hp, G.player.maxHp);
        G.player.power = Math.min(G.player.power, G.player.maxPower);
        G.player.atk = 10 + G.player.level * 2;
        G.player.expToNext = Math.floor(100 * Math.pow(1.3, G.player.level - 1));
        notify(`Level ajustado: ${G.player.level}`);
    }
    updateHUD();
}

function devGiveItem(id) {
    if (!G.debugMode) return;
    const item = ITEMS_DB.find(i => i.id === id);
    if (!item) return;
    if (!G.inventory.find(i => i.id === id)) G.inventory.push({ ...item });
    G.equipped = G.inventory.find(i => i.id === id) || null;
    updateSkillSlots();
    notify(`Item recebido: ${item.name}`);
}

function devClearItems() {
    if (!G.debugMode) return;
    G.inventory = [];
    G.equipped = null;
    updateSkillSlots();
    notify('Itens removidos.');
}

function devFullPower() {
    if (!G.debugMode || !G.player) return;
    G.player.hp = G.player.maxHp;
    G.player.power = G.player.maxPower;
    notify('HP/Poder restaurados.');
}

function devWarp() {
    if (!G.debugMode) return;
    const sel = document.getElementById('dev-warp');
    const areaId = sel ? parseInt(sel.value, 10) : 1;
    if (!G.maps[areaId]) G.maps[areaId] = generateMap(areaId);
    const ps = G.maps[areaId].playerStart || { x: 22, y: 22 };
    changeArea(areaId, ps.x, ps.y, `Warp Área ${areaId}`);
    toggleDevMenu();
}

// ── ENDING ──
function showEnding() {
    const p = G.player;
    document.getElementById('ending-stats').innerHTML = `
        <p>🏷️ Nome: ${p.name}</p>
        <p>⭐ Nível Final: ${p.level}</p>
        <p>⚔️ Inimigos Derrotados: ${p.killCount}</p>
        <p>⏱️ Tempo de Jogo: ${Math.floor(p.playTime/60)}min ${Math.floor(p.playTime%60)}s</p>
    `;
    showScreen('ending-screen');
}
