import {
  evaluateHand, applyJokers, detectCombos, STAGES, GENERALS,
} from './scoring.mjs';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('✓', msg); }
  else { fail++; console.error('✗', msg); }
}

{
  const cards = [{ suit: 'wei', rank: 14, char: '兵' }, { suit: 'shu', rank: 10, char: '卒' }];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'scatter', '散兵');
  assert(applyJokers(ev, cards, [], {}).score === 24, '散兵得分');
}

{
  const cards = [
    { suit: 'shu', rank: 5, char: '兵' },
    { suit: 'shu', rank: 8, char: '卒' },
    { suit: 'shu', rank: 12, char: '将' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'formation' && ev.mult === 2, '同阵×2');
  assert(applyJokers(ev, cards, [], {}).score === 100, '同阵得分100');
}

{
  const cards = [2,3,5,8,10].map((r,i) => ({ suit:'wei', rank:r, char:['兵','卒','将','骑','弓'][i] }));
  assert(evaluateHand(cards).isVolley && evaluateHand(cards).mult === 3, '齐射×3');
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'wei', rank: 8, char: '羽' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'combo', '组将');
  assert(ev.mult === 6, '组将暴击 3×2=6 got=' + ev.mult);
  assert(applyJokers(ev, cards, [], {}).score === (50 + 18) * 6, '组将暴击得分');
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'shu', rank: 8, char: '羽' },
    { suit: 'shu', rank: 5, char: '兵' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.mult === 8, '组将+同阵暴击 (3+1)×2=8 got=' + ev.mult);
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'shu', rank: 9, char: '羽' },
    { suit: 'shu', rank: 8, char: '张' },
    { suit: 'wei', rank: 7, char: '飞' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'double_combo', '连名');
  // (3+1)*2连名*2暴击 = 16
  assert(ev.mult === 16, '连名+暴击 got=' + ev.mult);
}

{
  // 连营：上一手已有 structureStreak=1，本手同阵 → 连营×2 → +2
  const cards = [
    { suit: 'wei', rank: 5, char: '兵' },
    { suit: 'wei', rank: 8, char: '卒' },
    { suit: 'wei', rank: 12, char: '将' },
  ];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, [], { structureStreak: 1 });
  assert(sc.lianying === 2 && sc.mult === 4, '连营×2 倍率+2 got mult=' + sc.mult + ' ly=' + sc.lianying);
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'wei', rank: 8, char: '羽' },
  ];
  const ev = evaluateHand(cards);
  const sc = applyJokers(ev, cards, [], { ownedReplay: true });
  assert(sc.mult === 8, '再组将+2 got=' + sc.mult); // 6+2
}

{
  const boss = STAGES.find(s => s.id === 'hlg');
  assert(boss?.boss?.requireStructure, 'Boss requireStructure');
  assert(!/对子/.test(boss.boss.text), '无对子');
  assert(STAGES[0].target === 300, 'v0.6 目标略降');
}

{
  assert(GENERALS.guanyu.chars.join('') === '关羽', '关羽');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
