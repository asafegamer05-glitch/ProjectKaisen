// ═══════════════════════════════════════
// SPRITE DRAWING - Pixel Art Characters
// ═══════════════════════════════════════

const SpriteCache = {};

function createSprite(w, h, drawFn) {
    const key = drawFn.toString();
    if (SpriteCache[key]) return SpriteCache[key];
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    SpriteCache[key] = c;
    return c;
}

// Draw a pixel at scale
function px(ctx, x, y, color, s = 2) {
    ctx.fillStyle = color;
    ctx.fillRect(x * s, y * s, s, s);
}

// Generate character sprite (16x16 logical pixels, drawn at 2x = 32x32)
function drawCharSprite(ctx, opts) {
    const { hair, skin, shirt, pants, eyes, dir, frame, blindfold, marks } = opts;
    const s = 2;
    ctx.clearRect(0, 0, 32, 32);

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(8*s, 15*s, 4*s, 1.5*s, 0, 0, Math.PI*2);
    ctx.fill();

    const walkOff = frame % 2 === 1 ? 1 : 0;

    if (dir === 0) { // down
        // Body
        px(ctx,6,8,shirt,s); px(ctx,7,8,shirt,s); px(ctx,8,8,shirt,s); px(ctx,9,8,shirt,s);
        px(ctx,6,9,shirt,s); px(ctx,7,9,shirt,s); px(ctx,8,9,shirt,s); px(ctx,9,9,shirt,s);
        px(ctx,6,10,shirt,s); px(ctx,7,10,shirt,s); px(ctx,8,10,shirt,s); px(ctx,9,10,shirt,s);
        // Pants
        px(ctx,6,11,pants,s); px(ctx,7,11,pants,s); px(ctx,8,11,pants,s); px(ctx,9,11,pants,s);
        px(ctx,6+walkOff,12,pants,s); px(ctx,7,12,pants,s); px(ctx,8,12,pants,s); px(ctx,9-walkOff,12,pants,s);
        // Feet
        px(ctx,6+walkOff,13,'#222',s); px(ctx,9-walkOff,13,'#222',s);
        // Head
        px(ctx,6,3,hair,s); px(ctx,7,3,hair,s); px(ctx,8,3,hair,s); px(ctx,9,3,hair,s);
        px(ctx,5,4,hair,s); px(ctx,6,4,skin,s); px(ctx,7,4,skin,s); px(ctx,8,4,skin,s); px(ctx,9,4,skin,s); px(ctx,10,4,hair,s);
        px(ctx,5,5,hair,s); px(ctx,6,5,skin,s); px(ctx,7,5,skin,s); px(ctx,8,5,skin,s); px(ctx,9,5,skin,s); px(ctx,10,5,hair,s);
        // Eyes
        if (blindfold) {
            px(ctx,6,5,'#eee',s); px(ctx,7,5,'#eee',s); px(ctx,8,5,'#eee',s); px(ctx,9,5,'#eee',s);
        } else {
            px(ctx,7,5,eyes,s); px(ctx,9,5,eyes,s);
        }
        px(ctx,5,6,hair,s); px(ctx,6,6,skin,s); px(ctx,7,6,skin,s); px(ctx,8,6,skin,s); px(ctx,9,6,skin,s); px(ctx,10,6,hair,s);
        px(ctx,6,7,skin,s); px(ctx,7,7,skin,s); px(ctx,8,7,skin,s); px(ctx,9,7,skin,s);
        // Arms
        px(ctx,5,9,skin,s); px(ctx,10,9,skin,s);
        if (marks) {
            px(ctx,6,5,'#444',s); px(ctx,9,5,'#444',s);
            px(ctx,7,7,'#444',s); px(ctx,8,7,'#444',s);
        }
    } else if (dir === 1) { // up
        px(ctx,6,8,shirt,s); px(ctx,7,8,shirt,s); px(ctx,8,8,shirt,s); px(ctx,9,8,shirt,s);
        px(ctx,6,9,shirt,s); px(ctx,7,9,shirt,s); px(ctx,8,9,shirt,s); px(ctx,9,9,shirt,s);
        px(ctx,6,10,shirt,s); px(ctx,7,10,shirt,s); px(ctx,8,10,shirt,s); px(ctx,9,10,shirt,s);
        px(ctx,6,11,pants,s); px(ctx,7,11,pants,s); px(ctx,8,11,pants,s); px(ctx,9,11,pants,s);
        px(ctx,6+walkOff,12,pants,s); px(ctx,7,12,pants,s); px(ctx,8,12,pants,s); px(ctx,9-walkOff,12,pants,s);
        px(ctx,6+walkOff,13,'#222',s); px(ctx,9-walkOff,13,'#222',s);
        px(ctx,6,3,hair,s); px(ctx,7,3,hair,s); px(ctx,8,3,hair,s); px(ctx,9,3,hair,s);
        px(ctx,5,4,hair,s); px(ctx,6,4,hair,s); px(ctx,7,4,hair,s); px(ctx,8,4,hair,s); px(ctx,9,4,hair,s); px(ctx,10,4,hair,s);
        px(ctx,5,5,hair,s); px(ctx,6,5,hair,s); px(ctx,7,5,hair,s); px(ctx,8,5,hair,s); px(ctx,9,5,hair,s); px(ctx,10,5,hair,s);
        px(ctx,5,6,hair,s); px(ctx,6,6,hair,s); px(ctx,7,6,hair,s); px(ctx,8,6,hair,s); px(ctx,9,6,hair,s); px(ctx,10,6,hair,s);
        px(ctx,6,7,skin,s); px(ctx,7,7,skin,s); px(ctx,8,7,skin,s); px(ctx,9,7,skin,s);
        px(ctx,5,9,skin,s); px(ctx,10,9,skin,s);
    } else { // left (2) or right (3)
        const flip = dir === 3;
        const ox = flip ? 1 : 0;
        px(ctx,7,8,shirt,s); px(ctx,8,8,shirt,s); px(ctx,9,8,shirt,s);
        px(ctx,7,9,shirt,s); px(ctx,8,9,shirt,s); px(ctx,9,9,shirt,s);
        px(ctx,7,10,shirt,s); px(ctx,8,10,shirt,s); px(ctx,9,10,shirt,s);
        px(ctx,7,11,pants,s); px(ctx,8,11,pants,s); px(ctx,9,11,pants,s);
        px(ctx,7+walkOff,12,pants,s); px(ctx,9-walkOff,12,pants,s);
        px(ctx,7+walkOff,13,'#222',s); px(ctx,9-walkOff,13,'#222',s);
        px(ctx,7,3,hair,s); px(ctx,8,3,hair,s); px(ctx,9,3,hair,s);
        px(ctx,6,4,hair,s); px(ctx,7,4,flip?skin:hair,s); px(ctx,8,4,skin,s); px(ctx,9,4,flip?hair:skin,s); px(ctx,10,4,hair,s);
        px(ctx,6,5,hair,s); px(ctx,7,5,flip?skin:hair,s); px(ctx,8,5,skin,s); px(ctx,9,5,flip?hair:skin,s); px(ctx,10,5,hair,s);
        if (blindfold) {
            px(ctx,7,5,'#eee',s); px(ctx,8,5,'#eee',s); px(ctx,9,5,'#eee',s);
        } else {
            px(ctx, flip?9:7, 5, eyes, s);
        }
        px(ctx,6,6,hair,s); px(ctx,7,6,skin,s); px(ctx,8,6,skin,s); px(ctx,9,6,skin,s); px(ctx,10,6,hair,s);
        px(ctx,7,7,skin,s); px(ctx,8,7,skin,s); px(ctx,9,7,skin,s);
        px(ctx, flip?10:6, 9, skin, s);
    }
}

