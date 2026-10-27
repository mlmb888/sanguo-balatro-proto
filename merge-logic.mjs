/**
 * v0.7 合成/拼字核心逻辑（无扑克、无塔防）
 * 导出纯函数，供单测与页面共用。
 */

export const COLS = 4;
export const ROWS = 3;
export const SLOT_COUNT = COLS * ROWS; // 12

/** 同字升阶链 */
export const TIER_CHAINS = {
  兵: ['兵', '锐', '将'],
  刀: ['刀', '利刃', '神兵'],
  枪: ['枪', '长枪', '方天'],
  弓: ['弓', '强弓', '连弩'],
  马: ['马', '战马', '赤兔'],
  盾: ['盾', '坚盾', '铁壁'],
};

/** 拼字规则：两格按顺序或无序拼成中间体/武将 */
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

/** 单位模板：底分 + 倍率贡献 */
export const UNIT_STATS = {
  // 基础兵械
  兵: { base: 3, mult: 0, kind: 'pawn', star: 1 },
  锐: { base: 8, mult: 0, kind: 'pawn', star: 2 },
  将: { base: 18, mult: 0, kind: 'pawn', star: 3 },
  刀: { base: 4, mult: 0, kind: 'pawn', star: 1 },
  利刃: { base: 10, mult: 0, kind: 'pawn', star: 2 },
  神兵: { base: 22, mult: 0, kind: 'pawn', star: 3 },
  枪: { base: 4, mult: 0, kind: 'pawn', star: 1 },
  长枪: { base: 10, mult: 0, kind: 'pawn', star: 2 },
  方天: { base: 22, mult: 0, kind: 'pawn', star: 3 },
  弓: { base: 4, mult: 0, kind: 'pawn', star: 1 },
  强弓: { base: 10, mult: 0, kind: 'pawn', star: 2 },
  连弩: { base: 22, mult: 0, kind: 'pawn', star: 3 },
  马: { base: 5, mult: 0, kind: 'pawn', star: 1 },
  战马: { base: 12, mult: 0, kind: 'pawn', star: 2 },
  赤兔: { base: 26, mult: 0, kind: 'pawn', star: 3 },
  盾: { base: 5, mult: 0, kind: 'pawn', star: 1 },
  坚盾: { base: 12, mult: 0, kind: 'pawn', star: 2 },
  铁壁: { base: 26, mult: 0, kind: 'pawn', star: 3 },
  // 单字（名部件）弱战力，主要为合成
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
  诸葛: { base: 6, mult: 1, kind: 'mid', star: 1 },
  // 武将：底分 + 倍率（挂在单位上）
  关羽: { base: 28, mult: 2, kind: 'hero', star: 1, faction: 'shu' },
  张飞: { base: 32, mult: 1, kind: 'hero', star: 1, faction: 'shu' },
  赵云: { base: 24, mult: 2, kind: 'hero', star: 1, faction: 'qun' },
  诸葛亮: { base: 20, mult: 3, kind: 'hero', star: 1, faction: 'shu' },
  刘备: { base: 22, mult: 2, kind: 'hero', star: 1, faction: 'shu' },
  曹操: { base: 26, mult: 2, kind: 'hero', star: 1, faction: 'wei' },
  周瑜: { base: 24, mult: 2, kind: 'hero', star: 1, faction: 'wu' },
  吕布: { base: 36, mult: 1, kind: 'hero', star: 1, faction: 'qun' },
};

/** 抽字权重池 */
export const DRAW_POOL = [
  // 兵械常见
  ...Array(8).fill('兵'),
  ...Array(4).fill('刀'),
  ...Array(4).fill('枪'),
  ...Array(4).fill('弓'),
  ...Array(3).fill('马'),
  ...Array(3).fill('盾'),
  // 名将字
  ...Array(5).fill('关'),
  ...Array(5).fill('羽'),
  ...Array(5).fill('张'),
  ...Array(5).fill('飞'),
  ...Array(4).fill('赵'),
  ...Array(4).fill('云'),
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
];

export const STAGES = [
  { id: 'hj1', name: '黄巾 · 小关1', target: 80, draws: 14, boss: null, hint: '合成兵升阶，或拼出关羽' },
  { id: 'hj2', name: '黄巾 · 小关2', target: 160, draws: 16, boss: null, hint: '多武将叠倍率' },
  { id: 'hlg', name: 'Boss · 虎牢关', target: 240, draws: 18, boss: { needHero: true, text: '虎牢关：场上至少一名武将才计战力' }, hint: '必须留下武将' },
];

let _uid = 1;
export function resetUid(n = 1) { _uid = n; }

