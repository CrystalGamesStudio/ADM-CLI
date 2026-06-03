function createAnimation(renderFn, options = {}) {
  const interval = options.interval || 5000;
  let timer = null;

  return {
    start() {
      if (timer) return this;
      timer = setInterval(renderFn, interval);
      return this;
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return this;
    },
    isRunning() {
      return timer !== null;
    },
  };
}

module.exports = { createAnimation };
