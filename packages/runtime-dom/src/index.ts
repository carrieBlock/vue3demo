import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
import { patchStyle } from "./modules/style";
import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";

export const rendererOptions = {
  patchProp,
  ...nodeOps,
  patchStyle,
  patchAttr,
  patchClass,
  patchEvent
};

console.log(rendererOptions, "rendererOptions");
export * from "@vue/runtime-core";