export function makeUnit(name, star = null) {
  const tpl = UNIT_STATS[name];
  if (!tpl) throw new Error('unknown unit ' + name);
  const s = star || tpl.star || 1;
  const starMul = Math.pow(1.5, s - 1);
  return {
    id: 'u' + (_uid++),
    name,
    kind: tpl.kind,
    faction: tpl.faction || null,
    star: s,
    base: Math.round(tpl.base * starMul),
    mult: tpl.mult, // 倍率按星：英雄每星 +0? keep mult flat, star buffs base only; or mult+ (s-1)
    // 英雄升星：倍率也 + (star-1)
    multBonus: tpl.kind === 'hero' ? (s - 1) : 0,
  };
}

export function unitMult(u) {
  return (u.mult || 0) + (u.multBonus || 0);
}

/** 战力 = 底分合计 × max(1, 倍率合计) */
export function calcPower(slots) {
  const units = slots.filter(Boolean);
  const baseSum = units.reduce((s, u) => s + u.base, 0);
  const multSum = units.reduce((s, u) => s + unitMult(u), 0);
  const mult = Math.max(1, multSum);
  return { baseSum, mult, power: baseSum * mult, units };
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

function nextTierName(name) {
  for (const chain of Object.values(TIER_CHAINS)) {
    const i = chain.indexOf(name);
    if (i >= 0 && i < chain.length - 1) return chain[i + 1];
  }
  return null;
}

function findSpell(a, b) {
  const names = [a.name, b.name];
  for (const r of SPELL_RECIPES) {
    const [x, y] = r.chars;
    if ((names[0] === x && names[1] === y) || (names[0] === y && names[1] === x)) {
      return r.result;
    }
  }
  return null;
}

/**
 * 尝试合成 i 与 j（j 位置成为结果，i 清空）
 * @returns {{ ok, slots, result, reason, kind }}
 */
export function tryMerge(slots, i, j) {
  if (i === j) return { ok: false, reason: 'same_slot' };
  if (i < 0 || j < 0 || i >= slots.length || j >= slots.length) return { ok: false, reason: 'oob' };
  const a = slots[i];
  const b = slots[j];
  if (!a || !b) return { ok: false, reason: 'empty' };

  // 1) 同名武将/中间体升星
  if (a.name === b.name && (a.kind === 'hero' || a.kind === 'mid')) {
    const star = Math.min(3, Math.max(a.star, b.star) + 1);
    const unit = makeUnit(a.name, star);
    const next = slots.slice();
    next[i] = null;
    next[j] = unit;
    return { ok: true, slots: next, result: unit, kind: 'star', reason: '升星' };
  }

  // 2) 拼字
  const spelled = findSpell(a, b);
  if (spelled) {
    const unit = makeUnit(spelled);
    const next = slots.slice();
    next[i] = null;
    next[j] = unit;
    return { ok: true, slots: next, result: unit, kind: 'spell', reason: '组字·' + spelled };
  }

  // 3) 同字升阶
  if (a.name === b.name) {
    const up = nextTierName(a.name);
    if (up) {
      const unit = makeUnit(up);
      const next = slots.slice();
      next[i] = null;
      next[j] = unit;
      return { ok: true, slots: next, result: unit, kind: 'tier', reason: '升阶·' + up };
    }
    // 已满阶：合成失败（或给一点底分？）— 失败
    return { ok: false, reason: 'max_tier' };
  }

  return { ok: false, reason: 'no_recipe' };
}

/** 有效战力（Boss 无武将则 0） */
export function effectivePower(slots, stage) {
  const { baseSum, mult, power, units } = calcPower(slots);
  if (stage?.boss?.needHero) {
    const hasHero = units.some(u => u.kind === 'hero');
    if (!hasHero) return { baseSum, mult, power: 0, units, blocked: true };
  }
  return { baseSum, mult, power, units, blocked: false };
}

/** 简单自动策略：能拼字就拼，否则同字升阶，否则随机 */
export function basicMergePick(slots) {
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) continue;
    for (let j = 0; j < slots.length; j++) {
      if (i === j || !slots[j]) continue;
      const r = tryMerge(slots, i, j);
      if (r.ok && (r.kind === 'spell' || r.kind === 'star')) return { i, j, r };
    }
  }
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) continue;
    for (let j = 0; j < slots.length; j++) {
      if (i === j || !slots[j]) continue;
      const r = tryMerge(slots, i, j);
      if (r.ok && r.kind === 'tier') return { i, j, r };
    }
  }
  return null;
}

export default {
  COLS, ROWS, SLOT_COUNT, STAGES, UNIT_STATS, SPELL_RECIPES, TIER_CHAINS,
  makeUnit, calcPower, emptyBoard, spawnInto, tryMerge, effectivePower, basicMergePick, drawChar, resetUid,
};
