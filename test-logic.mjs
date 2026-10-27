/** v0.3 headless tests — node test-logic.mjs */

const HAND_TYPES = [
  { id: 'straight_flush', name: '同花顺', base: 100, mult: 8, pri: 10 },
  { id: 'four', name: '金刚', base: 60, mult: 7, pri: 9 },
  { id: 'fullhouse', name: '葫芦', base: 40, mult: 4, pri: 8 },
  { id: 'combo', name: '组将', base: 40, mult: 4, pri: 7 },
  { id: 'flush', name: '同花', base: 35, mult: 4, pri: 6 },
  { id: 'straight', name: '顺子', base: 30, mult: 4, pri: 5 },
  { id: 'three', name: '三条', base: 30, mult: 3, pri: 4 },
  { id: 'mini_flush', name: '小同花', base: 20, mult: 3, pri: 3.5 },
  { id: 'twopair', name: '两对', base: 20, mult: 2, pri: 3 },
  { id: 'pair', name: '对子', base: 10, mult: 2, pri: 2 },
  { id: 'high', name: '高牌', base: 5, mult: 1, pri: 1 },
];
const GENERALS = {
  guanyu: { id:'guanyu', name:'关羽', faction:'shu', chars:['关','羽'] },
  zhangfei:{ id:'zhangfei', name:'张飞', faction:'shu', chars:['张','飞'] },
  zhaoyun:{ id:'zhaoyun', name:'赵云', faction:'qun', chars:['赵','云'] },
  zhuge:{ id:'zhuge', name:'诸葛亮', faction:'shu', chars:['诸','葛','亮'] },
};

function rankCounts(cards) {
  const m = {};
  for (const c of cards) m[c.rank] = (m[c.rank] || 0) + 1;
  return Object.values(m).sort((a,b) => b - a);
}
function isFlush(cards) {
  if (cards.length < 5) return false;
  const s = cards[0].suit;
  return cards.every(c => c.suit === s);
}
function isMiniFlush(cards) {
  if (cards.length < 3 || cards.length > 4) return false;
  const s = cards[0].suit;
  return cards.every(c => c.suit === s);
}
function isStraight(cards) {
  if (cards.length !== 5) return false;
  const ranks = [...new Set(cards.map(c => c.rank))].sort((a,b) => a - b);
  if (ranks.length !== 5) return false;
  if (ranks[0]===2 && ranks[1]===3 && ranks[2]===4 && ranks[3]===5 && ranks[4]===14) return true;
  return ranks[4] - ranks[0] === 4;
}
function detectCombo(cards) {
  const chars = new Set(cards.map(c => c.char));
  for (const id of ['zhuge','guanyu','zhangfei','zhaoyun']) {
    const g = GENERALS[id];
    if (g.chars.every(ch => chars.has(ch))) return g;
  }
  return null;
}
function equippedFactions(jokers) {
  const set = new Set();
  for (const jid of jokers) {
    const g = GENERALS[jid];
    if (g && g.faction) set.add(g.faction);
  }
  return set;
}
function evaluateHand(cards) {
  const counts = rankCounts(cards);
  const flush = isFlush(cards);
  const miniFlush = isMiniFlush(cards);
  const straight = isStraight(cards);
  const combo = detectCombo(cards);
  let best = null;
  function consider(id, extraName) {
    const t = HAND_TYPES.find(h => h.id === id);
    const cand = { ...t, comboName: extraName || null, comboGeneral: combo && id === 'combo' ? combo : null };
    if (!best || cand.pri > best.pri) best = cand;
  }
  if (flush && straight) consider('straight_flush');
  if (counts[0] === 4) consider('four');
  if (counts[0] === 3 && counts[1] === 2) consider('fullhouse');
  if (combo) consider('combo', '组将·' + combo.name);
  if (flush) consider('flush');
  if (straight) consider('straight');
  if (counts[0] === 3) consider('three');
  if (miniFlush) consider('mini_flush');
  if (counts[0] === 2 && counts[1] === 2) consider('twopair');
  if (counts[0] === 2) consider('pair');
  consider('high');
  const rankChips = cards.reduce((s, c) => s + c.rank, 0);
  return { type: best, displayName: best.comboName || best.name, base: best.base, mult: best.mult, rankChips, comboGeneral: best.comboGeneral || null, pri: best.pri };
}
function applyJokers(ev, cards, jokers, ctx) {
  ctx = ctx || {};
  const warSuit = ctx.warSuit || null;
  const warCount = warSuit ? cards.filter(c => c.suit === warSuit).length : 0;
  const warBonus = warCount * 4;
  let base = ev.base + ev.rankChips + warBonus;
  let mult = ev.mult;
  const factions = equippedFactions(jokers);
  let resonate = 0;
  for (const c of cards) if (factions.has(c.suit)) resonate++;
  if (resonate) mult += resonate;
  for (const jid of jokers) {
    if (jid === 'guanyu') {
      const allShu = cards.length > 0 && cards.every(c => c.suit === 'shu');
      if (allShu) {
        mult += 6;
        const tid = ev.type.id;
        if (tid === 'flush' || tid === 'mini_flush' || tid === 'straight_flush') mult += 4;
      }
    }
    if (jid === 'zhangfei') {
      const ok = ['three','straight','flush','combo','fullhouse','four','straight_flush'].includes(ev.type.id);
      if (ok) base = Math.floor(base * 1.5);
    }
    if (jid === 'zhaoyun') {
      const tid = ev.type.id;
      if (ctx.firstPlay && !ctx.zhaoyunUsed && cards.length <= 2 && (tid === 'high' || tid === 'pair')) mult += 6;
    }
  }
  return { base, mult, score: base * mult, warBonus, resonate, typeBase: ev.base, rankChips: ev.rankChips };
}

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log('✓', name); }
  else { fail++; console.error('✗', name); }
}

