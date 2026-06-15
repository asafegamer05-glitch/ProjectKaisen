// ═══════════════════════════════════════
// GAME.JS - Main Loop, Rendering, Input
// ═══════════════════════════════════════

let canvas, ctx, miniCtx;

// ── RENDERING ──
function renderGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;

    const p = G.player;
    if (!p) return;

    // Camera zoom (closer view)
    const Z = G.cameraZoom || 1.45;

    // Camera follow player (centered)
    const viewW = canvas.width / Z;
    const viewH = canvas.height / Z;
    const targetCx = p.x + T/2 - viewW/2;
    const targetCy = p.y + T/2 - viewH/2;
    G.camera.x = lerp(G.camera.x, targetCx, 0.1);
    G.camera.y = lerp(G.camera.y, targetCy, 0.1);

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (G.screenShake > 0) {
        shakeX = rand(-3,3) * G.screenShake * 20;
        shakeY = rand(-3,3) * G.screenShake * 20;
    }

    ctx.save();
    ctx.scale(Z, Z);
    ctx.translate(shakeX / Z, shakeY / Z);

    // Draw tiles
    const map = G.maps[G.currentArea];
    if (map) {
        const startX = Math.max(0, Math.floor(G.camera.x / T) - 1);
        const startY = Math.max(0, Math.floor(G.camera.y / T) - 1);
        const endX = Math.min(map.w, startX + Math.ceil(viewW / T) + 3);
        const endY = Math.min(map.h, startY + Math.ceil(viewH / T) + 3);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const sx = x * T - G.camera.x;
                const sy = y * T - G.camera.y;
                drawTile(ctx, map.tiles[y][x], sx, sy);
            }
        }

        // Draw torches
        if (map.torches) {
            for (const torch of map.torches) {
                const sx = torch.x * T - G.camera.x;
                const sy = torch.y * T - G.camera.y;
                if (torch.lit) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(sx+T/2, sy+T/2, 8+Math.sin(G.time*5)*2, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#ff880044';
                    ctx.beginPath();
                    ctx.arc(sx+T/2, sy+T/2, 20, 0, Math.PI*2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#4a3a2a';
                    ctx.fillRect(sx+12, sy+4, 8, 24);
                    ctx.fillStyle = '#666';
                    ctx.fillRect(sx+10, sy+2, 12, 4);
                }
            }
        }

        // Draw fragments
        if (map.fragments) {
            for (const frag of map.fragments) {
                if (frag.collected) continue;
                const sx = frag.x * T - G.camera.x;
                const sy = frag.y * T - G.camera.y;
                const colors = { fire:'#ef4444', ice:'#22d3ee', dark:'#6d28d9' };
                const icons = { fire:'🔥', ice:'❄️', dark:'🌑' };
                ctx.fillStyle = (colors[frag.type] || '#fff') + '44';
                ctx.beginPath();
                ctx.arc(sx+T/2, sy+T/2, 14+Math.sin(G.time*3)*3, 0, Math.PI*2);
                ctx.fill();
                ctx.font = '18px serif';
                ctx.textAlign = 'center';
                ctx.fillText(icons[frag.type], sx+T/2, sy+T/2+6);
            }
        }

        // Draw portals
        for (const portal of map.portals) {
            const sx = portal.x * T - G.camera.x;
            const sy = portal.y * T - G.camera.y;
            ctx.fillStyle = '#8b5cf6';
            ctx.globalAlpha = 0.3 + Math.sin(G.time*2)*0.15;
            ctx.fillRect(sx, sy, T, T);
            ctx.globalAlpha = 1;
        }
    }

    // Draw NPCs (behind player if above)
    for (const npc of G.npcs) {
        if (npc.y <= p.y) npc.draw(ctx);
    }

    // Draw entities behind player
    for (const e of G.entities) {
        if (!e.dead && e.y <= p.y) e.draw(ctx);
    }

    // Draw player
    p.draw(ctx);

    // Draw entities in front of player
    for (const e of G.entities) {
        if (!e.dead && e.y > p.y) e.draw(ctx);
    }
    for (const npc of G.npcs) {
        if (npc.y > p.y) npc.draw(ctx);
    }

    // Draw particles
    for (const part of G.particles) {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.life;
        ctx.beginPath();
        ctx.arc(part.x - G.camera.x, part.y - G.camera.y, part.size, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Domain expansion visual
    if (G.abilities.domainActive) {
        ctx.strokeStyle = '#8b5cf644';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x+T/2-G.camera.x, p.y+T/2-G.camera.y, 150+Math.sin(G.time*2)*20, 0, Math.PI*2);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    ctx.restore();

    // Draw damage numbers (screen space)
    for (const dn of G.damageNumbers) {
        const sx = (dn.x - G.camera.x) * Z;
        const sy = (dn.y - G.camera.y - (1-dn.life)*40) * Z;
        ctx.globalAlpha = dn.life;
        ctx.font = dn.type === 'crit' ? 'bold 16px "Press Start 2P"' : dn.type === 'heal' ? 'bold 14px "Press Start 2P"' : '12px "Press Start 2P"';
        ctx.fillStyle = dn.type === 'crit' ? '#ef4444' : dn.type === 'heal' ? '#22c55e' : '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(typeof dn.val === 'number' ? '-'+dn.val : dn.val, sx, sy);
    }
    ctx.globalAlpha = 1;

    // Render minimap
    renderMinimap();
}

function renderMinimap() {
    const mc = document.getElementById('minimap-canvas');
    if (!mc) return;
    miniCtx = mc.getContext('2d');
    miniCtx.clearRect(0, 0, 140, 140);
    const map = G.maps[G.currentArea];
    if (!map) return;
    const scale = Math.min(140/map.w, 140/map.h);
    for (let y = 0; y < map.h; y++) {
        for (let x = 0; x < map.w; x++) {
            const tile = map.tiles[y][x];
            if (tile === 'W' || tile === 'B' || tile === 'O') miniCtx.fillStyle = '#333';
            else if (tile === 'w' || tile === 'L') miniCtx.fillStyle = tile === 'w' ? '#1a3a6a' : '#aa2200';
            else if (tile === 'A' || tile === 'R') miniCtx.fillStyle = '#2a1a3a';
            else if (tile === 'D') miniCtx.fillStyle = '#0a0a1a';
            else miniCtx.fillStyle = '#1a2a1a';
            miniCtx.fillRect(x*scale, y*scale, Math.ceil(scale), Math.ceil(scale));
        }
    }
    // Player dot
    const px = (G.player.x/T)*scale, py = (G.player.y/T)*scale;
    miniCtx.fillStyle = '#22d3ee';
    miniCtx.fillRect(px-2, py-2, 4, 4);
    // Enemy dots
    for (const e of G.entities) {
        if (e.dead || e.type !== 'enemy') continue;
        miniCtx.fillStyle = e.isBoss ? '#ef4444' : '#dc262688';
        miniCtx.fillRect((e.x/T)*scale-1, (e.y/T)*scale-1, 3, 3);
    }
    // NPC dots
    for (const npc of G.npcs) {
        miniCtx.fillStyle = '#22c55e';
        miniCtx.fillRect((npc.x/T)*scale-1, (npc.y/T)*scale-1, 3, 3);
    }
}

// ── TITLE SCREEN ──
function renderTitle() {
    const tc = document.getElementById('title-canvas');
    if (!tc) return;
    tc.width = window.innerWidth;
    tc.height = window.innerHeight;
    const tctx = tc.getContext('2d');
    G.titleAnimT += 0.016;
    // Particle background
    tctx.fillStyle = '#0a0014';
    tctx.fillRect(0, 0, tc.width, tc.height);
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(G.titleAnimT*0.5 + i*1.3) * 0.5 + 0.5) * tc.width;
        const y = (Math.cos(G.titleAnimT*0.3 + i*0.9) * 0.5 + 0.5) * tc.height;
        const r = 2 + Math.sin(G.titleAnimT + i) * 1.5;
        tctx.fillStyle = `rgba(139,92,246,${0.2+Math.sin(G.titleAnimT+i)*0.15})`;
        tctx.beginPath();
        tctx.arc(x, y, r, 0, Math.PI*2);
        tctx.fill();
    }
}

