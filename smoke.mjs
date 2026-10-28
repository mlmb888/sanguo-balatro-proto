/** v0.8 冒烟：basic 策略通关率 */
import {
  STAGES, emptyBoard, spawnInto, tryMerge, effectivePower, basicMergePick, resetUid, PROTO_V,
} from './merge-logic.mjs';

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playStage(stage, seed) {
  const rng = mulberry32(seed);
  resetUid(1);
  let slots = emptyBoard();
  let draws = stage.draws;
  for (let k = 0; k < 3; k++) {
    const s = spawnInto(slots, rng);
    slots = s.slots;
  }
  for (let step = 0; step < 100; step++) {
    const p = effectivePower(slots, stage);
    if (p.power >= stage.target) return { win: true, power: p.power };

    const pick = basicMergePick(slots);
    if (pick) {
      const r = tryMerge(slots, pick.i, pick.j);
      if (r.ok) { slots = r.slots; continue; }
    }
    if (draws > 0 && slots.some(x => !x)) {
      const s = spawnInto(slots, rng);
      slots = s.slots;
      draws--;
      continue;
    }
    let any = false;
    for (let i = 0; i < slots.length && !any; i++) {
      for (let j = 0; j < slots.length; j++) {
        if (i === j || !slots[i] || !slots[j]) continue;
        const r = tryMerge(slots, i, j);
        if (r.ok) { slots = r.slots; any = true; break; }
      }
    }
    if (!any) break;
  }
  const p = effectivePower(slots, stage);
  return { win: p.power >= stage.target, power: p.power };
}

console.log('PROTO', PROTO_V);
let fails = 0;
for (let si = 0; si < STAGES.length; si++) {
  let wins = 0;
  const N = 40;
  for (let i = 0; i < N; i++) {
    if (playStage(STAGES[si], 1000 + si * 1000 + i).win) wins++;
  }
  const rate = wins / N;
  console.log(STAGES[si].id, 'target', STAGES[si].target, 'winRate', rate);
  // 小关至少能过一些；Boss 允许更低但不为 0 崩
  const min = si < 2 ? 0.25 : 0.1;
  if (rate < min) {
    console.error('FAIL low win rate', STAGES[si].id);
    fails++;
  }
}
const demo = playStage(STAGES[0], 42);
console.log('demo hj1', demo);
console.log(fails ? 'SMOKE FAIL' : 'SMOKE OK');
process.exit(fails ? 1 : 0);
