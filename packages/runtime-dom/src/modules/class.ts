export const patchClass = (el, newValue) => {
    if (newValue) {
        el.className = newValue
    } else {
        el.className = ""
    }
}