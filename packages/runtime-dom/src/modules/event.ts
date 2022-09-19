
export const patchEvent = (el, key, oldHandler, newHandler) => {
    const invokers = el._vei || (el._vei = {});
    const exitstingInvoker = invokers[key]; //
    if (exitstingInvoker && newHandler) {
        //更新  直接替换invoker的value
        invokers.value = newHandler; // f2
    } else {
        if (newHandler) {
            // add
            const invoker = (invokers[key] = createInvoker(newHandler));
            el.addEventListener(key.slice(2).toLowercase(), invoker);
        } else if (oldHandler) {
            // remove
            el.removeEventListener(key.slice(2).toLowercase(), exitstingInvoker);
            invokers[key] = undefined;
        }
    }
};

export const createInvoker = (fn) => {
    // f1
    const invoker = (event) => {
        invoker.value(event); // f1(event) f2
    };
    // invoker.value = f1
    invoker.value = fn;
    return invoker;
};
