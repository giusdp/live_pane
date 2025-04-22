// @ts-nocheck
class ViewHookTest {
    constructor(hook, element) {
        this.el = element
        this.__callbacks = hook
        for (let key in this.__callbacks) {
            this[key] = this.__callbacks[key]
        }
    }

    trigger(callbackName) {
        this.__callbacks[callbackName].bind(this)()
    }

    pushEvent(_event, _payload) { }
    pushEvent(_target, _event, _payload) { }

    element() {
        return this.el
    }
}
function createElementFromHTML(htmlString) {
    const div = document.createElement('div')
    div.innerHTML = htmlString.trim()
    return div.firstChild
}

export function renderHook(htmlString, hook) {
    const element = createElementFromHTML(htmlString)
    return new ViewHookTest(hook, element)
}
