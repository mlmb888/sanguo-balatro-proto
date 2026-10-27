import {
  makeUnit, calcPower, emptyBoard, spawnInto, tryMerge, effectivePower,
  STAGES, SLOT_COUNT, resetUid, UNIT_STATS, basicMergePick,
} from './merge-logic.mjs';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('✓', msg); }
  else { fail++; console.error('✗', msg); }
}

resetUid(1);

{
  const b = emptyBoard();
  assert(b.length === SLOT_COUNT && b.every(x => x === null), '空棋盘12格');
}

{
  const a = makeUnit('兵');
  const b = makeUnit('兵');
  const slots = emptyBoard();
  slots[0] = a; slots[1] = b;
  const r = tryMerge(slots, 0, 1);
  assert(r.ok && r.kind === 'tier' && r.result.name === '锐', '兵+兵→锐');
  assert(r.slots[0] === null && r.slots[1].name === '锐', '结果在目标格');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('锐'); slots[1] = makeUnit('锐');
  assert(tryMerge(slots, 0, 1).result.name === '将', '锐+锐→将');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('将'); slots[1] = makeUnit('将');
  assert(!tryMerge(slots, 0, 1).ok, '将已满阶不可再升');
}

{
  const slots = emptyBoard();
  slots[2] = makeUnit('关'); slots[5] = makeUnit('羽');
  const r = tryMerge(slots, 2, 5);
  assert(r.ok && r.kind === 'spell' && r.result.name === '关羽', '关+羽→关羽');
  assert(r.result.kind === 'hero' && r.result.mult === 2, '关羽带倍率');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('诸'); slots[1] = makeUnit('葛');
  let r = tryMerge(slots, 0, 1);
  assert(r.result.name === '诸葛', '诸+葛→诸葛');
  slots[0] = null; slots[1] = r.result; slots[2] = makeUnit('亮');
  r = tryMerge(slots, 2, 1);
  assert(r.result.name === '诸葛亮' && r.result.mult === 3, '诸葛+亮→诸葛亮');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('关羽', 1);
  slots[1] = makeUnit('关羽', 1);
  const r = tryMerge(slots, 0, 1);
  assert(r.ok && r.kind === 'star' && r.result.star === 2, '关羽升星');
  assert(r.result.base > UNIT_STATS['关羽'].base, '升星底分提升');
}

{
  const slots = emptyBoard();
  slots[0] = makeUnit('关羽'); // base28 mult2
  slots[1] = makeUnit('兵'); // base3
  const p = calcPower(slots);
  assert(p.baseSum === 31 && p.mult === 2 && p.power === 62, '战力=底分×倍率 got ' + JSON.stringify(p));
}

{
  const stage = STAGES.find(s => s.id === 'hlg');
  const slots = emptyBoard();
  slots[0] = makeUnit('将');
  const blocked = effectivePower(slots, stage);
  assert(blocked.blocked && blocked.power === 0, 'Boss无武将战力0');
  slots[1] = makeUnit('张飞');
  const ok = effectivePower(slots, stage);
  assert(!ok.blocked && ok.power > 0, 'Boss有武将计分');
}

{
  let slots = emptyBoard();
  const rng = () => 0.1;
  const s1 = spawnInto(slots, rng);
  assert(s1.spawned && s1.index >= 0, '抽字入空位');
  // fill almost
  slots = s1.slots;
  for (let k = 0; k < 20; k++) {
    const s = spawnInto(slots, Math.random);
    if (s.index < 0) break;
    slots = s.slots;
  }
  assert(slots.filter(Boolean).length <= SLOT_COUNT, '不超过格数');
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
