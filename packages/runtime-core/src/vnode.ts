
import { isString, ShapeFlags, isObject, isNumber, isArray } from "@vue/shared"
export const createVNode = (type, props, children) => {
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;
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
        let type;
        if (isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else if (isObject(children)) {
            type = ShapeFlags.SLOTS_CHILDREN;
        } else {
            type = ShapeFlags.TEXT_CHILDREN;
            children = String(children);
        }
        vnode.shapeFlag |= type;
    }
    return vnode
}

export const isVnode = (val) => val && val.__v_isVnode

export const isSameVNodeType = (v1, v2) => {
    return v1.type === v2.type && v1.key === v2.key;
};

export const normalizeVNode = (v) => {
    if (isString(v) || isNumber(v)) {
        return createVNode(Text, null, String(v));
    }
};

export const Text = Symbol("text");

export const Fragment = Symbol('fragment')


