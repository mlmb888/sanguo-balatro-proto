/**
 * Campaign win-rate simulator. Usage: node sim.mjs [n]
 * random: chaos picks; basic: human-like heuristics (not exhaustive solver)
 */
const SUITS = [
  { id: 'wei' }, { id: 'shu' }, { id: 'wu' }, { id: 'qun' },
];
const HAND_TYPES = [
  { id: 'straight_flush', base: 100, mult: 8, pri: 10 },
  { id: 'four', base: 60, mult: 7, pri: 9 },
  { id: 'fullhouse', base: 40, mult: 4, pri: 8 },
  { id: 'combo', base: 40, mult: 4, pri: 7 },
  { id: 'flush', base: 35, mult: 4, pri: 6 },
  { id: 'straight', base: 30, mult: 4, pri: 5 },
  { id: 'three', base: 30, mult: 3, pri: 4 },
  { id: 'mini_flush', base: 20, mult: 3, pri: 3.5 },
  { id: 'twopair', base: 20, mult: 2, pri: 3 },
  { id: 'pair', base: 10, mult: 2, pri: 2 },
  { id: 'high', base: 5, mult: 1, pri: 1 },
];
const GENERALS = {
  guanyu:   { id: 'guanyu', faction: 'shu', chars: ['关','羽'] },
  zhangfei: { id: 'zhangfei', faction: 'shu', chars: ['张','飞'] },
  zhaoyun:  { id: 'zhaoyun', faction: 'qun', chars: ['赵','云'] },
  zhuge:    { id: 'zhuge', faction: 'shu', chars: ['诸','葛','亮'] },
};
const NAME_CHARS = ['关','羽','张','飞','赵','云','诸','葛','亮','刘','备','曹','操','周','瑜','吕','布'];
const FILL_CHARS = ['兵','卒','将','士','马','弓','戟','盾','火','计','阵','令','鼓','旗','刀','枪','骑','弩','城','营'];

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function buildDeck(rng) {
  const guaranteed = [];
  for (const ch of NAME_CHARS) guaranteed.push(ch, ch);
  while (guaranteed.length < 52) guaranteed.push(FILL_CHARS[guaranteed.length % FILL_CHARS.length]);
  shuffle(guaranteed, rng);
  const ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
  const cards = [];
  let uid = 0;
  for (let i = 0; i < 52; i++) {
    cards.push({
      id: 'c' + (uid++),
      suit: SUITS[i % 4].id,
      rank: ranks[Math.floor(i / 4) % 13],
      char: guaranteed[i],
    });
  }
  return shuffle(cards, rng);
}
function rankCounts(cards) {
  const m = {};
  for (const c of cards) m[c.rank] = (m[c.rank] || 0) + 1;
  return Object.values(m).sort((a,b) => b - a);
}
function isFlush(cards) {
  if (cards.length < 5) return false;
  return cards.every(c => c.suit === cards[0].suit);
}
function isMiniFlush(cards) {
  if (cards.length < 3 || cards.length > 4) return false;
  return cards.every(c => c.suit === cards[0].suit);
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
  const miniFlush = isMiniFlush(cards);
  const straight = isStraight(cards);
  const combo = detectCombo(cards);
  let best = null;
  function consider(id) {
    const t = HAND_TYPES.find(h => h.id === id);
    const cand = { ...t, comboGeneral: combo && id === 'combo' ? combo : null };
    if (!best || cand.pri > best.pri) best = cand;
  }
  if (flush && straight) consider('straight_flush');
  if (counts[0] === 4) consider('four');
  if (counts[0] === 3 && counts[1] === 2) consider('fullhouse');
  if (combo) consider('combo');
  if (flush) consider('flush');
  if (straight) consider('straight');
  if (counts[0] === 3) consider('three');
  if (miniFlush) consider('mini_flush');
  if (counts[0] === 2 && counts[1] === 2) consider('twopair');
  if (counts[0] === 2) consider('pair');
  consider('high');
  return { type: best, base: best.base, mult: best.mult, rankChips: cards.reduce((s,c)=>s+c.rank,0), pri: best.pri };
}
function equippedFactions(jokers) {
  const set = new Set();
  for (const jid of jokers) if (GENERALS[jid]?.faction) set.add(GENERALS[jid].faction);
  return set;
}
function applyJokers(ev, cards, jokers, ctx = {}) {
  const warBonus = ctx.warSuit ? cards.filter(c => c.suit === ctx.warSuit).length * 4 : 0;
  let base = ev.base + ev.rankChips + warBonus;
  let mult = ev.mult;
  let resonateRaw = 0;
  const factions = equippedFactions(jokers);
  for (const c of cards) if (factions.has(c.suit)) resonateRaw++;
  mult += Math.min(3, resonateRaw);
  if ((ctx.highStreak || 0) >= 2) mult = Math.max(1, mult - 1);
  for (const jid of jokers) {
    if (jid === 'guanyu') {
      if (cards.length && cards.every(c => c.suit === 'shu')) {
        mult += 6;
        if (['flush','mini_flush','straight_flush'].includes(ev.type.id)) mult += 4;
      }
    }
    if (jid === 'zhangfei') {
      if (['three','straight','flush','combo','fullhouse','four','straight_flush'].includes(ev.type.id)) {
        base = Math.floor(base * 1.5);
      }
    }
    if (jid === 'zhaoyun') {
      if (ctx.firstPlay && !ctx.zhaoyunUsed && cards.length <= 2 && (ev.type.id === 'high' || ev.type.id === 'pair')) mult += 6;
    }
  }
  return { base, mult, score: base * mult };
}
function scorePlay(cards, jokers, ctx, bossMinPri) {
  const ev = evaluateHand(cards);
  let sc = applyJokers(ev, cards, jokers, ctx);
  if (bossMinPri && ev.pri < bossMinPri) sc = { ...sc, score: 0 };
  return { ev, sc };
}

