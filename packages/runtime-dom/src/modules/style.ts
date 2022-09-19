export const patchStyle = (el, oldStyle, newStyle) => {
    const style = el.style;
    for (const key in newStyle) {
        style[key] = newStyle[key]
    }
    if (oldStyle) {
        for (const key in oldStyle) {
            if (newStyle[key] == null) {
                style[key] = ""; // 删除老的样式
            }
        }
    }
}

// 如果新的样式key不存在 style[key] = ""