"use strict";
const commonUtils = {
    requireElement(id, ctor) {
        const element = document.getElementById(id);
        if (!(element instanceof ctor)) {
            throw new Error(`Required element not found or invalid: #${id}`);
        }
        return element;
    },
    getElementById(id, ctor) {
        const element = document.getElementById(id);
        return element instanceof ctor ? element : null;
    },
    getElementByClass(selector, ctor) {
        const element = document.querySelector(selector);
        return element instanceof ctor ? element : null;
    },
    toMessage(error) {
        return error instanceof Error ? error.message : String(error);
    },
    getName(error) {
        return error instanceof Error ? error.name : "";
    },
};
window.commonUtils = commonUtils;
