/** v0.4 tests */
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
  guanyu: { faction:'shu', chars:['关','羽'] },
  zhangfei:{ faction:'shu', chars:['张','飞'] },
  zhaoyun:{ faction:'qun', chars:['赵','云'] },
  zhuge:{ faction:'shu', chars:['诸','葛','亮'] },
};
function rankCounts(cards){const m={};for(const c of cards)m[c.rank]=(m[c.rank]||0)+1;return Object.values(m).sort((a,b)=>b-a)}
function isFlush(cards){return cards.length>=5&&cards.every(c=>c.suit===cards[0].suit)}
function isMiniFlush(cards){return cards.length>=3&&cards.length<=4&&cards.every(c=>c.suit===cards[0].suit)}
function isStraight(cards){
  if(cards.length!==5)return false;
  const ranks=[...new Set(cards.map(c=>c.rank))].sort((a,b)=>a-b);
  if(ranks.length!==5)return false;
  if(ranks[0]===2&&ranks[1]===3&&ranks[2]===4&&ranks[3]===5&&ranks[4]===14)return true;
  return ranks[4]-ranks[0]===4;
}
function detectCombo(cards){
  const chars=new Set(cards.map(c=>c.char));
  for(const id of ['zhuge','guanyu','zhangfei','zhaoyun']){
    const g=GENERALS[id]; if(g.chars.every(ch=>chars.has(ch))) return {id,name:id};
  }
  return null;
}
function evaluateHand(cards){
  const counts=rankCounts(cards); const flush=isFlush(cards); const mini=isMiniFlush(cards);
  const straight=isStraight(cards); const combo=detectCombo(cards);
  let best=null;
  function consider(id){const t=HAND_TYPES.find(h=>h.id===id); const cand={...t}; if(!best||cand.pri>best.pri)best=cand;}
  if(flush&&straight)consider('straight_flush');
  if(counts[0]===4)consider('four');
  if(counts[0]===3&&counts[1]===2)consider('fullhouse');
  if(combo)consider('combo');
  if(flush)consider('flush');
  if(straight)consider('straight');
  if(counts[0]===3)consider('three');
  if(mini)consider('mini_flush');
  if(counts[0]===2&&counts[1]===2)consider('twopair');
  if(counts[0]===2)consider('pair');
  consider('high');
  return {type:best,base:best.base,mult:best.mult,rankChips:cards.reduce((s,c)=>s+c.rank,0),pri:best.pri};
}
function applyJokers(ev,cards,jokers,ctx={}){
  const warBonus=ctx.warSuit?cards.filter(c=>c.suit===ctx.warSuit).length*4:0;
  let base=ev.base+ev.rankChips+warBonus; let mult=ev.mult;
  const factions=new Set(jokers.map(j=>GENERALS[j]?.faction).filter(Boolean));
  let raw=0; for(const c of cards) if(factions.has(c.suit)) raw++;
  const resonate=Math.min(3,raw); mult+=resonate;
  if((ctx.highStreak||0)>=2) mult=Math.max(1,mult-1);
  for(const jid of jokers){
    if(jid==='guanyu'&&cards.length&&cards.every(c=>c.suit==='shu')){
      mult+=6; if(['flush','mini_flush','straight_flush'].includes(ev.type.id)) mult+=4;
    }
  }
  return {base,mult,score:base*mult,resonate,resonateRaw:raw};
}
let pass=0,fail=0;
function assert(n,c){if(c){pass++;console.log('✓',n)}else{fail++;console.error('✗',n)}}

assert('点数 A=14', evaluateHand([{suit:'wei',rank:14,char:'兵'},{suit:'shu',rank:2,char:'卒'}]).rankChips===16);
assert('小同花', evaluateHand([{suit:'shu',rank:2,char:'a'},{suit:'shu',rank:5,char:'b'},{suit:'shu',rank:9,char:'c'}]).type.id==='mini_flush');
{
  const cards=[{suit:'shu',rank:2,char:'a'},{suit:'shu',rank:3,char:'b'},{suit:'shu',rank:4,char:'c'},{suit:'shu',rank:5,char:'d'},{suit:'shu',rank:6,char:'e'}];
  // 5 shu flush: resonate raw 5 capped 3
  const sc=applyJokers(evaluateHand(cards),cards,['guanyu'],{});
  assert('共鸣封顶3', sc.resonate===3 && sc.resonateRaw===5);
}
{
  const cards=[{suit:'shu',rank:9,char:'兵'},{suit:'wei',rank:9,char:'卒'}];
  const sc=applyJokers(evaluateHand(cards),cards,['guanyu'],{});
  assert('关羽非整蜀不加6', sc.mult===2+1); // pair + resonate1
}
{
  const cards=[{suit:'wei',rank:14,char:'兵'}];
  const sc=applyJokers(evaluateHand(cards),cards,[],{highStreak:2});
  assert('连高牌惩罚-1', sc.mult===1); // already 1, stays 1
  const cards2=[{suit:'shu',rank:10,char:'兵'},{suit:'shu',rank:10,char:'卒'},{suit:'shu',rank:3,char:'将'}];
  // force pair? different ranks - use pair
  const pair=[{suit:'wei',rank:10,char:'兵'},{suit:'shu',rank:10,char:'卒'}];
  const sc2=applyJokers(evaluateHand(pair),pair,['guanyu'],{highStreak:2});
  // pair mult2 + resonate1 =3, then -1 => 2
  assert('连高后对子倍率-1', sc2.mult===2);
}
assert('宣战+4', applyJokers(evaluateHand([{suit:'wu',rank:10,char:'a'},{suit:'wu',rank:10,char:'b'}]),[{suit:'wu',rank:10,char:'a'},{suit:'wu',rank:10,char:'b'}],[],{warSuit:'wu'}).base===10+20+8);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
