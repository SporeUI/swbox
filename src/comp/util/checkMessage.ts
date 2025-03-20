export default class message {
  messageReady = false;
  cache: Function[] = [];
  setState(state: string) {
    if (state === 'message') {
      this.messageReady = true;
    }
    this.checkReady();
  }
  checkReady() {
    if (this.messageReady) {
      while (this.cache.length > 0) {
        const fn = this.cache.shift();
        if (typeof fn === 'function') {
          fn();
        }
      }
    }
  }
  setReady(fn: Function) {
    this.cache.push(fn);
    this.checkReady();
  }
  ready() {
    return new Promise((resolve) => {
      this.setReady(resolve);
    });
  }
}
