/**
 * v0.8 合成/拼字核心
 * 三招：词型固定底分 · 武将改规则 · 摆位/融合连锁
 * 无扑克、无塔防。
 */

export const COLS = 4;
export const ROWS = 3;
export const SLOT_COUNT = COLS * ROWS; // 12
export const PROTO_V = '0.8';

/** 同字升阶链（融合升级，底分随阶升高） */
export const TIER_CHAINS = {
  兵: ['兵', '将', '帅'],
  刀: ['刀', '利刃', '神兵'],
  枪: ['枪', '长枪', '方天'],
  弓: ['弓', '强弓', '连弩'],
  马: ['马', '战马', '赤兔'],
  盾: ['盾', '坚盾', '铁壁'],
};

/** 拼字规则 */
export const SPELL_RECIPES = [
  { chars: ['关', '羽'], result: '关羽', ordered: false },
  { chars: ['张', '飞'], result: '张飞', ordered: false },
  { chars: ['赵', '云'], result: '赵云', ordered: false },
  { chars: ['诸', '葛'], result: '诸葛', ordered: false },
  { chars: ['诸葛', '亮'], result: '诸葛亮', ordered: false },
  { chars: ['刘', '备'], result: '刘备', ordered: false },
  { chars: ['曹', '操'], result: '曹操', ordered: false },
  { chars: ['周', '瑜'], result: '周瑜', ordered: false },
  { chars: ['吕', '布'], result: '吕布', ordered: false },
];

/** 部首标签（同部首连锁） */
export const RADICAL_OF = {
  兵: '力', 将: '力', 帅: '力',
  刀: '刀', 利刃: '刀', 神兵: '刀',
  枪: '木', 长枪: '木', 方天: '木',
  弓: '弓', 强弓: '弓', 连弩: '弓',
  马: '马', 战马: '马', 赤兔: '马',
  盾: '盾', 坚盾: '盾', 铁壁: '盾',
  关: '门', 羽: '羽', 张: '弓', 飞: '飞',
  赵: '走', 云: '雨', 诸: '言', 葛: '艹', 亮: '亠',
  刘: '刀', 备: '人', 曹: '曰', 操: '手',
  周: '口', 瑜: '玉', 吕: '口', 布: '巾', 义: '羊',
  诸葛: '言',
  关羽: '门', 张飞: '弓', 赵云: '走', 诸葛亮: '言',
  刘备: '刀', 曹操: '曰', 周瑜: '口', 吕布: '口',
};

/**
 * 词型表（Demonic Mahjong 风格：固定底分 + 基础倍率）
 * 难度越高底分越高；不用扑克牌型。
 */
export const WORD_TYPES = {
  single:   { id: 'single',   name: '单字',     base: 2,  mult: 1,   pri: 1 },
  twin:     { id: 'twin',     name: '叠字',     base: 10, mult: 1.5, pri: 2 },
  radical:  { id: 'radical',  name: '同部首',   base: 16, mult: 1.5, pri: 3 },
  faction:  { id: 'faction',  name: '同阵营',   base: 22, mult: 2,   pri: 4 },
  tier3:    { id: 'tier3',    name: '满阶兵械', base: 28, mult: 1.5, pri: 4 },
  hero:     { id: 'hero',     name: '武将名',   base: 40, mult: 2,   pri: 5 },
  idiom_zq: { id: 'idiom_zq', name: '单骑救主', base: 55, mult: 2.5, pri: 6 }, // 赵云
  idiom_sg: { id: 'idiom_sg', name: '三顾茅庐', base: 70, mult: 3,   pri: 7 }, // 刘备+诸葛亮
  idiom_cc: { id: 'idiom_cc', name: '草船借箭', base: 75, mult: 3,   pri: 7 }, // 诸葛亮+弓系
  idiom_ty: { id: 'idiom_ty', name: '桃园结义', base: 90, mult: 3.5, pri: 8 }, // 刘+关+张
  idiom_hl: { id: 'idiom_hl', name: '温酒斩将', base: 60, mult: 2.5, pri: 6 }, // 关羽+刀/神兵
};

