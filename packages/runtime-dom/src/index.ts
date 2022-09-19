import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

const rendererOptions = {
  patchProp,
  ...nodeOps,
};

console.log(rendererOptions, "rendererOptions");

export * from "@vue/runtime-core";
