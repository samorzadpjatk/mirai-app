import { jest } from "@jest/globals";

const getBackgroundLocationPreference: jest.Mock<() => Promise<boolean>> = jest.fn();
const setBackgroundLocationPreference: jest.Mock<() => Promise<void>> = jest.fn();
const hasBackgroundLocationTaskStarted: jest.Mock<() => Promise<boolean>> = jest.fn();
const startBackgroundLocationTask: jest.Mock<() => Promise<void>> = jest.fn();
const stopBackgroundLocationTask: jest.Mock<() => Promise<void>> = jest.fn();

getBackgroundLocationPreference.mockResolvedValue(false);
setBackgroundLocationPreference.mockResolvedValue(undefined);
hasBackgroundLocationTaskStarted.mockResolvedValue(false);
startBackgroundLocationTask.mockResolvedValue(undefined);
stopBackgroundLocationTask.mockResolvedValue(undefined);

export {
  getBackgroundLocationPreference,
  setBackgroundLocationPreference,
  hasBackgroundLocationTaskStarted,
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
};
