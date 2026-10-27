/**
 * v0.5 balance sim — deck mirrors index.html buildDeck.
 * Target: random campaign clear <15%; basic (组将/同阵) campaign ~40–65%.
 */
import {
  evaluateHand, applyJokers, STAGES, GENERALS,
} from './scoring.mjs';

const SUITS = [
  { id: 'wei' }, { id: 'shu' }, { id: 'wu' }, { id: 'qun' },
];
const NAME_CHARS = ['关','羽','张','飞','赵','云','诸','葛','亮','刘','备','曹','操','周','瑜','吕','布'];
const FILL_CHARS = ['兵','卒','将','士','马','弓','戟','盾','火','计','阵','令','鼓','旗','刀','枪','骑','弩','城','营'];

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(a, rng) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildDeck(rng) {
  const cards = [];
  let uid = 0;
  const guaranteed = [];
  for (const ch of NAME_CHARS) guaranteed.push(ch, ch);
  while (guaranteed.length < 52) {
    guaranteed.push(FILL_CHARS[guaranteed.length % FILL_CHARS.length]);
  }
  shuffle(guaranteed, rng);
  const ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
  for (let i = 0; i < 52; i++) {
    const suit = SUITS[i % 4];
    const rank = ranks[Math.floor(i / 4) % ranks.length];
    cards.push({ id: 'c' + (uid++), suit: suit.id, rank, char: guaranteed[i] });
  }
  return shuffle(cards, rng);
}
function draw(hand, deck, n) {
  while (hand.length < n && deck.length) hand.push(deck.pop());
}

function scorePlay(cards, jokers, ctx, boss) {
  const ev = evaluateHand(cards);
  if (!ev) return { score: 0, ev };
  if (boss?.requireStructure && ev.type.id === 'scatter') return { score: 0, ev };
  const sc = applyJokers(ev, cards, jokers, ctx);
  return { score: sc.score, ev, sc };
}

function policyRandom(hand, rng) {
  const n = 1 + Math.floor(rng() * Math.min(5, hand.length));
  const idx = [...hand.keys()];
  shuffle(idx, rng);
  return idx.slice(0, n).map(i => hand[i]);
}

function policyBasic(hand, rng) {
  const byChar = new Map();
  for (const c of hand) {
    if (!byChar.has(c.char)) byChar.set(c.char, []);
    byChar.get(c.char).push(c);
  }
  for (const g of Object.values(GENERALS)) {
    if (!g.chars.every(ch => byChar.has(ch))) continue;
    const pick = [];
    const used = new Set();
    for (const ch of g.chars) {
      const card = byChar.get(ch).find(c => !used.has(c.id));
      if (card) { pick.push(card); used.add(card.id); }
    }
    // pad same suit for 同阵叠加
    const suitTally = {};
    for (const c of pick) suitTally[c.suit] = (suitTally[c.suit] || 0) + 1;
    let bestSuit = Object.entries(suitTally).sort((a,b)=>b[1]-a[1])[0]?.[0] || pick[0]?.suit;
    for (const c of hand) {
      if (pick.length >= 5) break;
      if (used.has(c.id) || c.suit !== bestSuit) continue;
      pick.push(c); used.add(c.id);
    }
    for (const c of hand) {
      if (pick.length >= 3) break;
      if (used.has(c.id)) continue;
      pick.push(c); used.add(c.id);
    }
    return pick.slice(0, 5);
  }
  const suits = {};
  for (const c of hand) {
    if (!suits[c.suit]) suits[c.suit] = [];
    suits[c.suit].push(c);
  }
  let best = [];
  for (const arr of Object.values(suits)) if (arr.length > best.length) best = arr;
  if (best.length >= 3) return best.slice().sort((a,b)=>b.rank-a.rank).slice(0, 5);
  return [...hand].sort((a,b)=>b.rank-a.rank).slice(0, 1 + Math.floor(rng() * 2));
}

function playStage(stage, policy, jokers, seed) {
  const rng = mulberry32(seed);
  let deck = buildDeck(rng);
  let hand = [];
  draw(hand, deck, 8);
  let score = 0;
  let plays = stage.plays;
  let discards = stage.discards;
  let firstPlay = true;
  let highStreak = 0;
  let zhaoyunUsed = false;
  const warSuit = SUITS[Math.floor(rng() * 4)].id;

  while (plays > 0 && score < stage.target) {
    // basic may discard once if hand cannot form structure
    if (policy === policyBasic && discards > 0) {
      const trial = policyBasic(hand, rng);
      const tev = evaluateHand(trial);
      if (!tev || tev.type.id === 'scatter') {
        hand.sort((a,b)=>a.rank-b.rank);
        const drop = hand.splice(0, Math.min(3, hand.length));
        discards--;
        draw(hand, deck, 8);
      }
    }
    const cards = policy(hand, rng);
    if (!cards.length) break;
    const { score: gained, ev } = scorePlay(
      cards, jokers,
      { firstPlay, zhaoyunUsed, highStreak, warSuit },
      stage.boss,
    );
    score += gained;
    plays--;
    firstPlay = false;
    if (ev?.type?.id === 'scatter') highStreak++;
    else highStreak = 0;
    if (jokers.includes('zhaoyun') && cards.length <= 2 && ev?.type?.id === 'scatter') zhaoyunUsed = true;
    const ids = new Set(cards.map(c => c.id));
    hand = hand.filter(c => !ids.has(c.id));
    draw(hand, deck, 8);
  }
  return score >= stage.target;
}

