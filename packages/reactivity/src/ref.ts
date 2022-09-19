
import { trackEffect, triggerEffect } from "./effect";
import { isReactive, toReactive } from "./reactive";

export function isRef(r) {
    return !!(r && r.__v_isRef === true)
}

export function ref(value) {
    if (isRef(value)) return value
    return new RefImpl(value)
}

class RefImpl {
    public _rawValue;
    public _value;
    public _deps;
    public __v_isRef = true;
    constructor(value) {
        this._rawValue = value;
        this._value = value;
    }
    get value() {
        trackEffect(this._deps || (this._deps = new Set()))
        return this._value
    }
    set value(newVal) {
        if (!Object.is(this._rawValue, newVal)) {
            this._rawValue = newVal;
            this._value = toReactive(newVal);
            triggerEffect(this._deps);
        }
    }
}
export function toRef(target, key, defaultValue?) {
    const val = target[key];
    return isRef(val) ? val : new ObjectRefImpl(target, key, defaultValue)
}

class ObjectRefImpl {
    public __v_isRef = true;
    constructor(public _object, public _key, public _defaultValue) { }
    get value() {
        const val = this._object[this._key]
        return val === undefined ? this._defaultValue : val
    }
    set value(val) {
        this._object[this._key] = val
    }
}
export function unRef(r) {
    return isRef(r) ? r.value : r;
}
export function toRefs(target) {
    const ret = {};
    if (!isReactive(target)) {
        return target
    }
    for (const key in target) {
        ret[key] = toRef(target, key)
    }
    return ret
}


export function customRef(factory) {
    return new CustomRefImpl(factory)
}

class CustomRefImpl {
    public __v_isRef = true;
    public _deps;
    public _get;
    public _set;
    constructor(public factory) {
        const { get, set } = factory(
            () => trackEffect(this._deps || (this._deps = new Set())),
            () => triggerEffect(this._deps)
        )
        this._get = get()
        this._set = set()
    }
    get value() {
        return this._get()
    }
    set value(val) {
        this._set(val);
    }
}