function pickRandom(hand, rng) {
  const n = 1 + Math.floor(rng() * Math.min(5, hand.length));
  const copy = hand.slice();
  shuffle(copy, rng);
  return copy.slice(0, n);
}

/** Human-like: greedily pick first matching rule, not full search */
function pickBasic(hand, jokers, ctx, warSuit) {
  // 1) 组将 if chars present
  for (const g of [GENERALS.guanyu, GENERALS.zhangfei, GENERALS.zhaoyun, GENERALS.zhuge]) {
    const picked = [];
    const used = new Set();
    let ok = true;
    for (const ch of g.chars) {
      const c = hand.find(x => x.char === ch && !used.has(x.id));
      if (!c) { ok = false; break; }
      picked.push(c); used.add(c.id);
    }
    if (ok) return picked;
  }
  // 2) three of a kind
  const byRank = {};
  for (const c of hand) (byRank[c.rank] = byRank[c.rank] || []).push(c);
  for (const arr of Object.values(byRank)) {
    if (arr.length >= 3) return arr.slice(0, 3);
  }
  // 3) mini flush preferring war / shu
  const suitOrder = [warSuit, 'shu', 'wei', 'wu', 'qun'].filter((v,i,a)=>a.indexOf(v)===i);
  for (const suit of suitOrder) {
    const s = hand.filter(c => c.suit === suit).sort((a,b) => b.rank - a.rank);
    if (s.length >= 3) return s.slice(0, 3);
  }
  // 4) best pair (highest rank)
  let bestPair = null;
  for (const arr of Object.values(byRank)) {
    if (arr.length >= 2) {
      if (!bestPair || arr[0].rank > bestPair[0].rank) bestPair = arr.slice(0, 2);
    }
  }
  if (bestPair) return bestPair;
  // 5) war suit top 2, else top 1-2 high cards
  const war = hand.filter(c => c.suit === warSuit).sort((a,b) => b.rank - a.rank);
  if (war.length >= 2) return war.slice(0, 2);
  if (war.length === 1) return [war[0]];
  return hand.slice().sort((a,b) => b.rank - a.rank).slice(0, 1);
}

function chooseWar(hand, jokers, strategy, rng) {
  if (strategy === 'random') return SUITS[Math.floor(rng() * 4)].id;
  const counts = { wei:0, shu:0, wu:0, qun:0 };
  for (const c of hand) counts[c.suit]++;
  if (jokers.includes('guanyu')) counts.shu += 2;
  let best = 'shu', n = -1;
  for (const [k,v] of Object.entries(counts)) if (v > n) { n = v; best = k; }
  return best;
}

