const NOOP = () => {};
const NOOP_FACTORY = () => NOOP;
const ID = (value) => value;
const IMMEDIATE_CALLBACK_INVOCATION = (callback) => callback();

globalThis._WORKLET = false;
globalThis._log = console.log;
globalThis._getAnimationTimestamp = () => performance.now();

const WorkletAPI = {
  isShareableRef: () => true,
  makeShareable: ID,
  makeShareableCloneOnUIRecursive: ID,
  makeShareableCloneRecursive: ID,
  shareableMappingCache: new Map(),
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: NOOP,
  isSynchronizable: () => false,
  getRuntimeKind: () => "ReactNative",
  createWorkletRuntime: NOOP_FACTORY,
  runOnRuntime: ID,
  scheduleOnRuntime: IMMEDIATE_CALLBACK_INVOCATION,
  createSerializable: ID,
  isSerializableRef: ID,
  serializableMappingCache: new Map(),
  createSynchronizable: ID,
  callMicrotasks: NOOP,
  executeOnUIRuntimeSync: ID,
  runOnJS: (fun) =>
    (...args) =>
      queueMicrotask(args.length ? () => fun(...args) : fun),
  runOnUI: (worklet) =>
    (...args) => {
      worklet(...args);
    },
  runOnUIAsync: (worklet) =>
    (...args) => {
      return new Promise((resolve) => {
        const result = worklet(...args);
        resolve(result);
      });
    },
  runOnUISync: IMMEDIATE_CALLBACK_INVOCATION,
  scheduleOnRN: (fun, ...args) => {
    queueMicrotask(() => fun(...args));
  },
  scheduleOnUI: (worklet, ...args) => {
    worklet(...args);
  },
  unstable_eventLoopTask: NOOP_FACTORY,
  isWorkletFunction: () => false,
  WorkletsModule: {},
};

export default {
  __esModule: true,
  ...WorkletAPI,
  scheduleOnRN: WorkletAPI.scheduleOnRN,
  runOnUI: WorkletAPI.runOnUI,
  runOnJS: WorkletAPI.runOnJS,
};

export const scheduleOnRN = WorkletAPI.scheduleOnRN;
export const runOnUI = WorkletAPI.runOnUI;
export const runOnJS = WorkletAPI.runOnJS;
