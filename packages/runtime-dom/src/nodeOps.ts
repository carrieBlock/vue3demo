export const nodeOps = {
    insert(element, container, anchor) {
        container.insertBefore(element, anchor ?? null)
    },
    remove(element) {
        const parentNode = element.parentNode;
        if (parentNode) {
            parentNode.removeChild(element)
        }
    },
    createElement(type) {
        return document.createElement(type)
    },
    createText(text) {
        return document.createTextNode(text)
    },
    setText(node, text) {
        node.nodeValue = text
    },
    setElementText(el, text) {
        el.textContent = text
    },
    parentNode(el) {
        return el.parentNode;
    },
    nextSibling(el) {
        return el.nextSibling;
    },
    querySelector(selectors) {
        return document.querySelector(selectors)
    }
}