import {
  makeUnit, calcPower, emptyBoard, spawnInto, tryMerge, effectivePower, settleBoard,
  detectWordTypes, detectChains, STAGES, SLOT_COUNT, resetUid, UNIT_STATS, basicMergePick,
  HERO_RULES, WORD_TYPES, neighbors, PROTO_V,
} from './merge-logic.mjs';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('✓', msg); }
  else { fail++; console.error('✗', msg); }
}

resetUid(1);
assert(PROTO_V === '0.8', '版本 0.8');

{
  const b = emptyBoard();
  assert(b.length === SLOT_COUNT && b.every(x => x === null), '空棋盘12格');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('兵'); slots[1] = makeUnit('兵');
  const r = tryMerge(slots, 0, 1);
  assert(r.ok && r.kind === 'tier' && r.result.name === '将', '兵+兵→将');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('将'); slots[1] = makeUnit('将');
  assert(tryMerge(slots, 0, 1).result.name === '帅', '将+将→帅');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('帅'); slots[1] = makeUnit('帅');
  assert(!tryMerge(slots, 0, 1).ok, '帅已满阶不可再升');
}

{
  const slots = emptyBoard();
  slots[2] = makeUnit('关'); slots[5] = makeUnit('羽');
  const r = tryMerge(slots, 2, 5);
  assert(r.ok && r.kind === 'spell' && r.result.name === '关羽', '关+羽→关羽');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('诸'); slots[1] = makeUnit('葛');
  let r = tryMerge(slots, 0, 1);
  assert(r.result.name === '诸葛', '诸+葛→诸葛');
  slots[0] = null; slots[1] = r.result; slots[2] = makeUnit('亮');
  r = tryMerge(slots, 2, 1);
  assert(r.result.name === '诸葛亮', '诸葛+亮→诸葛亮');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('关羽', 1);
  slots[1] = makeUnit('关羽', 1);
  const r = tryMerge(slots, 0, 1);
  assert(r.ok && r.kind === 'star' && r.result.star === 2, '关羽升星');
}

// 词型：武将名固定底分
{
  const slots = emptyBoard();
  slots[0] = makeUnit('关羽');
  const pats = detectWordTypes(slots);
  assert(pats.some(p => p.type === 'hero' && p.base >= WORD_TYPES.hero.base), '武将名词型底分');
  const s = settleBoard(slots);
  assert(s.power > 0 && s.baseSum >= 40, '关羽单独有战力 got ' + s.power);
}

// 成语 桃园结义
{
  const slots = emptyBoard();
  slots[0] = makeUnit('刘备');
  slots[1] = makeUnit('关羽');
  slots[2] = makeUnit('张飞');
  const pats = detectWordTypes(slots);
  assert(pats.some(p => p.type === 'idiom_ty'), '桃园结义词型');
}

// 诸葛亮成语倍率×2
{
  const slots = emptyBoard();
  slots[0] = makeUnit('诸葛亮');
  slots[1] = makeUnit('刘备');
  const s = settleBoard(slots);
  assert(s.notes.some(n => n.includes('诸葛')), '诸葛亮改写成语倍率');
}

// 赵云边缘
{
  const slots = emptyBoard();
  slots[0] = makeUnit('赵云'); // edge
  slots[1] = makeUnit('兵');   // edge
  const s = settleBoard(slots);
  assert(s.notes.some(n => n.includes('赵云')), '赵云边缘规则');
}

// 连锁
{
  const slots = emptyBoard();
  slots[0] = makeUnit('关羽');
  slots[1] = makeUnit('张飞'); // adjacent same faction
  const ch = detectChains(slots);
  assert(ch.length >= 1 && ch[0].level >= 1, '同阵邻接连锁');
}

// 关羽+义 再结算
{
  const slots = emptyBoard();
  slots[0] = makeUnit('关羽');
  slots[1] = makeUnit('义'); // neighbor of 0
  const s = settleBoard(slots);
  assert(s.extraRound > 0, '关羽邻义额外结算 got ' + s.extraRound);
}

// 曹操万能拼字：曹 + 羽 → 关羽？ 曹是魏字万能，羽是配方字
{
  const slots = emptyBoard();
  slots[0] = makeUnit('曹操');
  slots[2] = makeUnit('曹');
  slots[3] = makeUnit('羽');
  const r = tryMerge(slots, 2, 3);
  assert(r.ok && r.result.name === '关羽', '曹操在场：魏字万能拼关羽');
}

// 吕布独将
{
  const slots = emptyBoard();
  slots[0] = makeUnit('吕布');
  const s = settleBoard(slots);
  assert(s.notes.some(n => n.includes('吕布')), '吕布独将×2');
}

{
  assert(Object.keys(HERO_RULES).length >= 6, '至少6个武将规则');
}

{
  const stage = STAGES.find(s => s.id === 'hlg');
  const slots = emptyBoard();
  slots[0] = makeUnit('帅');
  const blocked = effectivePower(slots, stage);
  assert(blocked.blocked && blocked.power === 0, 'Boss无武将战力0');
  slots[1] = makeUnit('张飞');
  const ok = effectivePower(slots, stage);
  assert(!ok.blocked && ok.power > 0, 'Boss有武将计分');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('关'); slots[1] = makeUnit('羽'); slots[2] = makeUnit('兵'); slots[3] = makeUnit('兵');
  const pick = basicMergePick(slots);
  assert(pick && pick.r.kind === 'spell', 'AI优先拼字');
}

{
  assert(STAGES.length === 3 && STAGES[0].target < STAGES[2].target, '三关递进');
}

{
  let slots = emptyBoard();
  const s1 = spawnInto(slots, () => 0.1);
  assert(s1.spawned && s1.index >= 0, '抽字入空位');
}

{
  const s = settleBoard(emptyBoard());
  assert(s.steps && Array.isArray(s.steps), '结算含演出步骤');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
