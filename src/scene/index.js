// scene/index.js
//
// 方块注册表。加新方块只需两步：
//   1. 新建 src/scene/<name>.js，导出一个 `block` 描述符（可参考 base.js）：
//        export const block = {
//          name: '<name>',                       // 唯一名字，调试用 window.__dbg.parts.<name>
//          build: (world) => ({ group }),       // 建几何体，返回需要的引用（可带 update）
//          skipOutline: (handles) => [handles.group],  // 可选：这些对象不参与外描边
//        };
//      想让方块自己动起来，就在 build 返回值里加 update(dt, elapsed)，main.js 会自动调用。
//   2. 在下面 BLOCKS 数组里加一行。
//
// 数组顺序即建模顺序，同时决定描边与阴影计算的顺序，通常按「地面 → 建筑 → 细节」排。

import { block as base } from './base.js';
import { block as street } from './street.js';
import { block as store } from './store.js';
import { block as interior } from './interior.js';
import { block as props } from './props.js';
import { block as poles } from './poles.js';
import { block as alley } from './alley.js';

export const BLOCKS = [base, street, store, interior, props, poles, alley];

/**
 * 依次构建所有方块。
 * @param {THREE.Object3D} world 场景根节点
 * @returns {{ parts: Record<string, any>, outlineSkip: THREE.Object3D[] }}
 */
export function buildBlocks(world) {
  const parts = {};
  const outlineSkip = [];
  for (const b of BLOCKS) {
    const handles = b.build(world) ?? {};
    parts[b.name] = handles;
    if (b.skipOutline) outlineSkip.push(...b.skipOutline(handles));
  }
  return { parts, outlineSkip };
}

/** 每帧驱动所有方块的 update。 */
export function updateBlocks(parts, dt, elapsed) {
  for (const b of BLOCKS) parts[b.name]?.update?.(dt, elapsed);
}