/** 武将规则改写器（CloverPit 护符风格）≥6 */
export const HERO_RULES = {
  关羽: {
    faction: 'shu',
    desc: '邻接「义」字：额外结算一轮（战力再加一次）',
    short: '邻义再结算',
  },
  张飞: {
    faction: 'shu',
    desc: '同阵营邻接连锁：起始连锁倍率 +1',
    short: '连锁起手+1',
  },
  赵云: {
    faction: 'qun',
    desc: '棋盘边缘格上的字底分按两次计',
    short: '边缘字×2',
  },
  诸葛亮: {
    faction: 'shu',
    desc: '成语/典故词型倍率 ×2',
    short: '成语倍率×2',
  },
  刘备: {
    faction: 'shu',
    desc: '蜀国武将词型底分 ×1.5',
    short: '蜀将底分×1.5',
  },
  曹操: {
    faction: 'wei',
    desc: '魏国字可作万能字参与拼字',
    short: '魏字万能',
  },
  周瑜: {
    faction: 'wu',
    desc: '每级连锁额外 +0.5 倍率',
    short: '连锁+0.5/级',
  },
  吕布: {
    faction: 'qun',
    desc: '场上仅一名武将时，总倍率 ×2',
    short: '独将倍率×2',
  },
};

/** 单位模板 */
export const UNIT_STATS = {
  兵: { base: 4, mult: 0, kind: 'pawn', star: 1 },
  将: { base: 14, mult: 0, kind: 'pawn', star: 2 },
  帅: { base: 32, mult: 0, kind: 'pawn', star: 3 },
  刀: { base: 5, mult: 0, kind: 'pawn', star: 1 },
  利刃: { base: 12, mult: 0, kind: 'pawn', star: 2 },
  神兵: { base: 28, mult: 0, kind: 'pawn', star: 3 },
  枪: { base: 5, mult: 0, kind: 'pawn', star: 1 },
  长枪: { base: 12, mult: 0, kind: 'pawn', star: 2 },
  方天: { base: 28, mult: 0, kind: 'pawn', star: 3 },
  弓: { base: 5, mult: 0, kind: 'pawn', star: 1 },
  强弓: { base: 12, mult: 0, kind: 'pawn', star: 2 },
  连弩: { base: 28, mult: 0, kind: 'pawn', star: 3 },
  马: { base: 6, mult: 0, kind: 'pawn', star: 1 },
  战马: { base: 14, mult: 0, kind: 'pawn', star: 2 },
  赤兔: { base: 30, mult: 0, kind: 'pawn', star: 3 },
  盾: { base: 6, mult: 0, kind: 'pawn', star: 1 },
  坚盾: { base: 14, mult: 0, kind: 'pawn', star: 2 },
  铁壁: { base: 30, mult: 0, kind: 'pawn', star: 3 },
  关: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  羽: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  张: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  飞: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  赵: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  云: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  诸: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  葛: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  亮: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  刘: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  备: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  曹: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  操: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  周: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  瑜: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  吕: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  布: { base: 1, mult: 0, kind: 'glyph', star: 1 },
  义: { base: 3, mult: 0, kind: 'glyph', star: 1, special: 'yi' },
  诸葛: { base: 8, mult: 0, kind: 'mid', star: 1 },
  关羽: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'shu' },
  张飞: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'shu' },
  赵云: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'qun' },
  诸葛亮: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'shu' },
  刘备: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'shu' },
  曹操: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'wei' },
  周瑜: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'wu' },
  吕布: { base: 0, mult: 0, kind: 'hero', star: 1, faction: 'qun' },
};

/** 抽字权重池 */
export const DRAW_POOL = [
  ...Array(7).fill('兵'),
  ...Array(3).fill('刀'),
  ...Array(3).fill('枪'),
  ...Array(3).fill('弓'),
  ...Array(2).fill('马'),
  ...Array(2).fill('盾'),
  ...Array(4).fill('关'),
  ...Array(4).fill('羽'),
  ...Array(4).fill('张'),
  ...Array(4).fill('飞'),
  ...Array(3).fill('赵'),
  ...Array(3).fill('云'),
  ...Array(3).fill('诸'),
  ...Array(3).fill('葛'),
  ...Array(3).fill('亮'),
  ...Array(2).fill('刘'),
  ...Array(2).fill('备'),
  ...Array(2).fill('曹'),
  ...Array(2).fill('操'),
  ...Array(2).fill('周'),
  ...Array(2).fill('瑜'),
  ...Array(2).fill('吕'),
  ...Array(2).fill('布'),
  ...Array(3).fill('义'),
];

