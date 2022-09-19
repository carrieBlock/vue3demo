var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    customRef: () => customRef,
    effect: () => effect,
    isRef: () => isRef,
    reactive: () => reactive,
    ref: () => ref,
    toRef: () => toRef,
    toRefs: () => toRefs,
    unRef: () => unRef,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (val) => typeof val === "object" && val !== null;
  var isFunction = (val) => typeof val === "function";
  var isArray = Array.isArray;

  // packages/reactivity/src/effect.ts
  var activeEffect;
  function effect(fn, options) {
    const effect2 = new ReactiveEffect(fn, options);
    effect2.run();
    const runner = effect2.run.bind(effect2);
    runner.effect = effect2;
    return runner;
  }
  function cleanUpEffect(effect2) {
    let deps = effect2.deps;
    if (deps) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect2);
      }
      deps.length = 0;
    }
  }
  var ReactiveEffect = class {
    constructor(fn, options) {
      this.fn = fn;
      this.options = options;
      this.acitve = true;
      this.deps = [];
    }
    run() {
      if (!this.acitve) {
        return this.fn();
      } else {
        try {
          this.parent = activeEffect;
          activeEffect = this;
          cleanUpEffect(this);
          return this.fn();
        } finally {
          activeEffect = this.parent;
          this.parent = void 0;
        }
      }
    }
  };
  var proxyMap = /* @__PURE__ */ new WeakMap();
  function track(target, key) {
    if (activeEffect) {
      let depsMap = proxyMap.get(target);
      if (!depsMap) {
        proxyMap.set(target, depsMap = /* @__PURE__ */ new Map());
      }
      let deps = depsMap.get(key);
      if (!deps) {
        depsMap.set(key, deps = /* @__PURE__ */ new Set());
      }
      trackEffect(deps);
    }
  }
  function trackEffect(deps) {
    console.log(activeEffect, "activeEffect");
    if (activeEffect) {
      deps.add(activeEffect);
      activeEffect.deps.push(deps);
    }
  }
  function trigger(target, key, value, oldValue) {
    const depsMap = proxyMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    triggerEffect(effects);
  }
  function triggerEffect(effects) {
    if (effects) {
      effects = [...new Set(effects)];
      effects.forEach((effect2) => {
        var _a;
        if (effect2 !== activeEffect) {
          if ((_a = effect2.options) == null ? void 0 : _a.scheduler) {
            effect2.options.scheduler();
          } else {
            effect2.run();
          }
        }
      });
    }
  }

  // packages/reactivity/src/baseHandlers.ts
  var baseHandler = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      const res = Reflect.get(target, key, receiver);
      track(target, key);
      if (res && isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const res = Reflect.set(target, key, value, receiver);
      if (!Object.is(oldValue, value)) {
        trigger(target, key, value, oldValue);
      }
      return res;
    }
  };

  // packages/reactivity/src/reactive.ts
  var isReactive = (value) => value && value[Reactive_FLAGS.IS_REACTIVE];
  var proxyMap2 = /* @__PURE__ */ new WeakMap();
  var Reactive_FLAGS = /* @__PURE__ */ ((Reactive_FLAGS2) => {
    Reactive_FLAGS2["IS_REACTIVE"] = "__v_isReactive";
    return Reactive_FLAGS2;
  })(Reactive_FLAGS || {});
  var toReactive = (r) => isObject(r) ? reactive(r) : r;
  function reactive(value) {
    if (!isObject(value)) {
      return value;
    }
    if (value["__v_isReactive" /* IS_REACTIVE */]) {
      return value;
    }
    const exitsingProxy = proxyMap2.get(value);
    if (exitsingProxy) {
      return exitsingProxy;
    }
    const proxy = new Proxy(value, baseHandler);
    proxyMap2.set(value, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  function computed(getterOrOptions) {
    const isOnlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if (isOnlyGetter) {
      getter = getterOrOptions;
      setter = () => {
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedImpl(getter, setter);
  }
  var ComputedImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this.__v_isRef = true;
      this._dirty = true;
      this._effect = new ReactiveEffect(getter, {
        scheduler: () => {
          this._dirty = true;
          triggerEffect(this.deps);
        }
      });
    }
    get value() {
      trackEffect(this.deps || (this.deps = /* @__PURE__ */ new Set()));
      if (this._dirty) {
        this._dirty = false;
        this._value = this._effect.run();
      }
      return this._value;
    }
    set value(val) {
      this.setter(val);
    }
  };

  // packages/reactivity/src/watch.ts
  var initVal = {};
  function watch(source, cb, options) {
    const { immediate } = options != null ? options : {};
    let getter;
    if (isReactive(source)) {
      getter = () => traverse(source);
      console.log(getter, "getter reactive");
    } else if (isFunction(source)) {
      getter = source;
    }
    const job = () => {
      const newValue = effect2.run();
      console.log("newValue", newValue);
      cb(newValue, oldValue === initVal ? void 0 : oldValue);
      oldValue = newValue;
    };
    let oldValue = initVal;
    const effect2 = new ReactiveEffect(getter, {
      scheduler: job
    });
    if (cb) {
      if (immediate) {
        job();
      } else {
        oldValue = effect2.run();
        console.log("oldValue", oldValue);
      }
    }
  }
  function traverse(source, set = /* @__PURE__ */ new Set()) {
    if (!isObject(source))
      return source;
    if (set.has(source))
      return source;
    set.add(source);
    for (const key in source) {
      traverse(source[key], set);
    }
    return source;
  }

  // packages/reactivity/src/ref.ts
  function isRef(r) {
    return !!(r && r.__v_isRef === true);
  }
  function ref(value) {
    if (isRef(value))
      return value;
    return new RefImpl(value);
  }
  var RefImpl = class {
    constructor(value) {
      this.__v_isRef = true;
      this._rawValue = value;
      this._value = value;
    }
    get value() {
      trackEffect(this._deps || (this._deps = /* @__PURE__ */ new Set()));
      return this._value;
    }
    set value(newVal) {
      if (!Object.is(this._rawValue, newVal)) {
        this._rawValue = newVal;
        this._value = toReactive(newVal);
        triggerEffect(this._deps);
      }
    }
  };
  function toRef(target, key, defaultValue) {
    const val = target[key];
    return isRef(val) ? val : new ObjectRefImpl(target, key, defaultValue);
  }
  var ObjectRefImpl = class {
    constructor(_object, _key, _defaultValue) {
      this._object = _object;
      this._key = _key;
      this._defaultValue = _defaultValue;
      this.__v_isRef = true;
    }
    get value() {
      const val = this._object[this._key];
      return val === void 0 ? this._defaultValue : val;
    }
    set value(val) {
      this._object[this._key] = val;
    }
  };
  function unRef(r) {
    return isRef(r) ? r.value : r;
  }
  function toRefs(target) {
    const ret = {};
    if (!isReactive(target)) {
      return target;
    }
    for (const key in target) {
      ret[key] = toRef(target, key);
    }
    return ret;
  }
  function customRef(factory) {
    return new CustomRefImpl(factory);
  }
  var CustomRefImpl = class {
    constructor(factory) {
      this.factory = factory;
      this.__v_isRef = true;
      const { get, set } = factory(
        () => trackEffect(this._deps || (this._deps = /* @__PURE__ */ new Set())),
        () => triggerEffect(this._deps)
      );
      this._get = get();
      this._set = set();
    }
    get value() {
      return this._get();
    }
    set value(val) {
      this._set(val);
    }
  };
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
