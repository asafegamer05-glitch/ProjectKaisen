// ═══════════════════════════════════════
// PLAYER CLASS
// ═══════════════════════════════════════

class Player {
    constructor(name) {
        this.name = name;
        this.x = 0; this.y = 0;
        this.dir = 0; // 0=down,1=up,2=left,3=right
        this.frame = 0;
        this.frameTimer = 0;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.maxHp = 100;
        this.hp = 100;
        this.maxPower = 100;
        this.power = 100;
        this.baseSpeed = 2.5;
        this.speed = 2.5;
        this.atk = 10;
        this.def = 0;
        this.attacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.dashCooldown = 0;
        this.dashing = false;
        this.dashTimer = 0;
        this.dashDir = { x: 0, y: 0 };
        this.invincible = 0;
        this.skill5Cooldown = 0;
        this.skill6Cooldown = 0;
        this.moving = false;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.killCount = 0;
        this.totalDamage = 0;
        this.playTime = 0;
        this.regenTimer = 0;
        this.cursedPunch = false;
    }

    get centerX() { return this.x + T/2; }
    get centerY() { return this.y + T/2; }

    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.maxHp = Math.floor(100 * Math.pow(1.05, this.level - 1));
        this.maxPower = Math.floor(100 * Math.pow(1.04, this.level - 1));
        this.hp = this.maxHp;
        this.power = this.maxPower;
        this.atk = 10 + this.level * 2;
        this.expToNext = Math.floor(100 * Math.pow(1.3, this.level - 1));
        // Show level up
        const el = document.getElementById('level-up-popup');
        document.getElementById('new-level').textContent = this.level;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 2500);
        notify(`Nível ${this.level}! HP +5%, Poder +4%`);
        // Check quest unlocks
        if (this.level >= 25 && G.quests.sixEyes.status === 'locked') {
            G.quests.sixEyes.status = 'available';
            notify('🔓 Quest dos 6 Olhos disponível! Fale com o Mestre Ancião.');
        }
        if (this.level >= 50 && G.quests.domain.status === 'locked' && G.abilities.sixEyes) {
            G.quests.domain.status = 'available';
            notify('🔓 Você está pronto para a Expansão de Domínio! Fale com o Mestre de Domínio na Área 5.');
        }
    }

    update(dt) {
        this.playTime += dt;
        // Movement
        let dx = 0, dy = 0;
        this.moving = false;
        const keys = G.keys;
        let up = keys['w'] || keys['arrowup'];
        let down = keys['s'] || keys['arrowdown'];
        let left = keys['a'] || keys['arrowleft'];
        let right = keys['d'] || keys['arrowright'];
        // Invert controls (Gojo phase 3)
        if (G.invertControls) {
            [up, down] = [down, up];
            [left, right] = [right, left];
        }
        if (up) { dy = -1; this.dir = 1; this.moving = true; }
        if (down) { dy = 1; this.dir = 0; this.moving = true; }
        if (left) { dx = -1; this.dir = 2; this.moving = true; }
        if (right) { dx = 1; this.dir = 3; this.moving = true; }
        // Normalize diagonal
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        let spd = this.speed;
        // Sprint on Shift (helps dodging boss patterns)
        const sprinting = !!(keys['shift'] || keys['shiftleft'] || keys['shiftright']);
        if (sprinting && this.power > 0 && this.moving) {
            spd *= 1.55;
            // Light stamina-like drain from power
            this.power = Math.max(0, this.power - dt * 14);
        }
        if (G.abilities.mahoragaActive) spd *= 2;
        if (G.abilities.domainActive) spd *= 1.5;
        if (G.gojoDomainActive) spd *= 0.65;

        // Dashing
        if (this.dashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) this.dashing = false;
            else {
                dx = this.dashDir.x * 8;
                dy = this.dashDir.y * 8;
                spd = 1;
            }
        }

        // Collision check
        const nx = this.x + dx * spd;
        const ny = this.y + dy * spd;
        if (!this.checkCollision(nx, this.y)) this.x = nx;
        if (!this.checkCollision(this.x, ny)) this.y = ny;

        // Animation
        if (this.moving) {
            this.frameTimer += dt;
            if (this.frameTimer > 0.2) { this.frame = (this.frame + 1) % 4; this.frameTimer = 0; }
        } else {
            this.frame = 0;
        }

        // Attack timer
        if (this.attackTimer > 0) this.attackTimer -= dt;
        else this.attacking = false;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.skill5Cooldown > 0) this.skill5Cooldown -= dt;
        if (this.skill6Cooldown > 0) this.skill6Cooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

        // Shield timer
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }

        // Invert controls timer
        if (G.invertControls) {
            G.invertTimer -= dt;
            if (G.invertTimer <= 0) G.invertControls = false;
        }

        // HP reduction (Gojo phase 5)
        if (G.hpReduction > 0) {
            this.maxHp = Math.floor(100 * Math.pow(1.05, this.level-1) * (1 - G.hpReduction));
            this.hp = Math.min(this.hp, this.maxHp);
        }

        // Mahoraga ability timer
        if (G.abilities.mahoragaActive) {
            G.abilities.mahoragaTimer -= dt;
            if (G.abilities.mahoragaTimer <= 0) {
                G.abilities.mahoragaActive = false;
                notify('Habilidade Mahoraga terminou!');
            }
        }

        // Domain expansion timer
        if (G.abilities.domainActive) {
            G.abilities.domainTimer -= dt;
            if (G.abilities.domainTimer <= 0) {
                G.abilities.domainActive = false;
                notify('Expansão de Domínio terminou!');
            }
        }

        // Power auto-regen (60% after 10s without attack)
        if (G.time - G.lastAttackTime > 10) {
            const target = Math.floor(this.maxPower * 0.6);
            if (this.power < target) {
                this.power = Math.min(this.power + 2, target);
            }
        }

        // HP regen: 30 HP every 10 seconds
        this.regenTimer += dt;
        if (this.regenTimer >= 10) {
            this.regenTimer = 0;
            if (this.hp < this.maxHp) {
                const heal = Math.min(30, this.maxHp - this.hp);
                this.hp += heal;
                spawnDamageNumber(this.x, this.y, heal, 'heal');
            }
        }

        // Portal check
        this.checkPortals();
        // Torch/fragment check
        this.checkInteractables();
    }

    checkCollision(nx, ny) {
        const margin = 4;
        const corners = [
            { x: nx + margin, y: ny + margin },
            { x: nx + T - margin, y: ny + margin },
            { x: nx + margin, y: ny + T - margin },
            { x: nx + T - margin, y: ny + T - margin },
        ];
        for (const c of corners) {
            if (isSolid(getTile(c.x, c.y))) return true;
        }
        return false;
    }

    checkPortals() {
        const map = G.maps[G.currentArea];
        if (!map || G.areaTransition) return;
        const ptx = Math.floor(this.centerX / T);
        const pty = Math.floor(this.centerY / T);
        for (const p of map.portals) {
            if (ptx === p.x && pty === p.y) {
                // Gate Area 3 -> 4 behind Dojo mission 3
                if (G.currentArea === 3 && p.toArea === 4) {
                    const q = G.quests.dojo;
                    const ok = q && (q.status === 'complete' || q.stage >= 3);
                    if (!ok) {
                        notify('⛔ Complete pelo menos a 3ª missão do Dojo para passar.');
                        return;
                    }
                }
                // Gate city -> mountain stairs requires Mahoraga key
                if (G.currentArea === 6 && p.toArea === 17) {
                    const hasKey = !!G.inventory.find(i => i.id === 'mountain_key');
                    if (!hasKey) { notify('🗝️ A porta está trancada. (Precisa da Chave da Montanha)'); return; }
                }
                // Gate Area 4 -> Gojo arena only after accepting route at ice pillar
                if (G.currentArea === 4 && p.toArea === 10) {
                    if (!G.gojoRoute || !G.gojoRoute.unlocked) {
                        notify('⛔ Algo impede sua passagem...');
                        return;
                    }
                }
                changeArea(p.toArea, p.toX, p.toY, p.label);
                return;
            }
        }
    }

    checkInteractables() {
        const map = G.maps[G.currentArea];
        if (!map) return;
        const ptx = Math.floor(this.centerX / T);
        const pty = Math.floor(this.centerY / T);
        // Torches are lit only by Fire Sword skills (5/6). See executeSkill().
        // Fragments
        if (map.fragments) {
            for (const frag of map.fragments) {
                if (!frag.collected && Math.abs(ptx - frag.x) <= 1 && Math.abs(pty - frag.y) <= 1) {
                    frag.collected = true;
                    G.quests.domain.fragments[frag.type] = true;
                    const icons = { fire:'🔥', ice:'❄️', dark:'🌑' };
                    notify(`${icons[frag.type]} Fragmento de ${frag.type} coletado!`);
                    const f = G.quests.domain.fragments;
                    if (f.fire && f.ice && f.dark) {
                        notify('✅ Todos os fragmentos coletados!');
                        G.quests.domain.stage = 1;
                    }
                }
            }
        }

        // Sidequest (Area 5): hidden scroll relic
        if (map.relics && G.quests.caveScroll && G.quests.caveScroll.status === 'available') {
            for (const r of map.relics) {
                if (r.collected) continue;
                if (Math.abs(ptx - r.x) <= 1 && Math.abs(pty - r.y) <= 1) {
                    r.collected = true;
                    G.quests.caveScroll.status = 'complete';
                    this.maxPower = Math.floor(this.maxPower * 1.10);
                    this.power = this.maxPower;
                    notify('📜 Pergaminho encontrado! Poder máximo +10%');
                }
            }
        }

        // Sidequest (Area 6): activate switches by stepping on them
        if (map.switches && G.quests.arenaSwitches && G.quests.arenaSwitches.status === 'available') {
            for (const s of map.switches) {
                if (!s.on && ptx === s.x && pty === s.y) {
                    s.on = true;
                    G.quests.arenaSwitches.on = (G.quests.arenaSwitches.on || 0) + 1;
                    notify(`🧩 Selo ativado! (${G.quests.arenaSwitches.on}/4)`);
                    if (G.quests.arenaSwitches.on >= 4) {
                        G.quests.arenaSwitches.status = 'complete';
                        notify('✅ Selo da Arena completo! Regeneração de poder melhorada.');
                        // Reward: better regen by lowering lastAttackTime penalty
                        G.lastAttackTime = Math.max(0, G.time - 11);
                    }
                }
            }
        }
    }

    attack() {
        if (this.attackCooldown > 0) return;
        this.attacking = true;
        this.attackTimer = 0.25;
        this.attackCooldown = 0.4;
        G.lastAttackTime = G.time;
        // Hit enemies in front
        const range = 40;
        const ax = this.centerX + [0,0,-range,range][this.dir];
        const ay = this.centerY + [range,-range,0,0][this.dir];
        let hit = false;
        // Cursed punch bonus (when no sword equipped)
        const punchBonus = (this.cursedPunch && !G.equipped) ? 1.5 : 1;
        for (const e of G.entities) {
            if (e.dead || e.type !== 'enemy') continue;
            const d = dist({x:ax,y:ay}, {x:e.x+T/2,y:e.y+T/2});
            if (d < range) {
                let dmg = Math.floor((this.atk + randInt(-2, 5)) * punchBonus);
                if (G.abilities.mahoragaActive) dmg *= 3;
                if (G.equipped) dmg += (G.equipped.atk || 0);
                e.takeDamage(dmg);
                hit = true;
                this.power = Math.min(this.maxPower, this.power + 10);
                G.screenShake = 0.1;
            }
        }
        // Particles - purple for cursed punch, blue otherwise
        const pColor = (this.cursedPunch && !G.equipped) ? '#c084fc' : '#8b5cf6';
        G.particles.push({
            x: ax, y: ay, color: pColor, life: 0.3,
            dx: [0,0,-2,2][this.dir] * 50, dy: [2,-2,0,0][this.dir] * 50, size: punchBonus > 1 ? 8 : 6
        });
        if (this.cursedPunch && !G.equipped && hit) {
            // Extra cursed energy particles on punch
            for (let i = 0; i < 4; i++) {
                G.particles.push({ x:ax, y:ay, dx:rand(-60,60), dy:rand(-60,60), color:'#c084fc', life:0.4, size:4 });
            }
        }
    }

    dash() {
        if (this.dashCooldown > 0 || this.dashing) return;
        this.dashing = true;
        this.dashTimer = G.abilities.dashV2 ? 0.18 : 0.15;
        this.dashCooldown = G.abilities.dashV2 ? 0.65 : 0.8;
        this.invincible = G.abilities.dashV2 ? 0.38 : 0.3;
        const dirs = [[0,1],[0,-1],[-1,0],[1,0]];
        this.dashDir = { x: dirs[this.dir][0], y: dirs[this.dir][1] };
    }

    useSkill(slot) {
        if (slot === 5 && this.skill5Cooldown > 0) return;
        if (slot === 6 && this.skill6Cooldown > 0) return;

        // Base skills (no item): Charged Punch (5) + Impact (6)
        if (slot === 5 && !G.equipped && G.abilities.chargedPunch) {
            if (this.power < 20) { notify('⚠️ Poder insuficiente!'); return; }
            this.power -= 20;
            this.skill5Cooldown = G.abilities.baseSkillsV2 ? 2.2 : 2.8;
            G.lastAttackTime = G.time;
            // Big hit in front with small AoE
            const range = 70;
            const ax = this.centerX + [0,0,-range,range][this.dir];
            const ay = this.centerY + [range,-range,0,0][this.dir];
            let hit = false;
            for (const e of G.entities) {
                if (e.dead || e.type !== 'enemy') continue;
                const d = dist({x:ax,y:ay}, {x:e.x+T/2,y:e.y+T/2});
                if (d < 80) {
                    const mult = G.abilities.baseSkillsV2 ? 3.0 : 2.2;
                    e.takeDamage(Math.floor(this.atk * mult) + randInt(6, 18));
                    hit = true;
                }
            }
            G.screenShake = 0.25;
            for (let i = 0; i < 18; i++) {
                G.particles.push({ x:ax, y:ay, dx:rand(-200,200), dy:rand(-200,200), color:'#c084fc', life:rand(0.25,0.6), size:rand(4,9) });
            }
            if (hit) notify('👊 Soco Carregado!');
            return;
        }

        if (slot === 6 && !G.equipped && G.abilities.basicSkill6) {
            const cost = G.abilities.baseSkillsV2 ? 30 : 35;
            if (this.power < cost) { notify('⚠️ Poder insuficiente!'); return; }
            this.power -= cost;
            this.skill6Cooldown = G.abilities.baseSkillsV2 ? 4.5 : 6.5;
            G.lastAttackTime = G.time;
            // Radial shockwave around player
            const radius = G.abilities.baseSkillsV2 ? 170 : 140;
            for (const e of G.entities) {
                if (e.dead || e.type !== 'enemy') continue;
                const d = dist({x:this.centerX,y:this.centerY}, {x:e.x+T/2,y:e.y+T/2});
                if (d < radius) {
                    const dmg = Math.floor(this.atk * (G.abilities.baseSkillsV2 ? 2.4 : 1.8)) + randInt(4, 14);
                    e.takeDamage(dmg);
                    // soft knockback
                    const a = Math.atan2((e.y+T/2) - this.centerY, (e.x+T/2) - this.centerX);
                    e.knockback = { x: Math.cos(a), y: Math.sin(a), time: 0.18 };
                }
            }
            G.screenShake = 0.35;
            for (let i = 0; i < 26; i++) {
                const a = (Math.PI*2/26)*i;
                G.particles.push({ x:this.centerX, y:this.centerY, dx:Math.cos(a)*rand(80,220), dy:Math.sin(a)*rand(80,220), color:'#8b5cf6', life:rand(0.25,0.7), size:rand(3,8) });
            }
            notify(G.abilities.baseSkillsV2 ? '💢 Impacto Maldito V2!' : '💢 Impacto Maldito!');
            return;
        }

        // Equipped specials (Especiais tab)
        const special = slot === 5 ? G.specialsEquipped.slot5 : G.specialsEquipped.slot6;
        if (special === 'domain' && G.specialsOwned.domain) {
            if (this.power < 60) { notify('⚠️ Poder insuficiente!'); return; }
            this.power -= 60;
            G.abilities.domainActive = true;
            G.abilities.domainTimer = 20;
            notify('🌪️ EXPANSÃO DE DOMÍNIO!');
            if (slot === 5) this.skill5Cooldown = 45;
            else this.skill6Cooldown = 45;
            G.screenShake = 0.4;
            return;
        }
        if (special === 'hollowPurple' && G.specialsOwned.hollowPurple) {
            if (this.power < 80) { notify('⚠️ Poder insuficiente!'); return; }
            this.power -= 80;
            const cx = this.centerX, cy = this.centerY;
            // Fire a wide purple beam (projectile fan)
            const dirAng = [Math.PI/2, -Math.PI/2, Math.PI, 0][this.dir];
            for (let i = 0; i < 9; i++) {
                const a = dirAng + (i - 4) * 0.07;
                G.entities.push(new Projectile(cx, cy, a, 8.0, Math.floor(this.atk * 3.2), '#9333ea', 2.8));
            }
            for (let i = 0; i < 18; i++) {
                G.particles.push({ x:cx, y:cy, dx:rand(-180,180), dy:rand(-180,180), color:'#9333ea', life:rand(0.4,1.2), size:rand(4,10) });
            }
            notify('🟣 Hollow Purple!');
            if (slot === 5) this.skill5Cooldown = 35;
            else this.skill6Cooldown = 35;
            G.screenShake = 0.5;
            return;
        }

        // Domain Expansion skills
        if (G.abilities.domain) {
            if (slot === 5 && this.power >= 30) {
                this.power -= 30;
                G.abilities.domainActive = true;
                G.abilities.domainTimer = 15;
                this.speed = this.baseSpeed * 1.5;
                notify('🌀 Pequeno Domínio ativado! +50% velocidade por 15s');
                this.skill5Cooldown = 20;
                // Slow enemies
                for (const e of G.entities) {
                    if (e.type === 'enemy') e.speedMult = 0.7;
                }
                return;
            }
            if (slot === 6 && this.power >= 50) {
                this.power -= 50;
                notify('💥 EXPLOSÃO DE DOMÍNIO!');
                G.screenShake = 0.5;
                this.skill6Cooldown = 30;
                // Massive damage to all enemies
                for (const e of G.entities) {
                    if (e.dead || e.type !== 'enemy') continue;
                    const d = dist(this, e);
                    if (d < 200) {
                        e.takeDamage(this.atk * 5);
                    }
                }
                // Big particle burst
                for (let i = 0; i < 30; i++) {
                    G.particles.push({
                        x: this.centerX, y: this.centerY,
                        dx: rand(-200,200), dy: rand(-200,200),
                        color: ['#8b5cf6','#c084fc','#6d28d9'][randInt(0,2)],
                        life: rand(0.5,1.5), size: rand(3,8)
                    });
                }
                // Vulnerability period
                this.invincible = 0; // can be hit for 8s
                return;
            }
        }

        // Mahoraga ability
        if (G.abilities.mahoraga && G.abilities.mahoragaReady && slot === 5) {
            if (this.hp <= this.maxHp * 0.1 && this.power >= this.maxPower) {
                G.abilities.mahoragaActive = true;
                G.abilities.mahoragaReady = false;
                G.abilities.mahoragaTimer = 60;
                this.power = 0;
                notify('🌀 MAHORAGA ATIVADO! 1 minuto de poder extremo!');
                G.screenShake = 0.5;
                for (let i = 0; i < 20; i++) {
                    G.particles.push({
                        x: this.centerX, y: this.centerY,
                        dx: rand(-150,150), dy: rand(-150,150),
                        color: '#fbbf24', life: rand(0.5,1), size: rand(4,10)
                    });
                }
                return;
            } else if (G.abilities.mahoragaReady) {
                notify('⚠️ Mahoraga: Precisa HP ≤10% e Poder = 100%');
                return;
            }
        }

        // Item skills
        if (G.equipped) {
            const skill = slot === 5 ? G.equipped.skill1 : G.equipped.skill2;
            if (skill && this.power >= skill.cost) {
                this.power -= skill.cost;
                if (slot === 5) this.skill5Cooldown = 1.5;
                else this.skill6Cooldown = 2;
                G.lastAttackTime = G.time;
                executeSkill(this, skill);
                return;
            }
        }
        if (this.power < 10) notify('⚠️ Poder insuficiente!');
    }

    takeDamage(amount) {
        if (G.abilities.invincible) return;
        if (G.pantheon && G.pantheon.active && G.pantheon.noHit) {
            G.pantheon.gotHit = true;
        }
        if (this.invincible > 0) return;
        if (this.shieldActive) { amount = Math.floor(amount * 0.3); }
        if (this.def > 0) amount = Math.max(1, amount - this.def);
        // Six Eyes auto-dodge
        if (G.abilities.sixEyes && G.abilities.sixEyesCharges > 0) {
            G.abilities.sixEyesCharges--;
            spawnDamageNumber(this.x, this.y, 'ESQUIVA', 'heal');
            return;
        }
        this.hp -= amount;
        this.invincible = 0.5;
        G.screenShake = 0.15;
        spawnDamageNumber(this.x, this.y, amount, 'crit');
        if (this.hp <= 0) {
            this.hp = 0;
            gameOver();
        }
    }

    // Damage that ignores dash i-frames, but can still be avoided by 6 Olhos.
    takeUnavoidableDamage(amount) {
        if (G.abilities.invincible) return;
        if (G.pantheon && G.pantheon.active && G.pantheon.noHit) {
            G.pantheon.gotHit = true;
        }
        if (this.shieldActive) { amount = Math.floor(amount * 0.3); }
        if (this.def > 0) amount = Math.max(1, amount - this.def);
        // Six Eyes auto-dodge
        if (G.abilities.sixEyes && G.abilities.sixEyesCharges > 0) {
            G.abilities.sixEyesCharges--;
            spawnDamageNumber(this.x, this.y, 'ESQUIVA', 'heal');
            return;
        }
        this.hp -= amount;
        this.invincible = 0.2;
        G.screenShake = 0.25;
        spawnDamageNumber(this.x, this.y, amount, 'crit');
        if (this.hp <= 0) {
            this.hp = 0;
            gameOver();
        }
    }

    draw(ctx) {
        const sx = this.x - G.camera.x;
        const sy = this.y - G.camera.y;
        // Flash when invincible
        if (this.invincible > 0 && Math.floor(G.time * 10) % 2) return;
        // Mahoraga glow
        if (G.abilities.mahoragaActive) {
            ctx.fillStyle = '#fbbf2433';
            ctx.beginPath();
            ctx.arc(sx + T/2, sy + T/2, T, 0, Math.PI*2);
            ctx.fill();
        }
        // Domain glow
        if (G.abilities.domainActive) {
            ctx.fillStyle = '#8b5cf633';
            ctx.beginPath();
            ctx.arc(sx + T/2, sy + T/2, T*1.2, 0, Math.PI*2);
            ctx.fill();
        }
        drawChar(ctx, 'player', sx, sy, this.dir, this.frame);
        // Attack visual
        if (this.attacking) {
            drawAttackEffect(ctx, sx, sy, this.dir, G.abilities.mahoragaActive ? '#fbbf24' : '#8b5cf6');
        }
        // Shield visual
        if (this.shieldActive) {
            ctx.strokeStyle = '#22d3ee88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx+T/2, sy+T/2, T*0.8, 0, Math.PI*2);
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    }
}

