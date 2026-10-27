/** legacy v0.5–0.6 poker/组将 scoring — unused in v0.7; see merge-logic.mjs */
/** v0.6 scoring — shared by tests & sim */
const HAND_TYPES = [
  { id: 'double_combo', name: '连名', typeBase: 50, mult: 3, pri: 4 },
  { id: 'combo', name: '组将', typeBase: 50, mult: 3, pri: 3 },
  { id: 'formation', name: '同阵', typeBase: 25, mult: 2, pri: 2 },
  { id: 'scatter', name: '散兵', typeBase: 0, mult: 1, pri: 1 },
];

const GENERALS = {
  guanyu:   { id: 'guanyu', name: '关羽', faction: 'shu', chars: ['关','羽'], desc: '全蜀倍率+6；全蜀同阵再+4' },
  zhangfei: { id: 'zhangfei', name: '张飞', faction: 'shu', chars: ['张','飞'], desc: '同阵或组将时 底分×1.5' },
  zhaoyun:  { id: 'zhaoyun', name: '赵云', faction: 'qun', chars: ['赵','云'], desc: '本关首次≤2张散兵 倍率+6' },
  zhuge:    { id: 'zhuge', name: '诸葛亮', faction: 'shu', chars: ['诸','葛','亮'], desc: '每关一次「观星」' },
  liubei:   { id: 'liubei', name: '刘备', faction: 'shu', chars: ['刘','备'], desc: '（未实装效果）' },
  caocao:   { id: 'caocao', name: '曹操', faction: 'wei', chars: ['曹','操'], desc: '（未实装效果）' },
  zhouyu:   { id: 'zhouyu', name: '周瑜', faction: 'wu', chars: ['周','瑜'], desc: '（未实装效果）' },
  lvbu:     { id: 'lvbu', name: '吕布', faction: 'qun', chars: ['吕','布'], desc: '（未实装效果）' },
};
const FACTION_NAME = { wei: '魏', shu: '蜀', wu: '吴', qun: '群' };

const STAGES = [
  { id: 'hj1', name: '黄巾 · 小关1', target: 300, plays: 3, discards: 2, boss: null, reward: 12 },
  { id: 'hj2', name: '黄巾 · 小关2', target: 620, plays: 3, discards: 2, boss: null, reward: 16 },
  { id: 'hlg', name: 'Boss · 虎牢关', target: 720, plays: 3, discards: 2,
    boss: { text: '虎牢关：必须同阵或组将才计分，散兵得 0', requireStructure: true }, reward: 24 },
];

// Char pool for deck construction — ensure generals' chars appear enough
const NAME_CHARS = ['关','羽','张','飞','赵','云','诸','葛','亮','刘','备','曹','操','周','瑜','吕','布'];
const FILL_CHARS = ['兵','卒','将','士','马','弓','戟','盾','火','计','阵','令','鼓','旗','刀','枪','骑','弩','城','营'];

// ========== Utils ==========
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function rankLabel(r) { return RANK_LABEL[r] || String(r); }
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}
function $(id) { return document.getElementById(id); }

// ========== Deck ==========
function buildDeck() {
  const cards = [];
  let uid = 0;
  const guaranteed = [];
  // v0.6：关羽/张飞/赵云字位加重，组将更容易摸到
  const HOT = { '关':4, '羽':4, '张':4, '飞':4, '赵':3, '云':3, '诸':2, '葛':2, '亮':2 };
  for (const ch of NAME_CHARS) {
    const n = HOT[ch] || 2;
    for (let k = 0; k < n; k++) guaranteed.push(ch);
  }
  while (guaranteed.length < 52) {
    guaranteed.push(FILL_CHARS[guaranteed.length % FILL_CHARS.length]);
  }
  if (guaranteed.length > 52) guaranteed.length = 52;
  shuffle(guaranteed);
  let ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
  // Shop: 剔除羸兵 — bias toward higher ranks
  const removeLow = state._removeLow || 0;
  if (removeLow > 0) {
    const cut = Math.min(4, removeLow * 2);
    ranks = ranks.slice(cut); // drop 2/3/... 
    while (ranks.length < 13) ranks.push(10,11,12,13,14);
    ranks = ranks.slice(0, 13);
  }
  for (let i = 0; i < 52; i++) {
    const suit = SUITS[i % 4];
    const rank = ranks[Math.floor(i / 4) % ranks.length];
    cards.push({
      id: 'c' + (uid++),
      suit: suit.id,
      suitName: suit.name,
      suitCls: suit.cls,
      rank,
      char: guaranteed[i],
    });
  }
  return shuffle(cards);
}

// ========== Hand evaluation ==========
function rankCounts(cards) {
  const m = {};
  for (const c of cards) m[c.rank] = (m[c.rank] || 0) + 1;
  return Object.values(m).sort((a,b) => b - a);
}
function suitCounts(cards) {
  const m = {};
  for (const c of cards) m[c.suit] = (m[c.suit] || 0) + 1;
  return m;
}
function maxSuitInfo(cards) {
  const m = suitCounts(cards);
  let suit = null, n = 0;
  for (const [s, cnt] of Object.entries(m)) {
    if (cnt > n) { n = cnt; suit = s; }
  }
  return { suit, count: n };
}
function detectCombos(cards) {
  const chars = new Set(cards.map(c => c.char));
  const order = ['zhuge','guanyu','zhangfei','zhaoyun','liubei','caocao','zhouyu','lvbu'];
  const found = [];
  for (const id of order) {
    const g = GENERALS[id];
    if (g.chars.every(ch => chars.has(ch))) found.push(g);
  }
  return found;
}
function detectCombo(cards) {
  const all = detectCombos(cards);
  return all[0] || null;
}
function equippedFactions(jokers) {
  const set = new Set();
  for (const jid of jokers) {
    const g = GENERALS[jid];
    if (g && g.faction) set.add(g.faction);
  }
  return set;
}

