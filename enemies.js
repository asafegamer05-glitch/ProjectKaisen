// ═══════════════════════════════════════
// ENEMY & BOSS CLASSES
// ═══════════════════════════════════════

class Enemy {
    constructor(data) {
        this.type = 'enemy';
        this.x = data.x * T;
        this.y = data.y * T;
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.preset = data.preset || 'cursed_spirit';
        this.name = data.name || 'Inimigo';
        this.maxHp = data.hp || 50;
        this.hp = this.maxHp;
        this.atk = data.atk || 5;
        this.exp = data.exp || 20;
        this.respawn = data.respawn || false;
        this.respawnTimer = 0;
        this.dead = false;
        this.dir = 0;
        this.frame = 0;
        this.frameTimer = 0;
        this.attackCooldown = 0;
        this.speed = 1.2;
        this.speedMult = 1;
        this.aggroRange = 150;
        this.attackRange = 36;
        this.hitFlash = 0;
        this.knockback = { x: 0, y: 0, time: 0 };
        this.isBoss = data.isBoss || false;
        this.bossId = data.bossId || null;
        this.phase = 1;
        this.maxPhases = data.maxPhases || 1;
        this.phaseHpThresholds = data.phaseHpThresholds || [];
        this.phaseTimer = 0;
        this.specialTimer = 0;
        this.specialCooldown = 0;
        this.invulnerable = false;
        this.clones = [];
        // Boss-specific state
        this._gojoDashCd = 0;
        this._gojoEvadeCd = 0;
        this._sukunaTeleportCd = 0;
        this._sukunaShrineTimer = 0;
        this._sukunaShrineTick = 0;
        this._sukunaCleaveCd = 0;
        this._getoSummonCd = 0;
        this._getoVolleyCd = 0;
        this._gojoPhase6Started = false;
        // Tactical movement state
        this._aiMode = 'approach'; // approach | retreat | strafe
        this._aiModeTimer = rand(0.8, 1.6);
        this._strafeDir = Math.random() < 0.5 ? -1 : 1;
    }

