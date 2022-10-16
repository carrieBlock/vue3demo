import { isSameVNodeType, normalizeVNode, Text, Fragment } from "./vnode";
import { patchProp } from "packages/runtime-dom/src/patchProp";
import { isNumber, isString, ShapeFlags } from "@vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { reactive, ReactiveEffect } from "@vue/reactivity";
import { updateProps } from "./componentProps";
import { queueJob } from "./scheduler";

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
            const child = children[i] =
                isString(children[i]) || isNumber(children[i])
                    ? normalizeVNode(children[i])
                    : children[i]; // [{children:'123',type:Symbol('text')},123]
            console.log(child)
            patch(null, child, el);
        }
    };

    const mountElement = (vnode, container, anchor) => {
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
        hostInsert(el, container, anchor);
    }
    const mountComponent = (vnode, container, anchor) => {
        // 创建组件实例
        const instance = vnode.component = createComponentInstance(vnode)
        console.log('instance', instance)
        setupComponent(instance)
        // 初始化props 和instance 访问 proxy 先访问data再访问props的数据
        setupRenderEffect(instance, container, anchor)
    }
    const componentUpdatePreRender = (instance, next) => {
        const prevProps = instance.props;
        const nextProps = next.props;
        updateProps(prevProps, nextProps);
        instance.next = null;
        instance.vnode = next;
    };
    const setupRenderEffect = (instance, container, anchor) => {
        const { data, render } = instance.type

        let state;
        if (data) {
            state = instance.data = reactive(data());
        }
        // 响应式数据

        const componentUpdateFn = () => {
            if (!instance.isMounted) {
                // 挂载
                const subTree = instance.subTree = render.call(instance.proxy)
                patch(null, subTree, container, anchor)
                instance.isMounted = true
            } else {
                // debugger
                const { next } = instance;
                if (next) {
                    componentUpdatePreRender(instance, next)
                }
                // 更新
                const nextTree = render.call(instance.proxy)
                const prevTree = instance.subTree
                patch(prevTree, nextTree, container, anchor)
                instance.subTree = nextTree
            }
        }
        const effect = instance.effect = new ReactiveEffect(componentUpdateFn, {
            scheduler: () => {
                queueJob(update);
            },
        })
        const update = instance.update = effect.run.bind(effect)
        update()
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
    const patchedKeyChildren = (c1, c2, container) => {
        let i = 0;
        let e1 = c1.length - 1
        let e2 = c2.length - 1
        // ab
        // abc
        // i = 0,e1 = 1,e2 = 2
        // i = 2,e1 = 1,e2 = 2
        while (i <= e1 && i <= e2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if (isSameVNodeType(n1, n2)) {
                // 是同一个节点就更新
                patch(n1, n2, container)
            } else {
                break;
            }
            i++;
        }

        //   ab
        // c ab
        // i = 0,e1 = 1,e2 = 2
        // i = 0,e1 = -1,e2 = 0
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = normalizeVNode(c2[e2]) // 需要包装 
            // const n2 = c2[e2]
            if (isSameVNodeType(n1, n2)) {
                // 是同一个节点就更新
                patch(n1, n2, container)
            } else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                while (i <= e2) {
                    const nextPos = e2 + 1;
                    // 获取下一个节点
                    const anchor = nextPos < c2.length ? c2[nextPos].el : null;
                    patch(null, c2[i], container, anchor)
                    i++
                }
            }
        } else if (i > e2) {
            // ab c
            // ab
            // i = 0,e1 = 2,e2 = 1
            // i = 2,e1 = 2,e2 = 1

            // c ab
            // ab
            // i = 0,e1 = 2,e2 = 1
            // i = 0,e1 = 0,e2 = -1
            unmount(c1[i]);
            i++;
        } else {
            // 同等长度 中间不同
            // a b [c d e] f g
            // a b [d e h] f g
            // i = 0,e1 = 6,e2 = 6 
            // i = 2,e1 = 6,e2 = 6 while1
            // i = 2,e1 = 4,e2 = 4, while2
            let s1 = i;
            let s2 = i;
            let j;
            const toBePatched = e2 - s2 + 1
            const keyToNewIndexMap = new Map()
            console.log(e2)
            console.log(s2)
            console.log(toBePatched)
            console.log(Array(toBePatched))
            const newIndexToOldIndexMap = Array(toBePatched).fill(0) // [0,0,0] 创建需要变化的长度的数组 [0,0,0,0]
            // 把旧的节点map存储key
            for (let i = s2; i < e2; i++) {
                keyToNewIndexMap.set(c2[i].key, i);
            }
            for (let i = s1; i < e1; i++) {
                const prevChild = c1[i]
                const index = keyToNewIndexMap.get(prevChild.key)
                if (index == undefined) {
                    // 如果新的节点有 但是旧的节点没有
                    unmount(prevChild)
                } else {
                    newIndexToOldIndexMap[index - s2] = i + 1  // ?
                    patch(prevChild, c2[index], container);
                }
            }

            const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap) // [0,1] 不需要移动的那一项节点的索引

            j = increasingNewIndexSequence.length - 1 // 1

            for (let i = toBePatched - 1; i >= 0; i--) {
                const index = s2 + i; //后一项 要操作的部分末尾项
                const nextChild = c2[index] //最后一项节点
                const anchor = index + 1 < c2.length ? c2[index + 1] : null
                if (!nextChild.el) {
                    patch(null, nextChild, container, anchor);
                } else {
                    // hostInsert(nextChild.el, container, anchor);
                    if (i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    } else {
                        j--
                    }
                }
            }

        }
    }
    const patchChildren = (n1, n2, el, container) => {
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
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 新节点是文本节点
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 1. 新文本，旧数组
                unmountChildren(c1);
            }
            // 2. 新文本，旧空
            // 3. 新文本，旧文本
            if (c1 !== c2) {
                hostSetElementText(el, c2);
            }
        } else {

            // 新节点不是文本节点 可为（空） 可为（数组）
            // 旧节点 空 数组 文本都有可能
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 旧为数组
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 新也是数组 dosomething
                    patchedKeyChildren(c1, c2, el);
                } else {
                    // 新为空 卸载旧节点
                    unmountChildren(c1)
                }
            } else {
                // 旧为文本 或 空
                // 新为空 或 数组
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    // 旧文本 无论新节点为 空或数组都需要把 旧的文本节点制空
                    hostSetElementText(el, '')
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 新节点为数组 旧为空  新为数组 旧文本
                    mountChildren(c2, el)
                }
                // 新的为空 不做操作
            }
        }
    };
    const patchElement = (n1, n2, container) => {
        const el = (n2.el = n1.el);
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el, container);
    }
    const processText = (n1, n2, container) => {
        if (n1 == null) {
            const text = hostCreateText(n2.children);
            n2.el = text
            hostInsert(text, container)
        } else {
            const el = (n2.el = n1.el)
            // 旧dom 新的children

            hostSetElementText(el, n2.children)
        }
    }
    const processFragment = (n1, n2, container, anchor) => {
        console.log(n1, n2)
        if (n1 == null) {
            // 创建节点
            mountChildren(n2.children, container);
        } else {
            // 更新节点
            const el = n2.el = n1.el
            patchChildren(n1, n2, el, container)
        }
    }
    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) {
            // 创建节点
            mountElement(n2, container, anchor);
        } else {
            // 更新节点
            patchElement(n1, n2, container);
        }
    }
    const processComponent = (n1, n2, container, anchor) => {
        if (n1 == null) {
            // 挂载component
            mountComponent(n2, container, anchor)
        } else {
            // 更新component
            updateComponent(n1, n2);
        }
    }
    const updateComponent = (n1, n2) => {
        // 复用组件
        const instance = (n2.component = n1.component);
        instance.next = n2;
        instance.update();
    }
    const patch = (n1, n2, container, anchor = null) => {
        if (n1 && !isSameVNodeType(n1, n2)) {
            unmount(n1);
            n1 = null;
        }

        const { type, shapeFlag } = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, anchor)
                }
        }
    };

    const unmount = (vnode) => {
        const { el, type } = vnode
        if (type === Fragment) {
            unmountChildren(vnode.children)
        } else {
            hostRemove(el)
        }
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


function getSequence(arr) {
    let p = arr.slice()
    let len = arr.length;
    let start, end, mid; // 二分
    let result = [0] // 查找的第一项的索引
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]  //当前项
        const j = result[result.length - 1] // 最后一项
        if (arrI !== 0) {
            if (arr[j] < arrI) {
                // 最后一项小于当前项
                p[i] = j;
                result.push(i);
                continue;
            }
            start = 0;
            end = result.length - 1
            while (start < end) {
                mid = (start + end) >> 1 // 等同于两数之和向下取整
                if (arr[result[mid]] < arrI) {
                    start = mid + 1
                } else {
                    end = mid
                }
            }

            if (arrI < arr[result[start]]) {
                if (start > 0) {
                    p[i] = result[start - 1]
                }
                result[start] = i
            }
        }
    }
    let i = result.length;
    let lastIndex = result[i - 1];
    while (i-- > 0) {
        result[i] = lastIndex;
        lastIndex = p[lastIndex];
    }
    return result;
}