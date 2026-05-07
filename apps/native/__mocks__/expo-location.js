const mockGetForegroundPermissionsAsync = jest.fn(() => Promise.resolve({ status: "undetermined" }));
const mockRequestForegroundPermissionsAsync = jest.fn(() => Promise.resolve({ status: "granted" }));
const mockGetBackgroundPermissionsAsync = jest.fn(() => Promise.resolve({ status: "undetermined" }));
const mockRequestBackgroundPermissionsAsync = jest.fn(() => Promise.resolve({ status: "granted" }));
const mockHasStartedLocationUpdatesAsync = jest.fn(() => Promise.resolve(false));
const mockStartLocationUpdatesAsync = jest.fn(() => Promise.resolve(undefined));
const mockStopLocationUpdatesAsync = jest.fn(() => Promise.resolve(undefined));

module.exports = {
  Accuracy: { Balanced: 2, High: 3, Low: 1, Lowest: 0, BestForNavigation: 4 },
  ActivityType: { Other: 0, Fitness: 1, AutomotiveNavigation: 2, OtherNavigation: 3, Airborne: 4 },
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  getForegroundPermissionsAsync: mockGetForegroundPermissionsAsync,
  requestForegroundPermissionsAsync: mockRequestForegroundPermissionsAsync,
  getBackgroundPermissionsAsync: mockGetBackgroundPermissionsAsync,
  requestBackgroundPermissionsAsync: mockRequestBackgroundPermissionsAsync,
  hasStartedLocationUpdatesAsync: mockHasStartedLocationUpdatesAsync,
  startLocationUpdatesAsync: mockStartLocationUpdatesAsync,
  stopLocationUpdatesAsync: mockStopLocationUpdatesAsync,
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 0, longitude: 0 } })),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
};
