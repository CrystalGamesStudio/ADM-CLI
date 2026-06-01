function createAnimation(renderFn, options = {}) {
  const interval = options.interval || 5000;
  const enabled = options.enabled !== false;
  let timer = null;

  return {
    start() {
      if (!enabled) return this;
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
