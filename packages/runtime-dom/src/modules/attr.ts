export const patchAttr = (el, key, newValue) => {
    if (newValue == null) {
        el.removeAttribute(key)
    } else {
        el.setAttribute(key)
    }
}