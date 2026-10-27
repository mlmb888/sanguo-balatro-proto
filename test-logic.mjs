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
  assert(ev.type.id === 'scatter', '散兵 id');
  assert(ev.base === 0 && ev.mult === 1, '散兵 档0×1');
  const sc = applyJokers(ev, cards, [], {});
  assert(sc.score === 24, '散兵得分=点数');
}

{
  const cards = [
    { suit: 'shu', rank: 5, char: '兵' },
    { suit: 'shu', rank: 8, char: '卒' },
    { suit: 'shu', rank: 12, char: '将' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'formation' && !ev.isVolley, '同阵3');
  assert(ev.base === 25 && ev.mult === 2, '同阵3 25×2');
  const sc = applyJokers(ev, cards, [], {});
  assert(sc.score === 100, '同阵3 得分100');
}

{
  const cards = [2,3,5,8,10].map((r,i) => ({ suit:'wei', rank:r, char:['兵','卒','将','骑','弓'][i] }));
  const ev = evaluateHand(cards);
  assert(ev.isVolley && ev.mult === 3, '齐射×3');
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'wei', rank: 8, char: '羽' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'combo' && ev.displayName.includes('关羽'), '组将关羽');
  assert(ev.base === 50 && ev.mult === 3, '组将 50×3');
  assert(applyJokers(ev, cards, [], {}).score === 68 * 3, '组将得分');
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'shu', rank: 8, char: '羽' },
    { suit: 'shu', rank: 5, char: '兵' },
  ];
  const ev = evaluateHand(cards);
  assert(ev.type.id === 'combo' && ev.mult === 4, '组将+同阵 倍率4');
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
  assert(ev.mult === 8, '连名倍率8 got=' + ev.mult);
  assert(detectCombos(cards).length === 2, '检出2将');
}

{
  const cards = [
    { suit: 'shu', rank: 10, char: '关' },
    { suit: 'shu', rank: 8, char: '羽' },
    { suit: 'shu', rank: 5, char: '兵' },
  ];
  const sc = applyJokers(evaluateHand(cards), cards, ['guanyu'], {});
  // 组将+同阵4 + 共鸣3 + 全蜀6 + 蜀阵4 = 17
  assert(sc.mult === 17, '关羽全蜀组将同阵 倍率17 got=' + sc.mult);
}

{
  // 用魏同阵，避免张飞蜀共鸣干扰
  const cards = [
    { suit: 'wei', rank: 5, char: '兵' },
    { suit: 'wei', rank: 8, char: '卒' },
    { suit: 'wei', rank: 12, char: '将' },
  ];
  const sc = applyJokers(evaluateHand(cards), cards, ['zhangfei'], {});
  assert(sc.base === 75 && sc.score === 150, '张飞×1.5 got base=' + sc.base + ' score=' + sc.score);
}

{
  const cards = [{ suit: 'wei', rank: 14, char: '兵' }];
  const sc = applyJokers(evaluateHand(cards), cards, ['zhaoyun'], { firstPlay: true, zhaoyunUsed: false });
  assert(sc.mult === 7, '赵云首出散兵+6');
  const sc2 = applyJokers(evaluateHand(cards), cards, ['zhaoyun'], { firstPlay: false });
  assert(sc2.mult === 1, '赵云非首出不加');
}

{
  const boss = STAGES.find(s => s.id === 'hlg');
  assert(boss?.boss?.requireStructure, '虎牢关 requireStructure');
  assert(!/对子/.test(boss.boss.text), 'Boss无对子文案');
}

{
  const cards = [2,3,4,5].map((r,i) => ({ suit:'shu', rank:r, char:['兵','卒','将','骑'][i] }));
  const sc = applyJokers(evaluateHand(cards), cards, ['guanyu','zhangfei'], {});
  assert(sc.resonate === 3, '共鸣上限3');
}

{
  assert(GENERALS.guanyu.chars.join('') === '关羽', '关羽字位');
  assert(!Object.values(GENERALS).some(g => /对子|同花/.test(g.desc)), '小丑文案无扑克');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