// Character presets
const CHAR_PRESETS = {
    player: { hair:'#1a1a3a', skin:'#deb887', shirt:'#312e81', pants:'#1e1b4b', eyes:'#8b5cf6' },
    gojo:   { hair:'#e0e7ff', skin:'#f5deb3', shirt:'#1a1a2e', pants:'#111', eyes:'#4fc3f7', blindfold:true },
    geto:   { hair:'#1a1a1a', skin:'#deb887', shirt:'#2a1a3a', pants:'#1a1a2a', eyes:'#333' },
    sukuna: { hair:'#ffb6c1', skin:'#deb887', shirt:'#4a1a1a', pants:'#2a0a0a', eyes:'#dc2626', marks:true },
    mahoraga:{ hair:'#4a4a4a', skin:'#8a8a7a', shirt:'#3a3a2a', pants:'#2a2a1a', eyes:'#fbbf24' },
    npc_master: { hair:'#aaaaaa', skin:'#deb887', shirt:'#3a2a1a', pants:'#2a1a0a', eyes:'#666' },
    npc_student: { hair:'#333', skin:'#deb887', shirt:'#1a3a5a', pants:'#1a2a3a', eyes:'#555' },
    cursed_spirit: { hair:'#2a0a3a', skin:'#4a1a5a', shirt:'#3a0a4a', pants:'#2a0a3a', eyes:'#ff0044' },
    guardian: { hair:'#0a3a5a', skin:'#3a6a8a', shirt:'#1a4a6a', pants:'#0a3a5a', eyes:'#22d3ee' },
    domain_master: { hair:'#5a3a1a', skin:'#c8a882', shirt:'#1a0a2a', pants:'#0a0a1a', eyes:'#c084fc' },
};