{
  const cards = [{suit:'wei',rank:14,char:'兵'},{suit:'shu',rank:7,char:'卒'}];
  const ev = evaluateHand(cards);
  assert('点数入分 A=14', ev.rankChips === 14 + 7);
  const sc = applyJokers(ev, cards, [], {});
  assert('底分=牌型+牌面', sc.base === ev.base + 21);
}
{
  const cards = [
    {suit:'shu',rank:2,char:'兵'},
    {suit:'shu',rank:5,char:'卒'},
    {suit:'shu',rank:9,char:'将'},
  ];
  const ev = evaluateHand(cards);
  assert('小同花识别', ev.type.id === 'mini_flush');
  assert('小同花 20×3', ev.base === 20 && ev.mult === 3);
}
{
  // 含一张蜀不应触发关羽
  const cards = [{suit:'shu',rank:9,char:'兵'},{suit:'wei',rank:9,char:'卒'}];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, ['guanyu'], {});
  // pair mult 2 + resonate 1 (one shu) = 3, no +6
  assert('关羽非整蜀不加6', sc.mult === 2 + 1);
}
{
  const cards = [
    {suit:'shu',rank:3,char:'兵'},
    {suit:'shu',rank:6,char:'卒'},
    {suit:'shu',rank:8,char:'将'},
  ];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, ['guanyu'], {});
  // mini_flush mult 3 + resonate 3 + guanyu 6 + shu mini +4 = 16
  assert('关羽全蜀小同花', sc.mult === 3 + 3 + 6 + 4);
}
{
  const cards = [
    {suit:'shu',rank:4,char:'兵'},
    {suit:'wei',rank:5,char:'卒'},
    {suit:'qun',rank:6,char:'将'},
  ];
  const sc = applyJokers(evaluateHand(cards), cards, ['guanyu','zhaoyun'], {});
  // resonate: shu(关羽)+qun(赵云) = 2
  assert('双阵营共鸣', sc.resonate === 2 && sc.mult === 1 + 2);
}
{
  const cards = [{suit:'wu',rank:10,char:'兵'},{suit:'wu',rank:10,char:'卒'}];
  const sc = applyJokers(evaluateHand(cards), cards, [], { warSuit: 'wu' });
  assert('宣战每张+4', sc.warBonus === 8 && sc.base === 10 + 20 + 8);
}
{
  const cards = [{suit:'shu',rank:14,char:'赵'},{suit:'shu',rank:14,char:'云'}];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, ['zhaoyun'], { firstPlay: true, zhaoyunUsed: false });
  assert('赵云不加成组将', !sc.mult || sc.mult === ev.mult + 0 + 0); // combo, no zhaoyun, resonate 0 (zhaoyun is qun)
  assert('组将优先', ev.type.id === 'combo');
}
{
  assert('同花顺>组将', evaluateHand([
    {suit:'shu',rank:10,char:'关'},
    {suit:'shu',rank:11,char:'羽'},
    {suit:'shu',rank:12,char:'兵'},
    {suit:'shu',rank:13,char:'卒'},
    {suit:'shu',rank:14,char:'将'},
  ]).type.id === 'straight_flush');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
