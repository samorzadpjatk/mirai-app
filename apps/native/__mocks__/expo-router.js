export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  reload: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  canGoBack: () => true,
  canDismiss: () => true,
});

export const useLocalSearchParams = () => ({});
export const useGlobalSearchParams = () => ({});
export const useSegments = () => [];
export const usePathname = () => "/";
export const useNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
  removeListener: jest.fn(),
});

export const Link = "ExpoRouterLink";
export const Stack = {
  Screen: () => null,
};
export const Tabs = {
  Screen: () => null,
};
export const Redirect = () => null;
export const Slot = ({ children }) => children;

export default {
  __esModule: true,
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
  useSegments,
  usePathname,
  useNavigation,
  Link,
  Stack,
  Tabs,
  Redirect,
  Slot,
};
