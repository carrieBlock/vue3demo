import { reactive } from "@vue/reactivity"

export function initProps(allProps, instance) {
    // 初始化props和attr
    // allprops有的属性更新到props上
    // 没有的更新到attr
    const props = {}
    const attrs = {}
    if (allProps) {
        for (const key in allProps) {
            const value = allProps[key]
            if (Object.prototype.hasOwnProperty.call(instance.type.props, key)) {
                props[key] = value
            } else {
                attrs[key] = value
            }
        }
    }
    instance.props = reactive(props)
    instance.attrs = attrs
}