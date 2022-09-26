import { isSameVNodeType, normalizeVNode, Text } from "./vnode";
import { patchProp } from "packages/runtime-dom/src/patchProp";
import { isNumber, isString, ShapeFlags } from "@vue/shared";
export function createRenderer(options) {
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
    } = options;
    const mountChildren = (children, el) => {
        for (let i = 0; i < children.length; i++) {
            const child =
                isString(children[i]) || isNumber(children[i])
                    ? normalizeVNode(children[i])
                    : children[i]; // [{children:'123',type:Symbol('text')},123]
            patch(null, child, el);
        }
    };

    const mountElement = (vnode, container) => {
        const { type, props, shapeFlag, children } = vnode;
        // 创建一个元素，并且让虚拟节点的el属性指向真实元素
        const el = (vnode.el = hostCreateElement(type));

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 文本节点
            hostSetElementText(el, children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }

        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        hostInsert(el, container);
    }
    const patchProps = (oldProps, newProps, el) => {
        for (const key in newProps) {
            patchProp(el, key, oldProps[key], newProps[key]);
        }

        for (const key in oldProps) {
            if (newProps[key] == null) {
                patchProp(el, key, oldProps[key], null);
            }
        }
    };
    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i]);
        }
    };

    const patchChildren = (n1, n2, el) => {
        const c1 = n1 && n1.children;
        const c2 = n2 && n2.children;
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        /**
         * 新     旧
         * 文本   文本
         * 文本   数组
         * 文本   空
         *
         * 数组   文本
         * 数组   数组
         * 数组   空
         *
         * 空     文本
         * 空     数组
         * 空     空
         *
         */
        /**
         * 1. render(h('span','123'))
         * 2. render(h('span',['hello']))
         */
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 1. 新文本，旧数组
                unmountChildren(c1);
            }
            // 2. 新文本，旧空
            // 3. 新文本，旧文本
            if (c1 !== c2) {
                hostSetElementText(el, c2);
            }
        }
    };
    const patchElement = (n1, n2, container) => {
        const el = (n2.el = n1.el);
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el);
    }
    const processText = (n1, n2, container) => {
        if (n1 == null) {
            const text = hostCreateText(n2.children);
            hostInsert(text, container)
        } else {
            const el = (n2.el = n1.el)
            // 旧dom 新的children
            hostSetElementText(el, n2.children)
        }
    }
    const processElement = (n1, n2, container) => {
        if (n1 == null) {
            // 创建节点
            mountElement(n2, container);
        } else {
            // 更新节点
            patchElement(n1, n2, container);
        }
    }
    const patch = (n1, n2, container) => {
        if (n1 && !isSameVNodeType(n1, n2)) {
            unmount(n1);
            n1 = null;
        }

        const { type, shapeFlag } = n2;

        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container);
                }
                break;
        }
    };

    const unmount = (vnode) => {
        hostRemove(vnode.el)
    }
    const render = (vnode, container) => {
        if (vnode == null) {
            if (container._vnode) {
                // 卸载node节点
                unmount(container._vnode)
            }
        } else {
            //patch
            patch(container._vnode || null, vnode, container)
        }
        container._vnode = vnode;
    }
    return {
        render
    }
}