import EventEmitter from 'events';

const createReduxActionInterceptor = () => {
  const emitter = new EventEmitter();

  const middleware = () => next => (action) => {
    emitter.emit(action.type, action);
    return next(action);
  };

  const waitForAction = (type, timeout) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(reject, timeout || 10);
      emitter.once(type, (action) => {
        clearTimeout(timer);
        resolve(action);
      });
    });

  return { middleware, waitForAction };
};

export default createReduxActionInterceptor;