// Draw a character given preset name, direction, and frame
function drawChar(ctx, presetName, x, y, dir, frame) {
    const p = CHAR_PRESETS[presetName] || CHAR_PRESETS.player;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = 32; tmpCanvas.height = 32;
    const tmpCtx = tmpCanvas.getContext('2d');
    drawCharSprite(tmpCtx, { ...p, dir, frame });
    ctx.drawImage(tmpCanvas, x, y, T, T);
}

// Draw tile decorations
function drawTile(ctx, type, x, y) {
    const c = TILE_COLORS[type] || '#111';
    ctx.fillStyle = c;
    ctx.fillRect(x, y, T, T);

    // Add details based on tile type
    switch(type) {
        case 'F': case 'g': // grass
            ctx.fillStyle = '#2a4a2a';
            if ((x+y)%97<20) { ctx.fillRect(x+4,y+8,2,4); ctx.fillRect(x+20,y+16,2,4); }
            if ((x+y)%73<15) { ctx.fillRect(x+14,y+6,2,3); }
            break;
        case 'G': // dark grass
            ctx.fillStyle = '#0a2a0a';
            ctx.fillRect(x+6,y+10,2,4); ctx.fillRect(x+22,y+20,2,3);
            break;
        case 'P': case 'p': // path
            ctx.fillStyle = '#4a3a22';
            if ((x*7+y*13)%100<25) ctx.fillRect(x+randInt(2,26),y+randInt(2,26),3,2);
            break;
        case 'W': case 'B': // wall
            ctx.strokeStyle = '#2a2a4a';
            ctx.strokeRect(x+0.5,y+0.5,T-1,T-1);
            break;
        case 'w': // water
            ctx.fillStyle = '#2a3a5a';
            const waveOff = Math.sin(G.time*2 + x*0.1)*3;
            ctx.fillRect(x, y+14+waveOff, T, 2);
            break;
        case 'T': // tree top
            ctx.fillStyle = '#0a3a0a';
            ctx.beginPath();
            ctx.arc(x+16, y+16, 14, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#0a2a0a';
            ctx.beginPath();
            ctx.arc(x+12, y+14, 8, 0, Math.PI*2);
            ctx.fill();
            break;
        case 't': // tree trunk
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(x+12, y, 8, T);
            break;
        case 'd': // door
            ctx.fillStyle = '#6a4a1a';
            ctx.fillRect(x+4, y+2, 24, 28);
            ctx.fillStyle = '#8a6a2a';
            ctx.fillRect(x+6, y+4, 20, 24);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(x+22, y+14, 3, 3);
            break;
        case 'L': // lava
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(x+2,y+2,T-4,T-4);
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(x+8,y+8,T-16,T-16);
            break;
        case 'A': // arena
            ctx.strokeStyle = '#3a2a5a';
            ctx.strokeRect(x+0.5,y+0.5,T-1,T-1);
            break;
        case 'R': // red boss floor
            ctx.fillStyle = '#3a1a1a';
            ctx.strokeStyle = '#4a1a2a';
            ctx.strokeRect(x+0.5,y+0.5,T-1,T-1);
            break;
        case 'I': // portal
            ctx.fillStyle = '#8b5cf6';
            ctx.globalAlpha = 0.4 + Math.sin(G.time*3)*0.2;
            ctx.beginPath();
            ctx.arc(x+16, y+16, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
            break;
        case 'D': // dark cave floor
            ctx.fillStyle = '#1a1a2a';
            if ((x+y)%80<10) ctx.fillRect(x+10,y+10,4,4);
            break;
    }
}

// Draw health bar above entity
function drawHealthBar(ctx, x, y, hp, maxHp, w = 28) {
    const bx = x + (T - w) / 2, by = y - 6;
    ctx.fillStyle = '#000';
    ctx.fillRect(bx-1, by-1, w+2, 5);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(bx, by, w, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx, by, w * (hp/maxHp), 3);
}

// Draw interaction indicator (!)
function drawInteractIcon(ctx, x, y) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('!', x + 16, y - 4 + Math.sin(G.time*4)*3);
}

// Draw attack effect
function drawAttackEffect(ctx, x, y, dir, color = '#8b5cf6') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    if (dir === 0) { ctx.arc(x+16, y+40, 14, -0.5, Math.PI+0.5); }
    else if (dir === 1) { ctx.arc(x+16, y-8, 14, 0.5, Math.PI*2-0.5); }
    else if (dir === 2) { ctx.arc(x-8, y+16, 14, -1, 1); }
    else { ctx.arc(x+40, y+16, 14, Math.PI-1, Math.PI+1); }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
}
