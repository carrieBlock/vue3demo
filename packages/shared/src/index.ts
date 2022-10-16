export const isObject = (val) => typeof val === "object" && val !== null;

export const isFunction = (val) => typeof val === "function";

const onRE = /on[^a-z]/; // onClick
export const isOn = (key: string) => onRE.test(key);

export const isString = (val) => typeof val === "string";

export const isNumber = (val) => typeof val === "number";

export const isArray = Array.isArray;

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (obj, key) =>
  isObject(obj) && hasOwnProperty.call(obj, key);

export const enum ShapeFlags {
  ELEMENT = 1 << 0, // 1
  FUNCTIONAL_COMPONENT = 1 << 1, // 2
  STATEFUL_COMPONENT = 1 << 2, // 4
  TEXT_CHILDREN = 1 << 3, // 8
  ARRAY_CHILDREN = 1 << 4, // 16
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