/**
 * 关卡（sim 校准后可调）
 * 目标：前两关 basic 高通关，第三关需动脑
 */
export const STAGES = [
  { id: 'hj1', name: '黄巾 · 小关1', target: 120, draws: 15, boss: null,
    hint: '抽字→点两格合成。拼出武将或升阶拿词型分',
    guide: true },
  { id: 'hj2', name: '黄巾 · 小关2', target: 300, draws: 15, boss: null,
    hint: '摆邻接触发连锁；成语词型分更高' },
  { id: 'hlg', name: 'Boss · 虎牢关', target: 560, draws: 16,
    boss: { needHero: true, text: '虎牢关：场上至少一名武将才计战力' },
    hint: '必须留武将；用规则改写叠连锁' },
];

let _uid = 1;
export function resetUid(n = 1) { _uid = n; }

export function makeUnit(name, star = null) {
  const tpl = UNIT_STATS[name];
  if (!tpl) throw new Error('unknown unit ' + name);
  const s = star || tpl.star || 1;
  const starMul = Math.pow(1.5, s - 1);
  const base = Math.round((tpl.base || 0) * starMul);
  return {
    id: 'u' + (_uid++),
    name,
    kind: tpl.kind,
    faction: tpl.faction || null,
    star: s,
    base,
    mult: tpl.mult || 0,
    multBonus: tpl.kind === 'hero' ? (s - 1) : 0,
    radical: RADICAL_OF[name] || null,
    special: tpl.special || null,
  };
}

export function emptyBoard() {
  return Array(SLOT_COUNT).fill(null);
}

export function findEmpty(slots) {
  const idx = [];
  for (let i = 0; i < slots.length; i++) if (!slots[i]) idx.push(i);
  return idx;
}

export function drawChar(rng = Math.random) {
  return DRAW_POOL[Math.floor(rng() * DRAW_POOL.length)];
}

export function spawnInto(slots, rng = Math.random) {
  const empty = findEmpty(slots);
  if (!empty.length) return { slots, spawned: null, index: -1 };
  const i = empty[Math.floor(rng() * empty.length)];
  const name = drawChar(rng);
  const next = slots.slice();
  next[i] = makeUnit(name);
  return { slots: next, spawned: next[i], index: i };
}

export function idxToRC(i) {
  return { r: Math.floor(i / COLS), c: i % COLS };
}

export function isEdge(i) {
  const { r, c } = idxToRC(i);
  return r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
}

export function neighbors(i) {
  const { r, c } = idxToRC(i);
  const out = [];
  if (r > 0) out.push(i - COLS);
  if (r < ROWS - 1) out.push(i + COLS);
  if (c > 0) out.push(i - 1);
  if (c < COLS - 1) out.push(i + 1);
  return out;
}

function nextTierName(name) {
  for (const chain of Object.values(TIER_CHAINS)) {
    const i = chain.indexOf(name);
    if (i >= 0 && i < chain.length - 1) return chain[i + 1];
  }
  return null;
}

function heroesOnBoard(slots) {
  return slots.filter(u => u && u.kind === 'hero');
}

function hasHeroNamed(slots, name) {
  return slots.some(u => u && u.name === name);
}

/** 曹操：魏国字可作万能字 —— 检查拼字时用 */
function isWeiWild(slots, unit) {
  if (!hasHeroNamed(slots, '曹操')) return false;
  if (!unit) return false;
  // 魏国单字部件：曹、操；以及魏武将本身不算原料
  // 规则：场上任意「glyph/pawn」若名字属于魏相关，或我们把「曹」「操」当魏字；
  // 更宽：有曹操时，任意非英雄单字可替代配方缺的一边（简化：任意 glyph 可当万能）
  // 按文案「同阵营字」= 魏阵营字。给曹/操打上 wei，并允许它们替代。
  return unit.name === '曹' || unit.name === '操' || unit.faction === 'wei';
}

