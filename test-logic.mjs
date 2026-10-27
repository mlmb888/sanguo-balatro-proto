/** Headless smoke tests for core scoring — run: node test-logic.mjs */

const SUITS = [{id:'wei'},{id:'shu'},{id:'wu'},{id:'qun'}];
const HAND_TYPES = [
  { id: 'straight_flush', name: '同花顺', base: 100, mult: 8, pri: 10 },
  { id: 'four', name: '金刚', base: 60, mult: 7, pri: 9 },
  { id: 'fullhouse', name: '葫芦', base: 40, mult: 4, pri: 8 },
  { id: 'combo', name: '组将', base: 40, mult: 4, pri: 7 },
  { id: 'flush', name: '同花', base: 35, mult: 4, pri: 6 },
  { id: 'straight', name: '顺子', base: 30, mult: 4, pri: 5 },
  { id: 'three', name: '三条', base: 30, mult: 3, pri: 4 },
  { id: 'twopair', name: '两对', base: 20, mult: 2, pri: 3 },
  { id: 'pair', name: '对子', base: 10, mult: 2, pri: 2 },
  { id: 'high', name: '高牌', base: 5, mult: 1, pri: 1 },
];
const GENERALS = {
  guanyu: { id:'guanyu', name:'关羽', chars:['关','羽'] },
  zhangfei:{ id:'zhangfei', name:'张飞', chars:['张','飞'] },
  zhaoyun:{ id:'zhaoyun', name:'赵云', chars:['赵','云'] },
  zhuge:{ id:'zhuge', name:'诸葛亮', chars:['诸','葛','亮'] },
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
function evaluateHand(cards) {
  const counts = rankCounts(cards);
  const flush = isFlush(cards);
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
  if (counts[0] === 2 && counts[1] === 2) consider('twopair');
  if (counts[0] === 2) consider('pair');
  consider('high');
  const rankChips = cards.reduce((s, c) => {
    if (c.rank === 14) return s + 11;
    if (c.rank >= 11) return s + 10;
    return s + c.rank;
  }, 0);
  return { type: best, displayName: best.comboName || best.name, base: best.base, mult: best.mult, rankChips, comboGeneral: best.comboGeneral || null, pri: best.pri };
}
function applyJokers(ev, cards, jokers) {
  let base = ev.base + ev.rankChips;
  let mult = ev.mult;
  for (const jid of jokers) {
    if (jid === 'guanyu') {
      if (cards.some(c => c.suit === 'shu')) mult += 8;
      if (ev.type.id === 'flush' && cards.every(c => c.suit === 'shu')) mult += 4;
    }
    if (jid === 'zhangfei') {
      const ok = ['three','straight','flush','combo','fullhouse','four','straight_flush'].includes(ev.type.id);
      if (ok) base = Math.floor(base * 1.5);
    }
    if (jid === 'zhaoyun' && cards.length <= 2) mult += 12;
  }
  return { base, mult, score: base * mult };
}

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log('✓', name); }
  else { fail++; console.error('✗', name); }
}

// Pair
{
  const cards = [{suit:'wei',rank:7,char:'兵'},{suit:'shu',rank:7,char:'卒'}];
  const ev = evaluateHand(cards);
  assert('对子识别', ev.type.id === 'pair');
}
// 组将 关羽
{
  const cards = [{suit:'shu',rank:10,char:'关'},{suit:'wei',rank:5,char:'羽'},{suit:'wu',rank:3,char:'兵'}];
  const ev = evaluateHand(cards);
  assert('组将关羽', ev.type.id === 'combo' && ev.comboGeneral.name === '关羽');
}
// 诸葛亮三字
{
  const cards = [{suit:'shu',rank:2,char:'诸'},{suit:'wei',rank:3,char:'葛'},{suit:'wu',rank:4,char:'亮'}];
  const ev = evaluateHand(cards);
  assert('组将诸葛亮', ev.comboGeneral && ev.comboGeneral.name === '诸葛亮');
}
// 赵云 2张
{
  const cards = [{suit:'shu',rank:14,char:'赵'},{suit:'shu',rank:14,char:'云'}];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, ['zhaoyun']);
  assert('赵云组将倍率', sc.mult === 4 + 12);
  assert('赵云对子得分>0', sc.score > 0);
}
// 关羽蜀色
{
  const cards = [{suit:'shu',rank:9,char:'兵'},{suit:'wei',rank:9,char:'卒'}];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, ['guanyu']);
  assert('关羽含蜀+8', sc.mult === 2 + 8);
}
// 张飞三条
{
  const cards = [{suit:'wei',rank:8,char:'兵'},{suit:'shu',rank:8,char:'卒'},{suit:'wu',rank:8,char:'将'}];
  const ev = evaluateHand(cards);
  const baseBefore = ev.base + ev.rankChips;
  const sc = applyJokers(ev, cards, ['zhangfei']);
  assert('张飞三条×1.5', sc.base === Math.floor(baseBefore * 1.5));
}
// 虎牢关：高牌 pri < 2
{
  const cards = [{suit:'wei',rank:14,char:'兵'}];
  const ev = evaluateHand(cards);
  assert('高牌 pri=1', ev.pri === 1);
}
// 同花顺优先于组将
{
  const cards = [
    {suit:'shu',rank:10,char:'关'},
    {suit:'shu',rank:11,char:'羽'},
    {suit:'shu',rank:12,char:'兵'},
    {suit:'shu',rank:13,char:'卒'},
    {suit:'shu',rank:14,char:'将'},
  ];
  const ev = evaluateHand(cards);
  assert('同花顺 > 组将', ev.type.id === 'straight_flush');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
