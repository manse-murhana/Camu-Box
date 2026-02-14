const commonUtils = {
  requireElement<T extends Element>(id: string, ctor: { new (): T }): T {
    const element = document.getElementById(id);
    if (!(element instanceof ctor)) {
      throw new Error(`Required element not found or invalid: #${id}`);
    }
    return element;
  },

  getElementById<T extends Element>(id: string, ctor: { new (): T }): T | null {
    const element = document.getElementById(id);
    return element instanceof ctor ? element : null;
  },

  getElementByClass<T extends Element>(
    selector: string,
    ctor: { new (): T },
  ): T | null {
    const element = document.querySelector(selector);
    return element instanceof ctor ? element : null;
  },

  toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  },

  getName(error: unknown): string {
    return error instanceof Error ? error.name : "";
  },
};

window.commonUtils = commonUtils;