function findSpell(a, b, slots) {
  const names = [a.name, b.name];
  for (const r of SPELL_RECIPES) {
    const [x, y] = r.chars;
    if ((names[0] === x && names[1] === y) || (names[0] === y && names[1] === x)) {
      return r.result;
    }
  }
  // 曹操万能：一侧是配方字，另一侧是魏字万能
  if (hasHeroNamed(slots, '曹操')) {
    for (const r of SPELL_RECIPES) {
      const [x, y] = r.chars;
      const aWild = isWeiWild(slots, a);
      const bWild = isWeiWild(slots, b);
      if (aWild && (b.name === x || b.name === y)) return r.result;
      if (bWild && (a.name === x || a.name === y)) return r.result;
      // 两万能不合成武将，避免滥爆
    }
  }
  return null;
}

/**
 * 尝试合成 i 与 j（j 位置成为结果，i 清空）
 */
export function tryMerge(slots, i, j) {
  if (i === j) return { ok: false, reason: 'same_slot' };
  if (i < 0 || j < 0 || i >= slots.length || j >= slots.length) return { ok: false, reason: 'oob' };
  const a = slots[i];
  const b = slots[j];
  if (!a || !b) return { ok: false, reason: 'empty' };

  if (a.name === b.name && (a.kind === 'hero' || a.kind === 'mid')) {
    const star = Math.min(3, Math.max(a.star, b.star) + 1);
    const unit = makeUnit(a.name, star);
    const next = slots.slice();
    next[i] = null;
    next[j] = unit;
    return { ok: true, slots: next, result: unit, kind: 'star', reason: '升星', at: j };
  }

  const spelled = findSpell(a, b, slots);
  if (spelled) {
    const unit = makeUnit(spelled);
    const next = slots.slice();
    next[i] = null;
    next[j] = unit;
    return { ok: true, slots: next, result: unit, kind: 'spell', reason: '组字·' + spelled, at: j };
  }

  if (a.name === b.name) {
    const up = nextTierName(a.name);
    if (up) {
      const unit = makeUnit(up);
      const next = slots.slice();
      next[i] = null;
      next[j] = unit;
      return { ok: true, slots: next, result: unit, kind: 'tier', reason: '升阶·' + up, at: j };
    }
    return { ok: false, reason: 'max_tier' };
  }

  return { ok: false, reason: 'no_recipe' };
}

/**
 * 检测词型（可叠加多条，按 pri 排序）
 * @returns {Array<{type, indices, base, mult, name}>}
 */