function runCampaign(policy, jokers0, seed) {
  let jokers = [...jokers0];
  for (let i = 0; i < STAGES.length; i++) {
    if (!playStage(STAGES[i], policy, jokers, seed + i * 9973)) return false;
    if (!jokers.includes('guanyu')) jokers.push('guanyu');
  }
  return true;
}

function rate(policy, jokers, n, seed0) {
  let wins = 0;
  for (let i = 0; i < n; i++) if (runCampaign(policy, jokers, seed0 + i * 17)) wins++;
  return wins / n;
}

function rateStages(policy, jokers0, n, seed0) {
  return STAGES.map((st, si) => {
    const jk = si === 0 ? [...jokers0] : [...new Set([...jokers0, 'guanyu'])];
    let wins = 0;
    for (let i = 0; i < n; i++) {
      if (playStage(st, policy, jk, seed0 + si * 10007 + i * 17)) wins++;
    }
    return { id: st.id, target: st.target, rate: wins / n };
  });
}

function scoreDist(policy, jokers, n, seed0, boss) {
  const scores = [];
  for (let i = 0; i < n; i++) {
    const rng = mulberry32(seed0 + i * 17);
    let deck = buildDeck(rng);
    let hand = [];
    draw(hand, deck, 8);
    let score = 0, plays = 3, discards = 2, firstPlay = true, highStreak = 0, zhaoyunUsed = false;
    const warSuit = SUITS[Math.floor(rng() * 4)].id;
    while (plays > 0) {
      if (policy === policyBasic && discards > 0) {
        const trial = policyBasic(hand, rng);
        if (!evaluateHand(trial) || evaluateHand(trial).type.id === 'scatter') {
          hand.sort((a,b)=>a.rank-b.rank);
          hand.splice(0, Math.min(3, hand.length));
          discards--;
          draw(hand, deck, 8);
        }
      }
      const cards = policy(hand, rng);
      if (!cards.length) break;
      const { score: gained, ev } = scorePlay(cards, jokers, { firstPlay, zhaoyunUsed, highStreak, warSuit }, boss);
      score += gained; plays--; firstPlay = false;
      if (ev?.type?.id === 'scatter') highStreak++; else highStreak = 0;
      const ids = new Set(cards.map(c => c.id));
      hand = hand.filter(c => !ids.has(c.id));
      draw(hand, deck, 8);
    }
    scores.push(score);
  }
  scores.sort((a,b)=>a-b);
  const pct = p => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))];
  return { p15: pct(0.15), p25: pct(0.25), p35: pct(0.35), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90), mean: +(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) };
}

const N = 500;
const seed = 20261027;
console.log('=== distributions (mirrored deck) ===');
const dR = scoreDist(policyRandom, [], N, seed, null);
const dB = scoreDist(policyBasic, [], N, seed, null);
const dBG = scoreDist(policyBasic, ['guanyu'], N, seed + 9, null);
const dRBoss = scoreDist(policyRandom, ['guanyu'], N, seed, { requireStructure: true });
const dBBoss = scoreDist(policyBasic, ['guanyu'], N, seed, { requireStructure: true });
console.log('random', dR);
console.log('basic', dB);
console.log('basic+gy', dBG);
console.log('random boss', dRBoss);
console.log('basic boss', dBBoss);

function setT(a,b,c) { STAGES[0].target=a; STAGES[1].target=b; STAGES[2].target=c; }

// Seek campaign basic in [0.40, 0.65], random < 0.15
// Start from ~p25 of basic dists (higher pass rates → campaign product OK)
const gridA = [280, 320, 360, 400, 440, 480, 520, 560];
const gridB = [480, 560, 640, 720, 800, 880, 960];
const gridC = [560, 640, 720, 800, 880, 960, 1040];
const hits = [];
for (const a of gridA) for (const b of gridB) for (const c of gridC) {
  if (!(a < b && b <= c + 50 && a < c)) continue;
  setT(a,b,c);
  const rr = rate(policyRandom, [], 250, seed);
  if (rr >= 0.15) continue;
  const br = rate(policyBasic, [], 250, seed + 3);
  if (br >= 0.40 && br <= 0.65) hits.push({ a, b, c, rr, br });
}
hits.sort((x,y) => Math.abs(x.br - 0.52) - Math.abs(y.br - 0.52));
console.log('hits', hits.slice(0, 10));

let chosen;
if (hits.length) {
  chosen = hits[0];
} else {
  // broaden: accept basic 35-70
  for (const a of gridA) for (const b of gridB) for (const c of gridC) {
    if (!(a < b && b < c + 80)) continue;
    setT(a,b,c);
    const rr = rate(policyRandom, [], 200, seed);
    const br = rate(policyBasic, [], 200, seed + 3);
    if (rr < 0.15 && br >= 0.35 && br <= 0.70) hits.push({ a, b, c, rr, br });
  }
  hits.sort((x,y) => Math.abs(x.br - 0.52) - Math.abs(y.br - 0.52));
  console.log('broad hits', hits.slice(0, 10));
  chosen = hits[0] || { a: 400, b: 720, c: 800, rr: null, br: null };
}

setT(chosen.a, chosen.b, chosen.c);
console.log('\nCHOSEN', chosen);
console.log('verify campaign random', rate(policyRandom, [], 400, seed));
console.log('verify campaign basic', rate(policyBasic, [], 400, seed + 3));
console.log('stage random', rateStages(policyRandom, [], 300, seed));
console.log('stage basic', rateStages(policyBasic, [], 300, seed + 3));
console.log('FINAL_TARGETS', JSON.stringify(STAGES.map(s => s.target)));
