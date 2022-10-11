import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
import { patchStyle } from "./modules/style";
import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { createRenderer } from "packages/runtime-core/src/renderer";

export const rendererOptions = {
  patchProp,
  ...nodeOps,
  patchStyle,
  patchAttr,
  patchClass,
  patchEvent
};

export const render = (vnode, container) => {
  const { render: _render } = createRenderer(rendererOptions);
  _render(vnode, container);
};
export * from "@vue/runtime-core";