// ── UPDATE ──
function update(dt) {
    if (G.paused || G.areaTransition) return;
    if (G.dialogueActive || document.getElementById('cutscene').classList.contains('hidden') === false) return;

    G.time += dt;
    G.screenShake = Math.max(0, G.screenShake - dt);
    if (G.gojoDomainActive) {
        G.gojoDomainTimer -= dt;
        if (G.gojoDomainTimer <= 0) {
            G.gojoDomainActive = false;
            G.gojoDomainTimer = 0;
        }
    }

    const p = G.player;
    p.update(dt);

    // Pantheon level 2 timer
    if (G.pantheon && G.pantheon.active && G.pantheon.level === 2) {
        G.pantheon.timer -= dt;
        if (G.pantheon.timer <= 0) {
            G.pantheon.timer = 0;
            notify('⏱ Tempo esgotado! Panteão falhou.');
            G.pantheon.active = false;
            respawn();
            return;
        }
    }

    // Update entities
    for (const e of G.entities) {
        e.update(dt);
        // boss-local timers
        if (e && e.type === 'enemy' && e.isBoss && e.bossId === 'gojo') {
            if (e._gojoDashCd > 0) e._gojoDashCd -= dt;
            if (e._gojoEvadeCd > 0) e._gojoEvadeCd -= dt;
        }
        if (e && e.type === 'enemy' && e.isBoss && e.bossId === 'sukuna') {
            if (e._sukunaShrineTimer > 0) {
                e._sukunaShrineTimer -= dt;
                e._sukunaShrineTick -= dt;
                // Malevolent Shrine effect: periodic slash ring + damage zone
                if (e._sukunaShrineTick <= 0) {
                    e._sukunaShrineTick = 0.45;
                    const cx = e.x+T/2, cy = e.y+T/2;
                    for (let i = 0; i < 16; i++) {
                        const a = (Math.PI*2/16)*i + G.time*0.4;
                        G.entities.push(new Projectile(cx, cy, a, 5.5, Math.floor(e.atk*0.9), '#dc2626', 1.1));
                    }
                    const d = dist({x:cx,y:cy}, {x:p.centerX,y:p.centerY});
                    if (d < 150) p.takeDamage(Math.floor(e.atk * 0.45));
                }
                if (e._sukunaShrineTimer <= 0) {
                    e._sukunaShrineTimer = 0;
                }
            }
        }
    }
    // Remove dead non-respawning, dead projectiles
    G.entities = G.entities.filter(e => {
        if (e.type === 'projectile' && e.dead) return false;
        if (e.type === 'enemy' && e.dead && !e.respawn) return false;
        return true;
    });

    // Update NPCs
    for (const npc of G.npcs) npc.update(dt);

    // Update particles
    for (const part of G.particles) {
        part.x += part.dx * dt;
        part.y += part.dy * dt;
        part.life -= dt;
    }
    G.particles = G.particles.filter(p => p.life > 0);

    // Update damage numbers
    for (const dn of G.damageNumbers) dn.life -= dt * 1.2;
    G.damageNumbers = G.damageNumbers.filter(d => d.life > 0);

    // Update notifications
    for (const n of G.notifications) n.time -= dt * 1000;
    G.notifications = G.notifications.filter(n => n.time > 0);

    // Systems
    updateSixEyesRegen(dt);
    updateSurvivalTimer(dt);
    updateHUD();

    // Boss-specific triggers
    if (G.currentArea === 4 && !G.bossActive && G.quests.mahoraga.status === 'available') {
        const map = G.maps[4];
        if (map && map.bossSpawn) {
            const bp = map.bossSpawn;
            const d = dist({x:G.player.centerX,y:G.player.centerY}, {x:bp.x*T+T/2,y:bp.y*T+T/2});
            if (d < 100) {
                // Teleport to Geto arena (secondary area)
                G.pendingBoss = 'geto';
                changeArea(9, Math.floor(G.maps[9] ? G.maps[9].playerStart.x : 35), Math.floor(G.maps[9] ? G.maps[9].playerStart.y : 40), 'Arena de Geto');
            }
        }
    }
    // Mahoraga survival trigger in area 5
    if (G.currentArea === 5 && G.quests.mahoraga.stage >= 2 && !G.bossActive && !G.survivalActive
        && !G.abilities.mahoraga) {
        const d = dist({x:G.player.centerX,y:G.player.centerY}, {x:27*T+T/2,y:33*T+T/2});
        if (d < 100) {
            // Teleport to Mahoraga arena
            if (!G.maps[12]) G.maps[12] = generateMap(12);
            G.pendingBoss = 'mahoraga';
            const ps = G.maps[12].playerStart;
            changeArea(12, ps.x, ps.y, 'Arena de Mahoraga');
        }
    }
}