function runStage(stage, jokers, strategy, rng) {
  let deck = buildDeck(rng);
  let hand = [];
  const draw = () => { while (hand.length < 8 && deck.length) hand.push(deck.pop()); };
  draw();
  const warSuit = chooseWar(hand, jokers, strategy, rng);
  let score = 0, playsLeft = stage.plays, discardsLeft = stage.discards;
  let highStreak = 0, playsMade = 0;
  const bossMinPri = stage.boss?.minPri || 0;

  if (strategy === 'basic' && discardsLeft > 0) {
    const hasPair = Object.values(hand.reduce((m,c)=>{(m[c.rank]=(m[c.rank]||0)+1); return m;},{})).some(n=>n>=2);
    const hasFlush3 = SUITS.some(s => hand.filter(c=>c.suit===s.id).length >= 3);
    if (!hasPair && !hasFlush3) {
      const weak = hand.slice().sort((a,b)=>a.rank-b.rank).slice(0, 2);
      const ids = new Set(weak.map(c=>c.id));
      hand = hand.filter(c => !ids.has(c.id));
      discardsLeft--;
      draw();
    }
  }

  while (playsLeft > 0 && score < stage.target) {
    const ctx = { firstPlay: playsMade === 0, zhaoyunUsed: false, warSuit, highStreak };
    const cards = strategy === 'random'
      ? pickRandom(hand, rng)
      : pickBasic(hand, jokers, ctx, warSuit);
    const { ev, sc } = scorePlay(cards, jokers, ctx, bossMinPri);
    score += sc.score;
    if (ev.type.id === 'high') highStreak++; else highStreak = 0;
    const ids = new Set(cards.map(c => c.id));
    hand = hand.filter(c => !ids.has(c.id));
    playsLeft--;
    playsMade++;
    draw();
  }
  return score >= stage.target;
}

function runCampaign(stages, strategy, seed) {
  const rng = mulberry32(seed);
  const jokers = ['guanyu'];
  let lives = 3;
  for (let si = 0; si < stages.length; ) {
    if (runStage(stages[si], jokers, strategy, rng)) si++;
    else {
      lives--;
      if (lives <= 0) return false;
    }
  }
  return true;
}

function evaluateConfig(stages, n) {
  const out = {};
  for (const strategy of ['random', 'basic']) {
    let wins = 0;
    for (let i = 0; i < n; i++) {
      if (runCampaign(stages, strategy, 5000 + i * 131 + strategy.length * 17)) wins++;
    }
    out[strategy] = wins / n;
  }
  return out;
}

const mk = (t1,t2,t3,p1=3,p2=3,p3=3) => ([
  { target:t1, plays:p1, discards:2, boss:null },
  { target:t2, plays:p2, discards:2, boss:null },
  { target:t3, plays:p3, discards:2, boss:{ minPri:2 } },
]);

const CANDIDATES = [
  { name: 'A_220_480_750_p3', stages: mk(220,480,750) },
  { name: 'B_280_600_950_p3', stages: mk(280,600,950) },
  { name: 'C_220_480_750_boss4', stages: mk(220,480,750,3,3,4) },
  { name: 'D_320_700_1100_p3', stages: mk(320,700,1100) },
  { name: 'E_380_800_1200_p3', stages: mk(380,800,1200) },
  { name: 'F_450_950_1400_p3', stages: mk(450,950,1400) },
  { name: 'G_280_600_950_boss4', stages: mk(280,600,950,3,3,4) },
];

const n = Number(process.argv[2] || 40);
console.log(`Sim ${n} campaigns × strategy\n`);
const results = [];
for (const c of CANDIDATES) {
  const rates = evaluateConfig(c.stages, n);
  results.push({ ...c, ...rates });
  console.log(`${c.name}: random=${(rates.random*100).toFixed(0)}%  basic=${(rates.basic*100).toFixed(0)}%`);
}
function fit(r) {
  let s = 0;
  if (r.random < 0.20) s += 12; else s -= (r.random - 0.2) * 30;
  if (r.basic >= 0.40 && r.basic <= 0.70) s += 12;
  else s -= Math.abs(r.basic - 0.55) * 20;
  s -= Math.abs(r.basic - 0.55) * 4;
  return s;
}
results.sort((a,b) => fit(b) - fit(a));
const best = results[0];
console.log('\nBEST', best.name, `random=${(best.random*100).toFixed(0)}% basic=${(best.basic*100).toFixed(0)}%`);
console.log(JSON.stringify({
  name: best.name,
  random: best.random,
  basic: best.basic,
  targets: best.stages.map(s => s.target),
  plays: best.stages.map(s => s.plays),
}, null, 2));
