import { proxyRefs } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps"
import { nextTick } from "./scheduler";

export function createComponentInstance(vnode) {
    let uid = 0
    const instance = {
        uid: uid++, // 组件唯一id
        setupState: {}, // setup函数返回对象的数据
        data: {}, // 组件的data数据
        props: {}, // 组件的props
        attrs: {}, // 组件的attrs
        ctx: null, // 组件的上下文 contentText
        subTree: null, // 组件内部render函数返回的虚拟节点对象
        vnode, // 组件本身的vnode
        type: vnode.type, // 组件type
        effect: null, // 组件的effect
        update: null, // 组件更新的方法
        isMounted: false, // 组件是否挂载了
        setupContext: null,
    }
    instance.ctx = { _: instance }  // ????什么操作
    console.log(instance)
    return instance
}

const publicPropertiesMap = {
    $attrs: i => i.attrs,
    $data: i => i.data,
    $props: i => i.props,
    $el: i => i.vnode.el,
    $nextTick: () => nextTick,
}

const PublicComponentProxyHandlers = {
    get(instance, key) {
        const { data, props, setupState } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        } else if (data && hasOwn(data, key)) {
            return data[key];
        } else if (props && hasOwn(props, key)) {
            return props[key];
        }
        // 先读data再读props
        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    },
    set(instance, key, value) {
        const { data, props, setupState } = instance;
        if (hasOwn(setupState, key)) {
            setupState[key] = value; //
        } else if (data && hasOwn(data, key)) {
            data[key] = value;
            return true;
        } else if (props && hasOwn(props, key)) {
            console.warn("props is readonly");
            return false;
        }
    }
}
export function setupComponent(instance) {
    const { props, children } = instance.vnode
    // 初始化props
    initProps(props, instance)

    instance.proxy = new Proxy(instance, PublicComponentProxyHandlers)

    const { setup, render, template } = instance.type;

    if (setup) {
        const setupContext = (instance.setupContext = createSetupContext(instance));
        setCurrentInstance(instance);
        const setupResult = setup(instance.props, setupContext); // setup(props,{emit,slots,attrs,expose}){return () =>{}}
        setCurrentInstance(null);
        if (isFunction(setup)) {
            instance.render = setup(instance.props, setupContext);
        } else {
            instance.setupState = proxyRefs(setupResult);
        }
    }
    if (!instance.render) {
        if (isFunction(render)) {
            instance.render = render;
        } else {
            if (template) {
                // todo 模版编译
            }
        }
    }

    if (!instance.render) {
        instance.render = () => { };
    }
}


function createSetupContext(instance) {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: function emit(eventName, ...args) {
            const props = instance.vnode.props;
            const handlerName = `on${eventName[0].toUpperCase()}${eventName.slice(
                1
            )}`;
            const handler = props[handlerName];
            handler && handler(...args);
        },
    };
}

export let currentInstance;
export const getCurrentInstance = () => currentInstance;
export const setCurrentInstance = (i) => (currentInstance = i);