export function detectWordTypes(slots) {
  const patterns = [];
  const heroes = [];
  const filled = [];
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) continue;
    filled.push(i);
    if (slots[i].kind === 'hero') heroes.push({ i, u: slots[i] });
  }

  const names = new Set(heroes.map(h => h.u.name));

  // 成语（高优先，占用人名后仍各自计武将名）
  if (names.has('刘备') && names.has('关羽') && names.has('张飞')) {
    const idx = heroes.filter(h => ['刘备', '关羽', '张飞'].includes(h.u.name)).map(h => h.i);
    const t = WORD_TYPES.idiom_ty;
    patterns.push({ type: t.id, name: t.name, indices: idx, base: t.base, mult: t.mult, pri: t.pri });
  }
  if (names.has('刘备') && names.has('诸葛亮')) {
    const idx = heroes.filter(h => ['刘备', '诸葛亮'].includes(h.u.name)).map(h => h.i);
    const t = WORD_TYPES.idiom_sg;
    patterns.push({ type: t.id, name: t.name, indices: idx, base: t.base, mult: t.mult, pri: t.pri });
  }
  if (names.has('诸葛亮')) {
    const bowIdx = [];
    for (let i = 0; i < slots.length; i++) {
      const n = slots[i]?.name;
      if (n === '弓' || n === '强弓' || n === '连弩') bowIdx.push(i);
    }
    if (bowIdx.length) {
      const hi = heroes.find(h => h.u.name === '诸葛亮').i;
      const t = WORD_TYPES.idiom_cc;
      patterns.push({ type: t.id, name: t.name, indices: [hi, ...bowIdx], base: t.base, mult: t.mult, pri: t.pri });
    }
  }
  if (names.has('赵云')) {
    const hi = heroes.find(h => h.u.name === '赵云').i;
    const t = WORD_TYPES.idiom_zq;
    patterns.push({ type: t.id, name: t.name, indices: [hi], base: t.base, mult: t.mult, pri: t.pri });
  }
  if (names.has('关羽')) {
    const blade = [];
    for (let i = 0; i < slots.length; i++) {
      const n = slots[i]?.name;
      if (n === '刀' || n === '利刃' || n === '神兵') blade.push(i);
    }
    if (blade.length) {
      const hi = heroes.find(h => h.u.name === '关羽').i;
      const t = WORD_TYPES.idiom_hl;
      patterns.push({ type: t.id, name: t.name, indices: [hi, ...blade], base: t.base, mult: t.mult, pri: t.pri });
    }
  }

  // 武将名
  for (const h of heroes) {
    const t = WORD_TYPES.hero;
    let base = t.base;
    // 升星抬底分
    if (h.u.star > 1) base = Math.round(base * Math.pow(1.35, h.u.star - 1));
    patterns.push({ type: t.id, name: t.name + '·' + h.u.name, indices: [h.i], base, mult: t.mult, pri: t.pri, hero: h.u.name });
  }

  // 满阶兵械
  for (let i = 0; i < slots.length; i++) {
    const u = slots[i];
    if (!u || u.kind !== 'pawn') continue;
    const chain = Object.values(TIER_CHAINS).find(c => c.includes(u.name));
    if (chain && chain[chain.length - 1] === u.name) {
      const t = WORD_TYPES.tier3;
      patterns.push({ type: t.id, name: t.name + '·' + u.name, indices: [i], base: t.base + u.base, mult: t.mult, pri: t.pri });
    }
  }

  // 同阵营 ≥3 武将
  const byFac = {};
  for (const h of heroes) {
    const f = h.u.faction || 'x';
    if (!byFac[f]) byFac[f] = [];
    byFac[f].push(h.i);
  }
  for (const [f, idx] of Object.entries(byFac)) {
    if (idx.length >= 2) {
      const t = WORD_TYPES.faction;
      patterns.push({
        type: t.id, name: t.name + '·' + ({ shu: '蜀', wei: '魏', wu: '吴', qun: '群' }[f] || f),
        indices: idx, base: t.base * (idx.length - 1), mult: t.mult + (idx.length - 2) * 0.5, pri: t.pri,
      });
    }
  }

  // 同部首 ≥3
  const byRad = {};
  for (let i = 0; i < slots.length; i++) {
    const u = slots[i];
    if (!u || !u.radical) continue;
    if (!byRad[u.radical]) byRad[u.radical] = [];
    byRad[u.radical].push(i);
  }
  for (const [rad, idx] of Object.entries(byRad)) {
    if (idx.length >= 3) {
      const t = WORD_TYPES.radical;
      patterns.push({ type: t.id, name: t.name + '·' + rad, indices: idx, base: t.base + idx.length * 2, mult: t.mult, pri: t.pri });
    }
  }

  // 叠字：相邻同名
  const seenTwin = new Set();
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) continue;
    for (const j of neighbors(i)) {
      if (j < i || !slots[j]) continue;
      if (slots[i].name === slots[j].name) {
        const key = slots[i].name + ':' + i + '-' + j;
        if (seenTwin.has(key)) continue;
        seenTwin.add(key);
        const t = WORD_TYPES.twin;
        patterns.push({ type: t.id, name: t.name + '·' + slots[i].name, indices: [i, j], base: t.base, mult: t.mult, pri: t.pri });
      }
    }
  }

  // 单字底分：每个非英雄格子贡献 unit.base 作为「单字」补充（英雄靠词型）
  for (let i = 0; i < slots.length; i++) {
    const u = slots[i];
    if (!u) continue;
    if (u.kind === 'hero') continue;
    const t = WORD_TYPES.single;
    patterns.push({ type: t.id, name: t.name + '·' + u.name, indices: [i], base: t.base, mult: t.mult, pri: t.pri });
  }

  patterns.sort((a, b) => b.pri - a.pri);
  return patterns;
}

