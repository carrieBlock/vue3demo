
import { isString, ShapeFlags } from "@vue/shared"
export const createVNode = (type, props, children) => {
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0
    const vnode = {
        __v_isVnode: true,
        type,
        key: props?.key ?? null,
        props,
        el: null, //对应真实dom
        children, // vnode的孩子节点
        shapeFlag, //标记孩子类型
    }
    if (children) {
        vnode.shapeFlag |= isString(children) ? ShapeFlags.TEXT_CHILDREN : ShapeFlags.ARRAY_CHILDREN
    }
    return vnode
}

export const isVnode = (val) => val && val.__v_isVnode

export const isSameVNodeType = (v1, v2) => {
    return v1.type === v2.type && v1.key === v2.key;
};

export const normalizeVNode = (v) => {
    return createVNode(Text, null, v);
};

export const Text = Symbol("text");