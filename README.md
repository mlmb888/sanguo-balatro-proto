# 三国组字（v0.7）

竖屏 H5：**合成 / 拼字养成**（非扑克、非塔防）。

## 试玩

https://mlmb888.github.io/sanguo-balatro-proto/?v=7

## 怎么玩

1. **抽一字** 填入 4×3 空槽  
2. **点两格合成**：同字升阶（兵→锐→将）；关+羽→关羽  
3. 场上单位提供 **底分×倍率 = 战力**，凑够本关目标  

章一：小关1 → 小关2 → 虎牢关（必须有武将才计战力）。

## 本地

```bash
npx serve -l 5173 .
node test-logic.mjs
node smoke.mjs
```
