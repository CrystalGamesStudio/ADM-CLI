/**
 * Assumptions:
 * - createAnimation(renderFn, options?) returns { start(), stop(), isRunning() }
 * - renderFn is called on each tick
 * - options: { interval: ms }
 * - start() begins the animation loop, returns this
 * - stop() clears the interval, returns this
 * - isRunning() returns boolean
 */
const { createAnimation } = require('../../../src/ui/animations');

describe('Animation framework', () => {
  test('createAnimation returns start, stop, isRunning methods', () => {
    const anim = createAnimation(() => {});
    expect(typeof anim.start).toBe('function');
    expect(typeof anim.stop).toBe('function');
    expect(typeof anim.isRunning).toBe('function');
  });

  test('isRunning returns false before start', () => {
    const anim = createAnimation(() => {});
    expect(anim.isRunning()).toBe(false);
  });

  test('start and stop toggle isRunning', () => {
    jest.useFakeTimers();
    const anim = createAnimation(() => {}, { interval: 1000 });
    anim.start();
    expect(anim.isRunning()).toBe(true);
    anim.stop();
    expect(anim.isRunning()).toBe(false);
    jest.useRealTimers();
  });

  test('renderFn is called at each interval', () => {
    jest.useFakeTimers();
    const renderFn = jest.fn();
    const anim = createAnimation(renderFn, { interval: 500 });
    anim.start();
    jest.advanceTimersByTime(1500);
    expect(renderFn).toHaveBeenCalledTimes(3);
    anim.stop();
    jest.useRealTimers();
  });

  test('stop is safe to call when not running', () => {
    const anim = createAnimation(() => {}, { interval: 1000 });
    expect(() => anim.stop()).not.toThrow();
  });

  test('calling start twice does not create duplicate intervals', () => {
    jest.useFakeTimers();
    const renderFn = jest.fn();
    const anim = createAnimation(renderFn, { interval: 500 });
    anim.start();
    anim.start();
    jest.advanceTimersByTime(500);
    expect(renderFn).toHaveBeenCalledTimes(1);
    anim.stop();
    jest.useRealTimers();
  });

  test('default interval is 5000ms', () => {
    jest.useFakeTimers();
    const renderFn = jest.fn();
    const anim = createAnimation(renderFn);
    anim.start();
    jest.advanceTimersByTime(5000);
    expect(renderFn).toHaveBeenCalledTimes(1);
    anim.stop();
    jest.useRealTimers();
  });
});
