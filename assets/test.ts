// @ts-nocheck
class ViewHookTest {
    constructor(hook, element) {
        this.el = element
        this.__callbacks = hook
        for (let key in this.__callbacks) {
            this[key] = this.__callbacks[key]
        }
    }

    handleEvent(eventName, callback) {
        this.__callbacks[eventName] = callback
    }

    trigger(callbackName) {
        this.__callbacks[callbackName].bind(this)()
    }

    pushEvent(eventName, payload) {
        const cb = this.__callbacks[eventName]
        cb(payload)
    }

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
