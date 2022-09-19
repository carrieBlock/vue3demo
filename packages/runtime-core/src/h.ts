import { isArray, isObject } from "@vue/shared";
import { createVNode, isVnode } from './vnode'

export function h(type, propsOrChildren, children) {
    let length = arguments.length;
    if (length === 2) {
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            // 对象 且非数组
            // 单独的vnode节点 且没有属性
            if (isVnode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren])
            }
            // 只有属性 没有孩子
            return createVNode(type, propsOrChildren, null)
        } else {
            return createVNode(type, null, propsOrChildren)
        }
    } else {
        if (length > 3) {
            // 获取children参数
            children = Array.prototype.slice.call(arguments, 2)
        } else if (length === 3 && isVnode(children)) {
            children = [children]
        }
        return createVNode(type, propsOrChildren, children)
    }
}