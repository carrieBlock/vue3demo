import { initProps } from "./componentProps"
import { nextTick } from "./scheduler";

export function createComponentInstance(vnode) {
    let uid = 0
    const instance = {
        uid: uid++, // 组件唯一id
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
        const { data, props } = instance
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key]
        } else if (Object.prototype.hasOwnProperty.call(props, key)) {
            return props[key]
        }
        // 先读data再读props
        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    },
    set(instance, key, value) {
        const { data, props } = instance
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            data[key] = value
            return true
        } else if (Object.prototype.hasOwnProperty.call(props, key)) {
            console.warn('props is readonly')
            return false
        }
    }
}
export function setupComponent(instance) {
    const { props, children } = instance.vnode
    // 初始化props
    initProps(props, instance)

    instance.proxy = new Proxy(instance, PublicComponentProxyHandlers)
}