/**
 * 邻接连锁：同阵营或同部首相邻，BFS 成串，每级倍率递增
 * 返回 { chains: [{indices, level, reason}], chainMult }
 */
export function detectChains(slots) {
  const visited = new Set();
  const chains = [];
  for (let start = 0; start < slots.length; start++) {
    if (!slots[start] || visited.has(start)) continue;
    const seed = slots[start];
    const group = [];
    const q = [start];
    visited.add(start);
    while (q.length) {
      const cur = q.shift();
      group.push(cur);
      for (const n of neighbors(cur)) {
        if (visited.has(n) || !slots[n]) continue;
        const a = slots[cur];
        const b = slots[n];
        const sameFac = a.faction && b.faction && a.faction === b.faction;
        const sameRad = a.radical && b.radical && a.radical === b.radical;
        const sameName = a.name === b.name;
        if (sameFac || sameRad || sameName) {
          visited.add(n);
          q.push(n);
        }
      }
    }
    if (group.length >= 2) {
      const level = group.length - 1; // 2格=1级连锁
      const reason = seed.faction ? '同阵' : (seed.radical ? '同部' : '同名');
      chains.push({ indices: group, level, reason });
    }
  }
  return chains;
}

/**
 * 完整结算（词型 + 武将改规则 + 连锁）
 * 返回动画步骤 steps[]
 */
export function settleBoard(slots, stage = null) {
  const steps = [];
  const patterns = detectWordTypes(slots);
  const chains = detectChains(slots);
  const heroes = heroesOnBoard(slots);
  const heroNames = new Set(heroes.map(h => h.name));

  let base = 0;
  let mult = 1;
  const notes = [];
  const usedIndices = new Set();

  // —— 词型累计 ——
  for (const p of patterns) {
    // 单字与高阶词型可叠加；成语与武将名可叠加
    let b = p.base;
    let m = p.mult;

    // 诸葛亮：成语倍率×2
    if (heroNames.has('诸葛亮') && String(p.type).startsWith('idiom')) {
      m *= 2;
      notes.push('诸葛·成语×2');
    }
    // 刘备：蜀将词型底分×1.5
    if (heroNames.has('刘备') && p.type === 'hero') {
      const h = slots[p.indices[0]];
      if (h && h.faction === 'shu') {
        b = Math.round(b * 1.5);
        notes.push('刘备·蜀将底分×1.5');
      }
    }

    base += b;
    // 词型倍率：采用「累加超额」避免爆炸：mult += (m - 1)
    mult += (m - 1);
    steps.push({
      kind: 'pattern',
      name: p.name,
      indices: p.indices,
      addBase: b,
      addMult: m - 1,
      base, mult,
    });
    p.indices.forEach(i => usedIndices.add(i));
  }

  // 赵云：边缘字底分再计一次（对非英雄格）
  if (heroNames.has('赵云')) {
    let edgeBonus = 0;
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i] || slots[i].kind === 'hero') continue;
      if (isEdge(i)) {
        edgeBonus += WORD_TYPES.single.base + Math.floor(slots[i].base / 2);
      }
    }
    if (edgeBonus) {
      base += edgeBonus;
      notes.push('赵云·边缘+' + edgeBonus);
      steps.push({ kind: 'rule', name: '赵云·边缘字×2', indices: [...Array(SLOT_COUNT).keys()].filter(isEdge), addBase: edgeBonus, addMult: 0, base, mult });
    }
  }

  // 张飞：连锁起始 +1
  let chainStartBonus = heroNames.has('张飞') ? 1 : 0;
  // 周瑜：每级 +0.5
  const zhouyuBonus = heroNames.has('周瑜') ? 0.5 : 0;

  let chainMultAdd = 0;
  for (const ch of chains) {
    const level = ch.level;
    // 每级递增：1级 +0.5，2级 +1.0，3级 +1.5... 再加张飞起手、周瑜
    let add = 0;
    for (let lv = 1; lv <= level; lv++) {
      add += 0.5 * lv;
    }
    add += chainStartBonus;
    add += zhouyuBonus * level;
    chainMultAdd += add;
    steps.push({
      kind: 'chain',
      name: `连锁×${level}（${ch.reason}）`,
      indices: ch.indices,
      level,
      addBase: 0,
      addMult: add,
      base,
      mult: mult + chainMultAdd,
    });
    notes.push(`连锁${level}级+${add.toFixed(1)}`);
  }
  mult += chainMultAdd;

  // 吕布：独将倍率×2
  if (heroNames.has('吕布') && heroes.length === 1) {
    mult *= 2;
    notes.push('吕布·独将×2');
    steps.push({ kind: 'rule', name: '吕布·独将倍率×2', indices: heroes.map((_, i) => slots.indexOf(heroes[i])).filter(i => i >= 0), addBase: 0, addMult: 0, base, mult, flag: 'lvbu' });
  }

  // 关羽：邻接「义」→ 额外一轮（把当前 base*mult 再加一遍）
  let extraRound = 0;
  if (heroNames.has('关羽')) {
    const gyIdx = slots.findIndex(u => u && u.name === '关羽');
    if (gyIdx >= 0) {
      const hasYi = neighbors(gyIdx).some(n => slots[n] && slots[n].name === '义');
      if (hasYi) {
        extraRound = Math.round(base * Math.max(1, mult));
        notes.push('关羽·邻义再结算+' + extraRound);
        steps.push({ kind: 'extra', name: '关羽·义字再结算', indices: [gyIdx, ...neighbors(gyIdx).filter(n => slots[n]?.name === '义')], addBase: 0, addMult: 0, extra: extraRound, base, mult });
      }
    }
  }

  mult = Math.max(1, Math.round(mult * 10) / 10);
  let power = Math.round(base * mult) + extraRound;

  // Boss 无武将
  let blocked = false;
  if (stage?.boss?.needHero && heroes.length === 0) {
    blocked = true;
    power = 0;
  }

  return {
    baseSum: Math.round(base),
    mult,
    power,
    patterns,
    chains,
    notes: [...new Set(notes)],
    steps,
    units: slots.filter(Boolean),
    heroes,
    blocked,
    extraRound,
  };
}