function executeSkill(player, skill) {
    const range = 50;
    const ax = player.centerX + [0,0,-range,range][player.dir];
    const ay = player.centerY + [range,-range,0,0][player.dir];

    // Torch lighting (Area 5 quest): ONLY via Fire Sword skills (slot 5/6)
    if (G.currentArea === 5 && G.quests.mahoraga && G.quests.mahoraga.status === 'active' && G.quests.mahoraga.stage <= 1) {
        if (G.equipped && G.equipped.id === 'fire_sword' && (skill.type === 'fire' || skill.type === 'fire_aoe')) {
            const map = G.maps[5];
            if (map && map.torches) {
                const ptx = Math.floor(player.centerX / T);
                const pty = Math.floor(player.centerY / T);
                for (const torch of map.torches) {
                    if (torch.lit) continue;
                    if (Math.abs(ptx - torch.x) <= 1 && Math.abs(pty - torch.y) <= 1) {
                        torch.lit = true;
                        G.quests.mahoraga.torchesLit = (G.quests.mahoraga.torchesLit || 0) + 1;
                        notify(`🔥 Tocha acesa! (${G.quests.mahoraga.torchesLit}/5)`);
                        for (let i = 0; i < 10; i++) {
                            G.particles.push({ x:torch.x*T+T/2, y:torch.y*T+T/2, dx:rand(-80,80), dy:rand(-120,-20), color:'#f97316', life:rand(0.3,0.8), size:rand(3,7) });
                        }
                        if (G.quests.mahoraga.torchesLit >= 5) {
                            notify('✅ Todas as tochas acesas! O santuário oculto se revelou!');
                            G.quests.mahoraga.stage = 2;
                        }
                        break;
                    }
                }
            }
        }
    }

    switch(skill.type) {
        case 'fire': case 'dark': case 'electric': case 'ice': case 'holy':
            // Single target projectile-like
            for (const e of G.entities) {
                if (e.dead || e.type !== 'enemy') continue;
                if (dist({x:ax,y:ay}, {x:e.x+T/2,y:e.y+T/2}) < range*1.2) {
                    e.takeDamage(skill.dmg + player.atk);
                    player.power = Math.min(player.maxPower, player.power + 10);
                }
            }
            // Particles
            const colors = {fire:'#ef4444',dark:'#6d28d9',electric:'#fbbf24',ice:'#22d3ee',holy:'#fef3c7'};
            for (let i = 0; i < 8; i++) {
                G.particles.push({ x:ax, y:ay, dx:rand(-80,80), dy:rand(-80,80),
                    color:colors[skill.type]||'#fff', life:rand(0.3,0.6), size:rand(3,6) });
            }
            G.screenShake = 0.1;
            break;
        case 'fire_aoe': case 'ice_aoe': case 'electric_aoe': case 'dark_multi':
            // AoE damage
            for (const e of G.entities) {
                if (e.dead || e.type !== 'enemy') continue;
                if (dist(player, e) < 120) {
                    e.takeDamage(skill.dmg + player.atk);
                }
            }
            for (let i = 0; i < 15; i++) {
                G.particles.push({ x:player.centerX, y:player.centerY,
                    dx:rand(-150,150), dy:rand(-150,150),
                    color:skill.type.includes('fire')?'#ef4444':skill.type.includes('ice')?'#22d3ee':'#fbbf24',
                    life:rand(0.4,0.8), size:rand(4,8) });
            }
            G.screenShake = 0.2;
            break;
        case 'heal':
            player.hp = Math.min(player.maxHp, player.hp - skill.dmg); // dmg is negative
            spawnDamageNumber(player.x, player.y, Math.abs(skill.dmg), 'heal');
            for (let i = 0; i < 8; i++) {
                G.particles.push({ x:player.centerX, y:player.centerY,
                    dx:rand(-50,50), dy:rand(-80,-20), color:'#22c55e', life:rand(0.5,1), size:rand(3,5) });
            }
            break;
        case 'shield':
            player.shieldActive = true;
            player.shieldTimer = 5;
            notify('🛡️ Escudo Maldito ativado! (5s)');
            break;
        case 'reflect':
            for (const e of G.entities) {
                if (e.dead || e.type !== 'enemy') continue;
                if (dist(player, e) < 80) e.takeDamage(skill.dmg + player.atk);
            }
            G.screenShake = 0.15;
            break;
    }
}
