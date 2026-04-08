// Mock for expo-location module
export const requestForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted", granted: true }),
);

export const requestBackgroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted", granted: true }),
);

export const getForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted", granted: true }),
);

export const getBackgroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted", granted: true }),
);

export const getCurrentPositionAsync = jest.fn(() =>
  Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 10,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  }),
);

export const watchPositionAsync = jest.fn((options, callback) => {
  // Return a mock subscription that can be removed
  return Promise.resolve({
    remove: jest.fn(),
  });
});

export const LocationAccuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const LocationActivityType = {
  Other: 1,
  AutomotiveNavigation: 2,
  Fitness: 3,
  OtherNavigation: 4,
  Airborne: 5,
};

export const PermissionStatus = {
  GRANTED: "granted",
  DENIED: "denied",
  UNDETERMINED: "undetermined",
};

export default {
  requestForegroundPermissionsAsync,
  requestBackgroundPermissionsAsync,
  getForegroundPermissionsAsync,
  getBackgroundPermissionsAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
  LocationAccuracy,
  LocationActivityType,
  PermissionStatus,
};
