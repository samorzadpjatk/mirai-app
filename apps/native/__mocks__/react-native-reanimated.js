export default {
  __esModule: true,
  View: "ReanimatedView",
  Text: "ReanimatedText",
  Image: "ReanimatedImage",
  ScrollView: "ReanimatedScrollView",
  FlatList: "ReanimatedFlatList",
};

export const useSharedValue = (initial) => ({
  value: initial,
});

export const useAnimatedStyle = (fn) => fn();
export const useAnimatedProps = (fn) => fn();
export const useDerivedValue = (fn) => ({ value: fn() });
export const useAnimatedRef = () => ({ current: null });

export const withTiming = (value) => value;
export const withSpring = (value) => value;
export const withDecay = (value) => value;
export const withDelay = (_, value) => value;
export const withSequence = (...args) => args[args.length - 1];
export const withRepeat = (value) => value;

export const interpolate = (value, _input, output) => {
  return Array.isArray(output) ? output[0] : output;
};

export const Extrapolation = {
  CLAMP: "clamp",
  EXTEND: "extend",
  IDENTITY: "identity",
};

const createLayoutAnimation = () => ({
  duration: () => ({
    springify: () => ({
      delay: () => ({}),
      withInitialValues: () => ({}),
    }),
  }),
});

export const ZoomIn = createLayoutAnimation();
export const ZoomOut = createLayoutAnimation();
export const FadeIn = createLayoutAnimation();
export const FadeOut = createLayoutAnimation();
export const SlideInRight = createLayoutAnimation();
export const SlideOutRight = createLayoutAnimation();
export const Layout = createLayoutAnimation();
