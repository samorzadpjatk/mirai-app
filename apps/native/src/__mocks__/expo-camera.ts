// Mock for expo-camera module
export const CameraView = jest.fn(() => null);

export const useCameraPermissions = jest.fn(() => [
  { granted: true, status: "granted" },
  jest.fn(() => Promise.resolve({ granted: true, status: "granted" })),
  jest.fn(() => Promise.resolve({ granted: true, status: "granted" })),
]);

export const useMicrophonePermissions = jest.fn(() => [
  { granted: true, status: "granted" },
  jest.fn(() => Promise.resolve({ granted: true, status: "granted" })),
]);

export const CameraType = {
  back: "back",
  front: "front",
};

export const FlashMode = {
  auto: "auto",
  off: "off",
  on: "on",
};

export const PermissionStatus = {
  GRANTED: "granted",
  DENIED: "denied",
  UNDETERMINED: "undetermined",
};

export default {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  CameraType,
  FlashMode,
  PermissionStatus,
};