// ── GAME LOOP ──
function gameLoop(timestamp) {
    const dt = Math.min(0.05, (timestamp - G.lastTime) / 1000);
    G.lastTime = timestamp;
    G.dt = dt;

    if (G.screen === 'title-screen') renderTitle();
    if (G.screen === 'game-screen') {
        update(dt);
        renderGame();
    }

    requestAnimationFrame(gameLoop);
}

// ── INPUT ──
function setupInput() {
    document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        G.keys[key] = true;

        // Title screen
        if (G.screen === 'title-screen' && key === 'enter') {
            showScreen('character-creation');
            return;
        }

        // Game screen
        if (G.screen !== 'game-screen') return;

        // Dialogue choice mode (E accept / Q reject)
        if (G.dialogueActive && G.dialogueChoice) {
            if (key === 'e') {
                const c = G.dialogueChoice;
                G.dialogueChoice = null;
                const hint = document.querySelector('#dialogue-box .dialogue-hint');
                if (hint) hint.textContent = '[E] continuar';
                if (typeof c.onAccept === 'function') c.onAccept();
                return;
            }
            if (key === 'q') {
                const c = G.dialogueChoice;
                G.dialogueChoice = null;
                const hint = document.querySelector('#dialogue-box .dialogue-hint');
                if (hint) hint.textContent = '[E] continuar';
                if (typeof c.onReject === 'function') c.onReject();
                return;
            }
        }

        // Dialogue
        if (G.dialogueActive && key === 'e') {
            if (G._typeInterval) clearInterval(G._typeInterval);
            if (G.dialogueQueue.length > 0) showNextDialogue();
            else endDialogue();
            return;
        }

        // Cutscene
        if (!document.getElementById('cutscene').classList.contains('hidden') && key === 'enter') {
            advanceCutscene();
            return;
        }

        if (G.dialogueActive || !document.getElementById('cutscene').classList.contains('hidden')) return;

        // Pause
        if (key === 'escape') {
            togglePause();
            return;
        }
        if (G.paused) return;

        // Debug menu toggle
        if (key === 'f1') {
            e.preventDefault();
            if (typeof toggleDevMenu === 'function') toggleDevMenu();
            return;
        }

        // Attack
        if (key === 'j') G.player.attack();
        // Dash
        if (key === ' ') { e.preventDefault(); G.player.dash(); }
        // Skills
        if (key === '5') G.player.useSkill(5);
        if (key === '6') G.player.useSkill(6);
        // Interact
        if (key === 'e') {
            for (const npc of G.npcs) {
                if (npc.interact()) break;
            }
        }
        // Inventory
        if (key === 'i') toggleInventory();
        // Quest log
        if (key === 'q') toggleQuestLog();
        // Tab for map (prevent default)
        if (key === 'tab') e.preventDefault();
    });

    document.addEventListener('keyup', e => {
        G.keys[e.key.toLowerCase()] = false;
    });

    // Mouse attack
    document.addEventListener('mousedown', e => {
        if (G.screen === 'game-screen' && !G.paused && !G.dialogueActive && G.player) {
            G.player.attack();
        }
    });
}

