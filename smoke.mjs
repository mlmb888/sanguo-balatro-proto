/** v0.7 冒烟：basic 策略能否走完主路径（抽字+合成达目标） */
import {
  STAGES, emptyBoard, spawnInto, tryMerge, effectivePower, basicMergePick, resetUid,
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
  let merges = 0;
  const maxSteps = 80;
  for (let step = 0; step < maxSteps; step++) {
    const p = effectivePower(slots, stage);
    if (p.power >= stage.target) return { win: true, power: p.power, merges, drawsLeft: draws };

    // prefer merge if available
    const pick = basicMergePick(slots);
    if (pick) {
      const r = tryMerge(slots, pick.i, pick.j);
      if (r.ok) {
        slots = r.slots;
        merges++;
        continue;
      }
    }
    // else draw
    if (draws > 0 && slots.some(x => !x)) {
      const s = spawnInto(slots, rng);
      slots = s.slots;
      draws--;
      continue;
    }
    // stuck: try any merge
    let any = false;
    for (let i = 0; i < slots.length && !any; i++) {
      for (let j = 0; j < slots.length; j++) {
        if (i === j || !slots[i] || !slots[j]) continue;
        const r = tryMerge(slots, i, j);
        if (r.ok) { slots = r.slots; merges++; any = true; break; }
      }
    }
    if (!any) break;
  }
  const p = effectivePower(slots, stage);
  return { win: p.power >= stage.target, power: p.power, merges, drawsLeft: draws };
}

let fails = 0;
for (let si = 0; si < STAGES.length; si++) {
  let wins = 0;
  const N = 40;
  for (let i = 0; i < N; i++) {
    const r = playStage(STAGES[si], 1000 + si * 1000 + i);
    if (r.win) wins++;
  }
  const rate = wins / N;
  console.log(STAGES[si].id, 'target', STAGES[si].target, 'winRate', rate);
  // 主路径：basic 至少有一定胜率（难度友好）
  if (rate < 0.15) {
    console.error('FAIL low win rate', STAGES[si].id);
    fails++;
  }
}
// one deterministic path log
const demo = playStage(STAGES[0], 42);
console.log('demo hj1', demo);
if (!demo.win && demo.power < 40) {
  // soft: still ok if logic runs
  console.log('demo did not clear but smoke continues');
}
console.log(fails ? 'SMOKE FAIL' : 'SMOKE OK');
process.exit(fails ? 1 : 0);
