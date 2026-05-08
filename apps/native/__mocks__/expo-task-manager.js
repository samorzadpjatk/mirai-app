export const defineTask = jest.fn();
export const isTaskDefined = jest.fn(() => true);
export const isTaskRegisteredAsync = jest.fn(() => Promise.resolve(false));
export const unregisterTaskAsync = jest.fn(() => Promise.resolve(undefined));
