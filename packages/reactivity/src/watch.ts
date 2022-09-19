import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

const initVal = {};
export function watch(source, cb, options) {
    const { immediate } = options ?? {}
    let getter: () => any
    if (isReactive(source)) {
        getter = () => traverse(source)
        console.log(getter, 'getter reactive')
    } else if (isFunction(source)) {
        getter = source
    }

    const job = () => {
        // const newValue = effect.run();
        const newValue = effect.run();
        console.log('newValue',newValue)
        cb(newValue, oldValue === initVal ? undefined : oldValue);
        oldValue = newValue;
    }

    let oldValue = initVal;
    const effect = new ReactiveEffect(getter, {
        scheduler: job
    })

    if (cb) {
        if (immediate) {
            job()
        } else {
            oldValue = effect.run()
            console.log('oldValue',oldValue)
        }
    }
}

function traverse(source, set = new Set()) {
    if (!isObject(source)) return source;
    if (set.has(source)) return source;
    set.add(source);
    for (const key in source) {
        traverse(source[key], set);
    }
    return source;
}