/** v0.5：无扑克牌型。散兵 / 同阵 / 组将 / 连名 */
function evaluateHand(cards) {
  if (!cards.length) return null;
  const rankChips = cards.reduce((s, c) => s + c.rank, 0);
  const combos = detectCombos(cards);
  const info = maxSuitInfo(cards);
  const isFormation = info.count >= 3;
  const isVolley = cards.length === 5 && cards.every(c => c.suit === cards[0].suit);

  let id, name, typeBase, mult, pri;
  if (combos.length >= 2) {
    id = 'double_combo';
    name = '连名·' + combos.map(g => g.name).join('+');
    typeBase = 50;
    mult = 3;
    if (isFormation) mult += 1;
    mult *= 2; // 连名
    mult *= 2; // v0.6 组将暴击
    pri = 4;
  } else if (combos.length === 1) {
    id = 'combo';
    name = '组将·' + combos[0].name;
    typeBase = 50;
    mult = 3;
    if (isFormation) mult += 1;
    mult *= 2; // v0.6 组将暴击
    pri = 3;
  } else if (isFormation) {
    id = 'formation';
    name = isVolley ? ('齐射·' + FACTION_NAME[info.suit]) : ('同阵·' + FACTION_NAME[info.suit]);
    typeBase = 25;
    mult = isVolley ? 3 : 2;
    pri = 2;
  } else {
    id = 'scatter';
    name = '散兵';
    typeBase = 0;
    mult = 1;
    pri = 1;
  }

  return {
    type: { id, name, base: typeBase, mult, pri },
    displayName: name,
    base: typeBase,
    mult,
    rankChips,
    comboGeneral: combos[0] || null,
    combos,
    isFormation,
    isVolley,
    pri,
  };
}

function applyJokers(evalResult, cards, jokers, ctx) {
  ctx = ctx || {};
  const warSuit = ctx.warSuit || null;
  const warCount = warSuit ? cards.filter(c => c.suit === warSuit).length : 0;
  const warBonus = warCount * 4;
  let base = evalResult.base + evalResult.rankChips + warBonus;
  let mult = evalResult.mult;
  const notes = [];
  if (warBonus) notes.push('宣战+' + warBonus);

  const factions = equippedFactions(jokers);
  let resonateRaw = 0;
  if (factions.size) {
    for (const c of cards) {
      if (factions.has(c.suit)) resonateRaw++;
    }
  }
  const resonate = Math.min(3, resonateRaw);
  if (resonate) {
    mult += resonate;
    notes.push('共鸣×' + resonate + (resonateRaw > 3 ? '(封顶)' : ''));
  }
  // 连续两回散兵后，下一次倍率 -1
  if (ctx.highStreak >= 2) {
    const before = mult;
    mult = Math.max(1, mult - 1);
    if (mult < before) notes.push('连出散兵惩罚-1倍');
  }

  for (const jid of jokers) {
    if (jid === 'guanyu') {
      const allShu = cards.length > 0 && cards.every(c => c.suit === 'shu');
      if (allShu) {
        mult += 6; notes.push('关羽全蜀+6');
        if (evalResult.isFormation || evalResult.isVolley || evalResult.type.id === 'combo' || evalResult.type.id === 'double_combo') {
          // 全蜀且成阵/组将
          if (evalResult.isFormation || evalResult.isVolley) {
            mult += 4; notes.push('关羽蜀阵+4');
          }
        }
      }
    }
    if (jid === 'zhangfei') {
      const ok = evalResult.type.id === 'formation' || evalResult.type.id === 'combo' || evalResult.type.id === 'double_combo';
      if (ok) {
        base = Math.floor(base * 1.5);
        notes.push('张飞底分×1.5');
      }
    }
    if (jid === 'zhaoyun') {
      const tid = evalResult.type.id;
      if (ctx.firstPlay && !ctx.zhaoyunUsed && cards.length <= 2 && tid === 'scatter') {
        mult += 6; notes.push('赵云首出散兵+6');
      }
    }
  }

  // v0.6 连营：连续非散兵，第二次起 +N（N=当前连营数）
  const streak = ctx.structureStreak || 0;
  const isStruct = evalResult.type.id !== 'scatter';
  let Lianying = 0;
  if (isStruct && streak >= 1) {
    Lianying = streak + 1; // 本手打出后的连营数
    mult += Lianying;
    notes.push('连营×' + Lianying + '(+' + Lianying + ')');
  }
  // 已拥有武将再次组将：本回合倍率+2
  if (ctx.ownedReplay) {
    mult += 2;
    notes.push('再组将+2');
  }

  return {
    base, mult, score: base * mult, notes,
    typeBase: evalResult.base,
    rankChips: evalResult.rankChips,
    warBonus, resonate,
    lianying: Lianying,
  };
}

export {
  HAND_TYPES,
  GENERALS,
  FACTION_NAME,
  STAGES,
  suitCounts,
  maxSuitInfo,
  detectCombos,
  detectCombo,
  equippedFactions,
  evaluateHand,
  applyJokers,
};