function togglePause() {
    G.paused = !G.paused;
    document.getElementById('pause-menu').classList.toggle('hidden', !G.paused);
}

// ── START GAME ──
function startGame() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim() || 'Feiticeiro';
    G.player = new Player(name);

    // Generate area 1
    G.maps[1] = generateMap(1);
    const map = G.maps[1];
    G.player.x = map.playerStart.x * T;
    G.player.y = map.playerStart.y * T;
    G.currentArea = 1;
    G.camera.x = G.player.x - window.innerWidth/2;
    G.camera.y = G.player.y - window.innerHeight/2;

    loadAreaEntities(1);
    showScreen('game-screen');
    updateSkillSlots();

    // Tutorial cutscene
    showCutscene([
        `Bem-vindo à Escola de Feitiçaria, ${name}!`,
        'Você é um estudante recém-chegado de Jujutsu.',
        'Use WASD para se mover, J ou CLICK para atacar.',
        'Pressione E para interagir com NPCs.',
        'Pressione 5 e 6 para habilidades especiais.',
        'Treine, fique forte, e enfrente os maiores feiticeiros!',
        'Sua jornada começa agora! 🔥'
    ]);
}

// ── PREVIEW CHARACTER ──
function updatePreview() {
    const pc = document.getElementById('preview-canvas');
    if (!pc) return;
    const pctx = pc.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, 128, 128);
    pctx.save();
    pctx.scale(4, 4);
    const tmpC = document.createElement('canvas');
    tmpC.width = 32; tmpC.height = 32;
    const tmpCtx = tmpC.getContext('2d');
    drawCharSprite(tmpCtx, { ...CHAR_PRESETS.player, dir: 0, frame: Math.floor(Date.now()/500)%2 });
    pctx.drawImage(tmpC, 0, 0);
    pctx.restore();
}

// ── INIT ──
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    setupInput();
    G.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    // Preview animation
    setInterval(updatePreview, 300);
    updatePreview();
}

window.addEventListener('load', init);
window.addEventListener('resize', () => {
    if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
});