/** 兼容旧名 */
export function calcPower(slots) {
  const s = settleBoard(slots, null);
  return { baseSum: s.baseSum, mult: s.mult, power: s.power, units: s.units };
}

export function effectivePower(slots, stage) {
  return settleBoard(slots, stage);
}

export function basicMergePick(slots) {
  // 优先拼字/升星，其次升阶；偏好邻接合成
  const scored = [];
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) continue;
    for (let j = 0; j < slots.length; j++) {
      if (i === j || !slots[j]) continue;
      const r = tryMerge(slots, i, j);
      if (!r.ok) continue;
      let score = r.kind === 'spell' ? 100 : r.kind === 'star' ? 90 : 40;
      // 邻接加分
      if (neighbors(i).includes(j)) score += 15;
      // 拼完后若能成成语再加
      if (r.kind === 'spell') {
        const after = settleBoard(r.slots);
        score += after.patterns.filter(p => String(p.type).startsWith('idiom')).length * 30;
        score += after.chains.reduce((s, c) => s + c.level, 0) * 5;
      }
      scored.push({ i, j, r, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

export function heroRuleList() {
  return Object.entries(HERO_RULES).map(([name, r]) => ({ name, ...r }));
}

export default {
  COLS, ROWS, SLOT_COUNT, PROTO_V, STAGES, UNIT_STATS, SPELL_RECIPES, TIER_CHAINS,
  WORD_TYPES, HERO_RULES, DRAW_POOL,
  makeUnit, calcPower, settleBoard, detectWordTypes, detectChains,
  emptyBoard, spawnInto, tryMerge, effectivePower, basicMergePick, drawChar, resetUid,
  neighbors, isEdge, heroRuleList,
};