    takeDamage(dmg) {
        if (this.dead || this.invulnerable) return;
        this.hp -= dmg;
        this.hitFlash = 0.15;
        spawnDamageNumber(this.x, this.y, dmg);
        if (this.hp <= 0) {
            // Multi-life boss phases: phase only changes when HP hits 0
            if (this.isBoss && this.maxPhases > 1 && this.phase < this.maxPhases) {
                this.phase++;
                // brief reset between phases
                this.hp = this.maxHp;
                this.invulnerable = true;
                setTimeout(() => { this.invulnerable = false; }, 800);
                // clear projectiles to avoid cheap transitions
                G.entities = G.entities.filter(e => e.type !== 'projectile');
                this.onPhaseChange();
                return;
            }
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
        // Money drop
        const gain = this.isBoss ? 500 : Math.max(1, Math.floor((this.exp || 10) * 2));
        G.money = (G.money || 0) + gain;
        notify(`🪙 +${gain} moedas`);
        if (G.levelPerKill) {
            G.player.levelUp();
        } else {
            G.player.gainExp(this.exp);
        }
        G.player.killCount++;
        notify(`+${this.exp} EXP`);
        // Quest: charged punch kills in training grounds
        if (G.quests && G.quests.punch && G.quests.punch.status === 'active' && G.currentArea === 2 && !this.isBoss) {
            G.quests.punch.kills = Math.min(5, (G.quests.punch.kills || 0) + 1);
            if (G.quests.punch.kills >= 5) notify('✅ Volte ao Instrutor Todo para aprender o Soco Carregado!');
        }
        // Quest: dojo kills in forest
        if (G.quests && G.quests.dojo && G.quests.dojo.status === 'active' && G.currentArea === 3 && !this.isBoss) {
            const reqs = [3,5,7,10,15];
            const req = reqs[G.quests.dojo.stage] || 3;
            G.quests.dojo.kills = Math.min(req, (G.quests.dojo.kills || 0) + 1);
            if (G.quests.dojo.kills >= req) notify('✅ Prova do Dojo concluída! Volte ao Mestre do Dojo.');
        }
        // Drop particles
        for (let i = 0; i < 8; i++) {
            G.particles.push({
                x: this.x + T/2, y: this.y + T/2,
                dx: rand(-60, 60), dy: rand(-60, 60),
                color: '#8b5cf6', life: rand(0.3, 0.8), size: rand(3, 6)
            });
        }
        if (this.respawn) this.respawnTimer = 15;
        // Boss death handling
        if (this.isBoss) this.onBossDeath();
    }

    onPhaseChange() {
        G.screenShake = 0.4;
        // Silent phase transition - player just feels the power shift
        for (let i = 0; i < 15; i++) {
            G.particles.push({ x:this.x+T/2, y:this.y+T/2, dx:rand(-100,100), dy:rand(-100,100), color:'#c084fc', life:rand(0.5,1), size:rand(4,8) });
        }
        if (this.bossId === 'gojo') this.gojoPhaseEffect();
        if (this.bossId === 'sukuna') this.sukunaPhaseEffect();
        // Gojo phase 6: play video cutscene, then force Domain immediately once
        if (this.bossId === 'gojo' && this.phase === 6 && !this._gojoPhase6Started) {
            this._gojoPhase6Started = true;
            if (typeof playVideoCutscene === 'function') {
                // Freeze via cutscene overlay
                playVideoCutscene('gojo_cutscene.mp4', () => {
                    if (this.dead) return;
                    G.gojoDomainActive = true;
                    G.gojoDomainTimer = 6;
                    G.invertControls = true;
                    G.invertTimer = Math.max(G.invertTimer, 4);
                    G.screenShake = 0.5;
                    notify('🌪️ Gojo: Expansão de Domínio!');
                });
            } else {
                G.gojoDomainActive = true;
                G.gojoDomainTimer = 6;
            }
        }
        // Update boss HUD
        if (G.bossActive === this) {
            const phaseEl = document.getElementById('boss-phase');
            if (phaseEl) phaseEl.textContent = `Fase ${this.phase}/${this.maxPhases}`;
        }
    }

    onBossDeath() {
        document.getElementById('boss-bar').classList.add('hidden');
        G.bossActive = null;
        G.screenShake = 0.5;
        for (let i = 0; i < 30; i++) {
            G.particles.push({
                x: this.x + T/2, y: this.y + T/2,
                dx: rand(-150, 150), dy: rand(-150, 150),
                color: ['#fbbf24','#ef4444','#8b5cf6'][randInt(0,2)],
                life: rand(0.5, 2), size: rand(4, 10)
            });
        }
        if (this.bossId === 'geto') {
            notify('🏆 Geto derrotado! Espada de Fogo obtida!');
            if (!G.inventory.find(i => i.id === 'fire_sword')) {
                G.inventory.push({...ITEMS_DB[0]});
                G.equipped = G.inventory[0];
            }
            G.quests.mahoraga.status = 'active';
            G.quests.mahoraga.stage = 1;
        }
        if (this.bossId === 'mahoraga_boss') {
            notify('🏆 Você sobreviveu a Mahoraga!');
            G.abilities.mahoraga = true;
            G.abilities.mahoragaReady = true;
            G.quests.mahoraga.status = 'complete';
            G.player.power = G.player.maxPower;
            notify('🌀 Habilidade Mahoraga desbloqueada!');
            // Drop mountain key
            if (!G.inventory.find(i => i.id === 'mountain_key')) {
                const key = ITEMS_DB.find(i => i.id === 'mountain_key');
                if (key) G.inventory.push({ ...key });
                notify('🗝️ Você recebeu a Chave da Montanha!');
            }
        }
        if (this.bossId === 'six_eyes_boss') {
            G.abilities.sixEyes = true;
            G.abilities.sixEyesCharges = 8;
            G.quests.sixEyes.status = 'complete';
            notify('👁️ 6 Olhos desbloqueados! 8 esquivas automáticas a cada 30s!');
            if (G._sixEyesWaveCheck) { clearInterval(G._sixEyesWaveCheck); G._sixEyesWaveCheck = null; }
            G._sixEyesTrial = null;
        }
        if (this.bossId === 'domain_guardian') {
            G.abilities.domain = true;
            G.quests.domain.status = 'complete';
            notify('🌪️ Expansão de Domínio desbloqueada!');
        }
        if (this.bossId === 'gojo') {
            G.abilities.gojoDefeated = true;
            G.quests.gojo.status = 'complete';
            G.hpReduction = 0;
            G.invertControls = false;
            notify('🏆 SATORU GOJO DERROTADO!');
            notify('Cursed Energy Amplifier obtido! +20% geração de energia!');
            // Alternate ending (genocida route)
            showCutscene([
                '...',
                'o que você fez.......',
                '...',
                'o mundo ficou em silêncio.',
                'FINAL ALTERNATIVO (DEMO)'
            ], () => {
                // Back to title screen
                showScreen('title-screen');
            });
        }
        if (this.bossId === 'sukuna') {
            G.abilities.sukunaDefeated = true;
            G.quests.sukuna.status = 'complete';
            showCutscene([
                'Ryomen Sukuna, o Rei das Maldições, foi derrotado!',
                `${G.player.name}, você é agora o Soberano da Maldição!`,
                'Título obtido: "Soberano da Maldição"',
                'Resistência +15% permanente',
                'Sua jornada na demo chegou ao fim...',
                'Obrigado por jogar Jujutsu Kaisen: Cursed Legacy!'
            ], () => showEnding());
        }

        // Pantheon progression
        if (G.pantheon && G.pantheon.active && G.currentArea === 16) {
            setTimeout(() => {
                if (!G.pantheon.active) return;
                G.pantheon.idx++;
                if (typeof pantheonStartNextBoss === 'function') pantheonStartNextBoss();
            }, 800);
        }
    }

    update(dt) {
        if (this.dead) {
            if (this.respawn) {
                this.respawnTimer -= dt;
                if (this.respawnTimer <= 0) {
                    this.dead = false;
                    this.hp = this.maxHp;
                    this.x = this.spawnX;
                    this.y = this.spawnY;
                }
            }
            return;
        }
        this.hitFlash = Math.max(0, this.hitFlash - dt);
        if (this.knockback.time > 0) {
            this.knockback.time -= dt;
            const nx = this.x + this.knockback.x * dt * 200;
            const ny = this.y + this.knockback.y * dt * 200;
            if (!isSolid(getTile(nx + T/2, ny + T/2))) {
                this.x = nx; this.y = ny;
            }
            return;
        }
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.specialCooldown > 0) this.specialCooldown -= dt;

        // AI
        const p = G.player;
        const d = dist({ x: this.x + T/2, y: this.y + T/2 }, { x: p.centerX, y: p.centerY });

        if (d < this.aggroRange) {
            const angle = Math.atan2(p.centerY - (this.y + T/2), p.centerX - (this.x + T/2));
            const spd = this.speed * this.speedMult;
            const isBoss = this.isBoss;
            let vx = 0, vy = 0;

            // Tactical boss movement: approach / retreat / strafe
            if (isBoss) {
                this._aiModeTimer -= dt;
                if (this._aiModeTimer <= 0) {
                    const roll = Math.random();
                    if (roll < 0.45) this._aiMode = 'approach';
                    else if (roll < 0.72) this._aiMode = 'retreat';
                    else this._aiMode = 'strafe';
                    this._aiModeTimer = rand(0.7, 1.5);
                    if (Math.random() < 0.35) this._strafeDir *= -1;
                }

                // Distance-aware behavior
                if (d > this.attackRange * 2.1) this._aiMode = 'approach';
                if (d < this.attackRange * 0.9) this._aiMode = 'retreat';

                if (this._aiMode === 'approach') {
                    vx = Math.cos(angle); vy = Math.sin(angle);
                } else if (this._aiMode === 'retreat') {
                    vx = -Math.cos(angle); vy = -Math.sin(angle);
                } else { // strafe
                    vx = Math.cos(angle + this._strafeDir * Math.PI / 2);
                    vy = Math.sin(angle + this._strafeDir * Math.PI / 2);
                }
            } else {
                // Regular enemies keep simple chase
                vx = Math.cos(angle); vy = Math.sin(angle);
            }

            // Move if outside melee or if boss is repositioning
            if (d > this.attackRange || (isBoss && this._aiMode !== 'approach')) {
                const nx = this.x + vx * spd;
                const ny = this.y + vy * spd;
                if (!isSolid(getTile(nx + T/2, ny + T/2))) {
                    this.x = nx; this.y = ny;
                }
                // Direction faces player (cleaner readability)
                if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
                    this.dir = Math.cos(angle) > 0 ? 3 : 2;
                } else {
                    this.dir = Math.sin(angle) > 0 ? 0 : 1;
                }
                this.frameTimer += dt;
                if (this.frameTimer > 0.25) { this.frame = (this.frame+1)%4; this.frameTimer = 0; }
            } else if (this.attackCooldown <= 0) {
                // Attack
                this.attackCooldown = this.isBoss ? 1.5 : 2;
                p.takeDamage(this.atk);
                // Knockback player
                const kbAngle = Math.atan2(p.centerY - (this.y+T/2), p.centerX - (this.x+T/2));
                p.x += Math.cos(kbAngle) * 15;
                p.y += Math.sin(kbAngle) * 15;
            }

            // Boss special attacks
            if (this.isBoss) this.bossAI(dt, d);
        }
    }

    bossAI(dt, distToPlayer) {
        if (this.specialCooldown > 0) return;
        if (this.bossId === 'gojo') this.gojoAI(dt, distToPlayer);
        else if (this.bossId === 'sukuna') this.sukunaAI(dt, distToPlayer);
        else if (this.bossId === 'mahoraga_boss') this.mahoragaAI(dt);
        else if (this.bossId === 'geto') this.getoAI(dt, distToPlayer);
    }

    // ── GOJO AI - Anime accurate abilities ──
    gojoAI(dt, d) {
        const p = G.player;
        const cx = this.x+T/2, cy = this.y+T/2;
        const toPlayer = Math.atan2(p.centerY-cy, p.centerX-cx);

        // All phases can use basic attacks, higher phases ADD abilities
        // Phase 1+: 術式順転「蒼」Blue - attraction gravity pull
        if (this.phase >= 1) {
            this.specialCooldown = 2.5;
            // Blue: pull player toward Gojo
            const pullStr = 1.5 + this.phase * 0.3;
            if (d < 200 && d > 40) {
                p.x += Math.cos(toPlayer + Math.PI) * pullStr;
                p.y += Math.sin(toPlayer + Math.PI) * pullStr;
            }
            // Blue projectiles
            for (let i = 0; i < 2 + this.phase; i++) {
                setTimeout(() => {
                    if (this.dead) return;
                    const a = toPlayer + rand(-0.3, 0.3);
                    G.entities.push(new Projectile(cx, cy, a, 3.5 + this.phase*0.5, this.atk, '#4fc3f7'));
                }, i * 250);
            }
        }
        // Phase 2+: 術式反転「赫」Red - repulsion blast
        if (this.phase >= 2) {
            this.specialCooldown = 2;
            setTimeout(() => {
                if (this.dead) return;
                // Red: explosive repulsion
                if (d < 120) {
                    const pushStr = 20 + this.phase * 5;
                    p.x += Math.cos(toPlayer) * pushStr;
                    p.y += Math.sin(toPlayer) * pushStr;
                    p.takeDamage(Math.floor(this.atk * 0.8));
                }
                for (let i = 0; i < 8; i++) {
                    const a = (Math.PI*2/8)*i;
                    G.entities.push(new Projectile(cx, cy, a, 4, Math.floor(this.atk*0.7), '#ef4444', 1.5));
                }
                G.screenShake = 0.2;
            }, 800);
        }
        // Phase 3+: Blue+Red combo + Teleport
        if (this.phase >= 3) {
            this.specialCooldown = 1.8;
            // Teleport near player
            if (Math.random() < 0.4) {
                const tx = p.x + rand(-100,100);
                const ty = p.y + rand(-100,100);
                if (!isSolid(getTile(tx+T/2, ty+T/2))) {
                    this.x = tx; this.y = ty;
                    for (let i = 0; i < 6; i++) {
                        G.particles.push({ x:cx, y:cy, dx:rand(-80,80), dy:rand(-80,80), color:'#4fc3f7', life:0.5, size:5 });
                        G.particles.push({ x:tx+T/2, y:ty+T/2, dx:rand(-80,80), dy:rand(-80,80), color:'#4fc3f7', life:0.5, size:5 });
                    }
                }
            }
        }
        // Phase 4+: Faster movement + auto-dodge
        if (this.phase >= 4) {
            this.specialCooldown = 1.5;
            // Dodge: chance to become briefly invulnerable
            if (Math.random() < 0.3) {
                this.invulnerable = true;
                setTimeout(() => { this.invulnerable = false; }, 500);
            }
        }
        // Phase 5: Everything stronger + more aggressive + dash/esquiva
        if (this.phase >= 5) {
            this.specialCooldown = 1.2;
            // Double teleport
            if (Math.random() < 0.5) {
                const tx = p.x + rand(-80,80);
                const ty = p.y + rand(-80,80);
                if (!isSolid(getTile(tx+T/2, ty+T/2))) { this.x = tx; this.y = ty; }
            }
            // Rapid blue shots
            for (let i = 0; i < 4; i++) {
                const a = toPlayer + rand(-0.5, 0.5);
                G.entities.push(new Projectile(cx, cy, a, 6, Math.floor(this.atk*1.2), '#4fc3f7', 2));
            }
            // Dash burst (reposition)
            if (this._gojoDashCd <= 0 && Math.random() < 0.45) {
                const dashDist = 140;
                const a = toPlayer + (Math.random() < 0.5 ? 1 : -1) * rand(0.5, 1.1);
                const nx = this.x + Math.cos(a) * dashDist;
                const ny = this.y + Math.sin(a) * dashDist;
                if (!isSolid(getTile(nx+T/2, ny+T/2))) {
                    const ox = this.x, oy = this.y;
                    this.x = nx; this.y = ny;
                    G.screenShake = 0.15;
                    for (let i = 0; i < 10; i++) {
                        G.particles.push({ x:ox+T/2, y:oy+T/2, dx:rand(-140,140), dy:rand(-140,140), color:'#c084fc', life:0.45, size:rand(3,7) });
                        G.particles.push({ x:nx+T/2, y:ny+T/2, dx:rand(-140,140), dy:rand(-140,140), color:'#c084fc', life:0.45, size:rand(3,7) });
                    }
                }
                this._gojoDashCd = 2.2;
            }
            // “Esquiva” (i-frames curtas) algumas vezes
            if (this._gojoEvadeCd <= 0 && Math.random() < 0.35) {
                this.invulnerable = true;
                setTimeout(() => { this.invulnerable = false; }, 650);
                this._gojoEvadeCd = 2.8;
            }
        }
        // Phase 6: 無量空処 Domain Expansion + 虚式「茈」Hollow Purple
        if (this.phase >= 6) {
            this.specialCooldown = 1;
            // Domain: slow player, invert controls
            if (!G.gojoDomainActive && Math.random() < 0.35) {
                G.gojoDomainActive = true;
                G.gojoDomainTimer = 6;
                G.invertControls = true; 
                G.invertTimer = Math.max(G.invertTimer, 4);
                G.screenShake = 0.35;
            }
            // Hollow Purple: massive beam
            if (Math.random() < 0.25) {
                for (let i = 0; i < 8; i++) {
                    const a = toPlayer + (i-4)*0.08;
                    G.entities.push(new Projectile(cx, cy, a, 7, Math.floor(this.atk*2.5), '#9333ea', 3));
                }
                G.screenShake = 0.4;
                for (let i = 0; i < 12; i++) {
                    G.particles.push({ x:cx, y:cy, dx:rand(-120,120), dy:rand(-120,120), color:'#9333ea', life:rand(0.5,1.2), size:rand(5,10) });
                }
            }
            // Invulnerable bursts
            this.invulnerable = true;
            setTimeout(() => { this.invulnerable = false; }, 1500);
        }
    }

    gojoPhaseEffect() {
        this.speed = 1.5 + this.phase * 0.3;
        this.aggroRange = 200 + this.phase * 20;
        if (this.phase >= 4) this.atk = Math.floor(this.atk * 1.15);
        if (this.phase >= 6) this.atk = Math.floor(this.atk * 1.3);
    }

    // ── SUKUNA AI (3 phases) ──
    sukunaAI(dt, d) {
        const p = G.player;
        const cx = this.x+T/2, cy = this.y+T/2;
        const toPlayer = Math.atan2(p.centerY-cy, p.centerX-cx);

        // Teleport (all phases, stronger later)
        if (this._sukunaTeleportCd > 0) this._sukunaTeleportCd -= dt;
        if (this._sukunaTeleportCd <= 0 && Math.random() < (this.phase === 1 ? 0.35 : this.phase === 2 ? 0.5 : 0.65)) {
            const distBack = this.phase === 1 ? 80 : this.phase === 2 ? 100 : 120;
            const a = toPlayer + Math.PI + rand(-0.4, 0.4);
            const tx = p.x + Math.cos(a) * distBack;
            const ty = p.y + Math.sin(a) * distBack;
            if (!isSolid(getTile(tx+T/2, ty+T/2))) {
                const ox = this.x, oy = this.y;
                this.x = tx; this.y = ty;
                G.screenShake = 0.12;
                for (let i = 0; i < 10; i++) {
                    G.particles.push({ x:ox+T/2, y:oy+T/2, dx:rand(-160,160), dy:rand(-160,160), color:'#dc2626', life:0.4, size:rand(3,7) });
                    G.particles.push({ x:tx+T/2, y:ty+T/2, dx:rand(-160,160), dy:rand(-160,160), color:'#dc2626', life:0.4, size:rand(3,7) });
                }
            }
            this._sukunaTeleportCd = this.phase === 1 ? 2.4 : this.phase === 2 ? 1.8 : 1.2;
        }

        this.specialCooldown = this.phase === 1 ? 2.8 : this.phase === 2 ? 2.4 : 2.2;
        switch(this.phase) {
            case 1: // Teleport + fast melee + damage zone
                this.speed = 2.5;
                // Damage zone around
                if (d < 60) p.takeDamage(Math.floor(this.atk * 0.5));
                for (let i = 0; i < 4; i++) {
                    G.particles.push({ x:this.x+T/2, y:this.y+T/2,
                        dx:rand(-80,80), dy:rand(-80,80), color:'#ef4444', life:0.5, size:5 });
                }
                break;
            case 2: // Faster + stronger + projectile pressure
                this.speed = 3.1;
                this.atk = Math.floor(this.atk * 1.05);
                const armColors = ['#ef4444','#22d3ee','#22c55e','#fbbf24'];
                const armTypes = ['fire','ice','poison','electric'];
                for (let i = 0; i < 4; i++) {
                    const a = (Math.PI*2/4)*i + G.time;
                    G.entities.push(new Projectile(this.x+T/2, this.y+T/2, a, 3.5, this.atk, armColors[i]));
                }
                // Small radial slash burst
                for (let i = 0; i < 10; i++) {
                    const a = (Math.PI*2/10)*i;
                    G.entities.push(new Projectile(cx, cy, a, 5.5, Math.floor(this.atk*0.8), '#991b1b', 1.2));
                }
                break;
            case 3: // Malevolent Shrine + super cut (hitkill, only 6 Olhos avoids)
                this.speed = 3.4;
                // Activate shrine aura for a while
                if (this._sukunaShrineTimer <= 0) {
                    this._sukunaShrineTimer = 6;
                    this._sukunaShrineTick = 1.05;
                    G.screenShake = 0.35;
                }
                // Super cut telegraph -> unavoidable hitkill (6 Olhos can dodge)
                if (this._sukunaCleaveCd > 0) this._sukunaCleaveCd -= dt;
                if (this._sukunaCleaveCd <= 0 && Math.random() < 0.40) {
                    this._sukunaCleaveCd = 5.4;
                    // Telegraph
                    for (let i = 0; i < 14; i++) {
                        G.particles.push({ x:p.centerX, y:p.centerY, dx:rand(-40,40), dy:rand(-40,40), color:'#ff1a1a', life:0.45, size:rand(4,9) });
                    }
                    notify('⚠️ Sukuna prepara um corte supremo!');
                    setTimeout(() => {
                        if (this.dead) return;
                        // If player is too far, "miss" the cleave (gives room to run)
                        const dd = dist({x:this.x+T/2,y:this.y+T/2}, {x:p.centerX,y:p.centerY});
                        if (dd > 220) return;
                        p.takeUnavoidableDamage(9999);
                    }, 900);
                }
                break;
        }
    }

    sukunaPhaseEffect() {
        switch(this.phase) {
            case 2: this.atk = Math.floor(this.atk * 1.3); this.speed = 2; break;
            case 3: this.atk = Math.floor(this.atk * 1.5); this.speed = 2.5; break;
        }
    }

    // ── MAHORAGA AI ──
    mahoragaAI(dt) {
        // Mahoraga: big, brutal, specials
        const p = G.player;
        const cx = this.x + T/2, cy = this.y + T/2;
        const toPlayer = Math.atan2(p.centerY - cy, p.centerX - cx);

        this.speed = 2.9;
        this.attackRange = 54;
        this.aggroRange = 650;

        // Heavy slam (shockwave ring)
        if (this.specialCooldown <= 0 && Math.random() < 0.25) {
            this.specialCooldown = 2.2;
            G.screenShake = 0.35;
            setTimeout(() => {
                if (this.dead) return;
                const rx = this.x + T/2, ry = this.y + T/2;
                for (let i = 0; i < 18; i++) {
                    const a = (Math.PI*2/18)*i;
                    G.entities.push(new Projectile(rx, ry, a, 4.8, 9999, '#fbbf24', 1.1));
                }
                // Center damage zone
                if (dist({x:rx,y:ry}, {x:p.centerX,y:p.centerY}) < 80) {
                    p.takeUnavoidableDamage(9999);
                }
                for (let i = 0; i < 16; i++) {
                    G.particles.push({ x:rx, y:ry, dx:rand(-220,220), dy:rand(-220,220), color:'#fbbf24', life:rand(0.4,1.0), size:rand(4,11) });
                }
            }, 450);
        }

        // Cleave fan
        if (this.specialCooldown <= 0 && Math.random() < 0.35) {
            this.specialCooldown = 1.6;
            for (let i = 0; i < 9; i++) {
                const a = toPlayer + (i - 4) * 0.12;
                G.entities.push(new Projectile(cx, cy, a, 6.2, 9999, '#f59e0b', 1.6));
            }
            for (let i = 0; i < 10; i++) {
                G.particles.push({ x:cx, y:cy, dx:rand(-160,160), dy:rand(-160,160), color:'#f59e0b', life:rand(0.3,0.8), size:rand(4,10) });
            }
            G.screenShake = 0.2;
        }

        // Leap reposition near player
        if (this.specialCooldown <= 0 && Math.random() < 0.22) {
            this.specialCooldown = 2.0;
            const tx = p.x + rand(-120,120);
            const ty = p.y + rand(-120,120);
            if (!isSolid(getTile(tx+T/2, ty+T/2))) {
                this.x = tx; this.y = ty;
                G.screenShake = 0.25;
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        const sx = this.x - G.camera.x;
        const sy = this.y - G.camera.y;
        // Hit flash
        if (this.hitFlash > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(sx, sy, T, T);
            ctx.globalAlpha = 1;
        }
        // Invulnerable shimmer
        if (this.invulnerable) {
            ctx.globalAlpha = 0.5 + Math.sin(G.time*15)*0.3;
        }
        // Mahoraga bigger render
        if (this.bossId === 'mahoraga_boss') {
            drawChar(ctx, this.preset, sx - T/2, sy - T/2, this.dir, this.frame);
            // draw second layer to feel bigger
            ctx.globalAlpha = 0.85;
            drawChar(ctx, this.preset, sx, sy, this.dir, this.frame);
            ctx.globalAlpha = 1;
        } else {
            drawChar(ctx, this.preset, sx, sy, this.dir, this.frame);
        }
        ctx.globalAlpha = 1;
        // Health bar
        if (this.hp < this.maxHp && !this.isBoss) {
            drawHealthBar(ctx, sx, sy, this.hp, this.maxHp);
        }
        // Boss indicator
        if (this.isBoss) {
            ctx.fillStyle = '#dc262688';
            ctx.beginPath();
            ctx.arc(sx+T/2, sy+T/2, T*0.8, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // ── GETO AI ──
    getoAI(dt, d) {
        const p = G.player;
        const cx = this.x+T/2, cy = this.y+T/2;
        const toPlayer = Math.atan2(p.centerY-cy, p.centerX-cx);

        if (this._getoVolleyCd > 0) this._getoVolleyCd -= dt;
        if (this._getoSummonCd > 0) this._getoSummonCd -= dt;

        // Cursed volley (cone)
        if (this._getoVolleyCd <= 0) {
            this._getoVolleyCd = 2.4;
            const shots = 7;
            for (let i = 0; i < shots; i++) {
                const a = toPlayer + (i - (shots-1)/2) * 0.12;
                G.entities.push(new Projectile(cx, cy, a, 5.2, Math.floor(this.atk*0.9), '#6d28d9', 2.2));
            }
            G.screenShake = 0.15;
        }

        // Summon cursed spirits when low HP (and periodically)
        if ((this.hp / this.maxHp < 0.7 || this.phase >= 1) && this._getoSummonCd <= 0) {
            this._getoSummonCd = 6.5;
            const count = this.hp / this.maxHp < 0.35 ? 4 : 3;
            for (let i = 0; i < count; i++) {
                const ex = Math.floor(this.x/T) + randInt(-4,4);
                const ey = Math.floor(this.y/T) + randInt(-4,4);
                if (isSolid(getTile(ex*T+T/2, ey*T+T/2))) continue;
                const e = new Enemy({
                    x: ex, y: ey, preset: 'cursed_spirit', name: 'Espírito Invocado',
                    hp: 90, atk: 10, exp: 30, respawn: false
                });
                e.aggroRange = 220;
                e.speed = 1.6;
                G.entities.push(e);
            }
            for (let i = 0; i < 18; i++) {
                G.particles.push({ x:cx, y:cy, dx:rand(-120,120), dy:rand(-120,120), color:'#6d28d9', life:rand(0.4,0.9), size:rand(4,9) });
            }
            G.screenShake = 0.25;
        }
    }
}

// ── PROJECTILE ──
class Projectile {
    constructor(x, y, angle, speed, dmg, color, lifetime = 2) {
        this.type = 'projectile';
        this.x = x; this.y = y;
        this.dx = Math.cos(angle) * speed * 60;
        this.dy = Math.sin(angle) * speed * 60;
        this.dmg = dmg;
        this.color = color;
        this.life = lifetime;
        this.dead = false;
        this.size = 5;
    }

    update(dt) {
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.life -= dt;
        if (this.life <= 0) { this.dead = true; return; }
        // Hit player
        const p = G.player;
        if (dist({x:this.x,y:this.y}, {x:p.centerX,y:p.centerY}) < 16) {
            p.takeDamage(this.dmg);
            this.dead = true;
        }
        // Hit wall
        if (isSolid(getTile(this.x, this.y))) this.dead = true;
    }

    draw(ctx) {
        if (this.dead) return;
        const sx = this.x - G.camera.x;
        const sy = this.y - G.camera.y;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(sx, sy, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = this.color + '44';
        ctx.beginPath();
        ctx.arc(sx, sy, this.size*2, 0, Math.PI*2);
        ctx.fill();
    }
}

// ── BOSS CREATION HELPERS ──
function spawnGeto(map) {
    const s = map.bossSpawn;
    const boss = new Enemy({
        x: s.x, y: s.y, preset: s.preset, name: s.name,
        hp: 500, atk: 15, exp: 200, isBoss: true, bossId: 'geto', maxPhases: 1
    });
    boss.aggroRange = 200;
    boss.speed = 1.5;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
}

function spawnGetoFightArena() {
    const map = G.maps[9];
    if (!map || !map.bossSpawns) return;
    const s = map.bossSpawns.geto;
    const boss = new Enemy({
        x: s.x, y: s.y, preset: s.preset, name: s.name,
        hp: 850, atk: 18, exp: 400, isBoss: true, bossId: 'geto', maxPhases: 1
    });
    boss.aggroRange = 320;
    boss.speed = 1.7;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
    showCutscene(['Suguru Geto surge na arena.','"Vamos ver sua convicção."','LUTE!']);
}

function spawnGojoFight() {
    const map = G.maps[6];
    if (!map || !map.bossSpawns) return;
    const s = map.bossSpawns.gojo;
    const boss = new Enemy({
        x: s.x, y: s.y, preset: s.preset, name: s.name,
        hp: 3000, atk: 30, exp: 1000, isBoss: true, bossId: 'gojo', maxPhases: 6
    });
    boss.aggroRange = 300;
    boss.speed = 1.5;
    G.entities.push(boss);
    G.bossActive = boss;
    G.quests.gojo.status = 'active';
    showBossBar(boss);
    showCutscene(['Satoru Gojo aparece diante de você!','"Yare yare... então você é o novato?"','"Vamos ver do que é capaz."','PREPARE-SE!']);
}

function spawnGojoFightArena() {
    const map = G.maps[10];
    if (!map || !map.bossSpawns) return;
    const s = map.bossSpawns.gojo;
    const boss = new Enemy({
        x: s.x, y: s.y, preset: s.preset, name: s.name,
        hp: 3200, atk: 32, exp: 1200, isBoss: true, bossId: 'gojo', maxPhases: 6
    });
    boss.aggroRange = 520;
    boss.speed = 1.6;
    G.entities.push(boss);
    G.bossActive = boss;
    G.quests.gojo.status = 'active';
    showBossBar(boss);
    showCutscene([
        'Você foi arrastado para uma arena absurda...',
        'Satoru Gojo te encara.',
        '"é um dia lindo lá fora. pássaros cantando, flores desabrochando..."',
        '"em dias como estes, pessoas como você deveriam MORRER."',
        'PREPARE-SE!'
    ]);
}

function spawnSukunaFight() {
    const map = G.maps[6];
    if (!map || !map.bossSpawns) return;
    const s = map.bossSpawns.sukuna;
    const boss = new Enemy({
        x: s.x, y: s.y, preset: s.preset, name: s.name,
        hp: 4000, atk: 40, exp: 2000, isBoss: true, bossId: 'sukuna', maxPhases: 3
    });
    boss.aggroRange = 300;
    boss.speed = 2;
    G.entities.push(boss);
    G.bossActive = boss;
    G.quests.sukuna.status = 'active';
    showBossBar(boss);
    showCutscene(['"Ryomen Sukuna, o Rei das Maldições, desperta!"','"Você ousa me desafiar, inseto?"','"Então... morra."','A BATALHA FINAL COMEÇA!']);
}

function spawnSukunaFightArena() {
    const map = G.maps[11];
    if (!map || !map.bossSpawns) return;
    const s = map.bossSpawns.sukuna;
    const boss = new Enemy({
        x: s.x, y: s.y, preset: s.preset, name: s.name,
        hp: 4300, atk: 42, exp: 2200, isBoss: true, bossId: 'sukuna', maxPhases: 3
    });
    boss.aggroRange = 520;
    boss.speed = 2.2;
    G.entities.push(boss);
    G.bossActive = boss;
    G.quests.sukuna.status = 'active';
    showBossBar(boss);
    showCutscene(['A sala treme.','"Ryomen Sukuna..."','"Você chegou longe demais."','A BATALHA FINAL COMEÇA!']);
}

function spawnSixEyesBoss() {
    const bossNames = ['Hanami','Jogo','Dagon','Choso','Mahito'];
    const pick = bossNames[randInt(0, bossNames.length-1)];
    const boss = new Enemy({
        x: Math.floor(G.player.x/T)+3, y: Math.floor(G.player.y/T),
        preset: 'cursed_spirit', name: pick,
        hp: 800, atk: 20, exp: 500, isBoss: true, bossId: 'six_eyes_boss', maxPhases: 1
    });
    boss.aggroRange = 250;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
    notify(`⚔️ ${pick} aparece! Derrote-o para os 6 Olhos!`);
}

function spawnSixEyesArenaFight() {
    const map = G.maps[14];
    if (!map) return;
    const bossNames = ['Hanami','Jogo','Dagon','Choso','Mahito'];
    const pick = bossNames[randInt(0, bossNames.length-1)];
    const s = (map.bossSpawns && map.bossSpawns.sixEyes) ? map.bossSpawns.sixEyes : { x: Math.floor(map.w/2), y: 6 };
    const boss = new Enemy({
        x: s.x, y: s.y,
        preset: 'cursed_spirit', name: pick,
        hp: 900, atk: 22, exp: 600, isBoss: true, bossId: 'six_eyes_boss', maxPhases: 1
    });
    boss.aggroRange = 260;
    boss.speed = 1.9;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
    showCutscene([`⚔️ ${pick} aparece!`, 'Desperte os 6 Olhos!']);
}

function spawnDomainGuardian() {
    const boss = new Enemy({
        x: Math.floor(G.player.x/T)+3, y: Math.floor(G.player.y/T),
        preset: 'guardian', name: 'Guardião do Domínio',
        hp: 1200, atk: 25, exp: 800, isBoss: true, bossId: 'domain_guardian', maxPhases: 1
    });
    boss.aggroRange = 250;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
}

function spawnMahoragaSurvival() {
    const map = G.maps[5];
    const boss = new Enemy({
        x: 27, y: 33, preset: 'mahoraga', name: 'Mahoraga',
        hp: 99999, atk: 9999, exp: 0, isBoss: true, bossId: 'mahoraga_boss', maxPhases: 1
    });
    boss.speed = 2.5;
    boss.aggroRange = 500;
    boss.respawn = false;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
    // Start survival timer
    G.survivalActive = true;
    G.survivalTimer = 120; // 2 minutes
    document.getElementById('survival-timer').classList.remove('hidden');
    notify('⏱️ Sobreviva 2 minutos contra Mahoraga!');
}

function spawnMahoragaArenaFight() {
    const map = G.maps[12];
    if (!map) return;
    const s = (map.bossSpawns && map.bossSpawns.mahoraga) ? map.bossSpawns.mahoraga : { x: Math.floor(map.w/2), y: 12 };
    const boss = new Enemy({
        x: s.x, y: s.y, preset: 'mahoraga', name: 'Mahoraga',
        hp: 99999, atk: 9999, exp: 0, isBoss: true, bossId: 'mahoraga_boss', maxPhases: 1
    });
    boss.speed = 2.6;
    boss.aggroRange = 600;
    boss.respawn = false;
    G.entities.push(boss);
    G.bossActive = boss;
    showBossBar(boss);
    // Start survival timer
    G.survivalActive = true;
    G.survivalTimer = 120;
    document.getElementById('survival-timer').classList.remove('hidden');
    showCutscene(['O ritual começou...', '⏱ Sobreviva 2 minutos contra Mahoraga!']);
}

function showBossBar(boss) {
    const el = document.getElementById('boss-bar');
    el.classList.remove('hidden');
    document.getElementById('boss-name').textContent = boss.name;
    document.getElementById('boss-phase').textContent = `Fase ${boss.phase}/${boss.maxPhases}`;
}
