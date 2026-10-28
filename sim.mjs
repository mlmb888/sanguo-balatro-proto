/**
 * v0.8 平衡模拟：合成拼字 + 词型/武将/连锁
 * 目标：basic 前两关易过；第三关需动脑；random 偏低
 */
import {
  STAGES, emptyBoard, spawnInto, tryMerge, effectivePower, basicMergePick, resetUid, settleBoard,
} from './merge-logic.mjs';

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playStage(stage, seed, smart = true) {
  const rng = mulberry32(seed);
  resetUid(1);
  let slots = emptyBoard();
  let draws = stage.draws;
  for (let k = 0; k < 3; k++) {
    const s = spawnInto(slots, rng);
    slots = s.slots;
  }
  const maxSteps = 100;
  for (let step = 0; step < maxSteps; step++) {
    const p = effectivePower(slots, stage);
    if (p.power >= stage.target) return { win: true, power: p.power };

    if (smart) {
      const pick = basicMergePick(slots);
      if (pick) {
        const r = tryMerge(slots, pick.i, pick.j);
        if (r.ok) { slots = r.slots; continue; }
      }
    } else {
      // random: 偶尔合成
      const opts = [];
      for (let i = 0; i < slots.length; i++) {
        for (let j = 0; j < slots.length; j++) {
          if (i === j || !slots[i] || !slots[j]) continue;
          const r = tryMerge(slots, i, j);
          if (r.ok) opts.push({ i, j, r });
        }
      }
      if (opts.length && rng() < 0.22) {
        const o = opts[Math.floor(rng() * opts.length)];
        slots = o.r.slots;
        continue;
      }
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

function rateStage(si, n, seed0, smart) {
  let wins = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const r = playStage(STAGES[si], seed0 + i * 17, smart);
    if (r.win) wins++;
    sum += r.power;
  }
  return { id: STAGES[si].id, target: STAGES[si].target, rate: wins / n, meanPower: +(sum / n).toFixed(1) };
}

function campaignRate(n, seed0, smart) {
  let wins = 0;
  for (let i = 0; i < n; i++) {
    let ok = true;
    for (let si = 0; si < STAGES.length; si++) {
      const r = playStage(STAGES[si], seed0 + i * 97 + si * 1009, smart);
      if (!r.win) { ok = false; break; }
    }
    if (ok) wins++;
  }
  return wins / n;
}

const N = 200;
const seed = 20261028;
console.log('=== v0.8 stage rates ===');
for (let si = 0; si < STAGES.length; si++) {
  console.log('basic', rateStage(si, N, seed, true));
  console.log('random', rateStage(si, N, seed + 1, false));
}
console.log('campaign basic', campaignRate(N, seed, true));
console.log('campaign random', campaignRate(N, seed + 3, false));

// Suggest targets if stage0 too hard/easy
const s0 = rateStage(0, N, seed, true);
const s1 = rateStage(1, N, seed, true);
const s2 = rateStage(2, N, seed, true);
console.log('SUMMARY', { s0: s0.rate, s1: s1.rate, s2: s2.rate });
console.log('TARGETS', JSON.stringify(STAGES.map(s => ({ id: s.id, target: s.target, draws: s.draws }))));
