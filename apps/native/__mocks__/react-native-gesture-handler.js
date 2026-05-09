const View = "GestureHandlerView";

export default {
  __esModule: true,
  PanGestureHandler: View,
  TapGestureHandler: View,
  LongPressGestureHandler: View,
  RotationGestureHandler: View,
  PinchGestureHandler: View,
  FlingGestureHandler: View,
  ForceTouchGestureHandler: View,
  NativeViewGestureHandler: View,
  RawButton: View,
  BaseButton: View,
  RectButton: View,
  BorderlessButton: View,
  TouchableHighlight: View,
  TouchableOpacity: View,
  TouchableWithoutFeedback: View,
  TouchableNativeFeedback: View,
  Pressable: View,
  State: {
    BEGAN: 1,
    FAILED: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
    UNDETERMINED: 0,
  },
  Directions: {
    RIGHT: 1,
    LEFT: 2,
    UP: 4,
    DOWN: 8,
  },
  GestureHandlerRootView: View,
  Gesture: {
    Pan: () => ({
      enabled: () => ({
        minDistance: () => ({
          onUpdate: () => ({
            onEnd: () => ({}),
          }),
        }),
      }),
    }),
    Tap: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    LongPress: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    Fling: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    Pinch: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    Rotation: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    Race: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    Simultaneous: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
    Exclusive: () => ({
      onBegin: () => ({}),
      onEnd: () => ({}),
    }),
  },
  GestureDetector: ({ children }) => children,
  enableExperimentalWebImplementation: () => {},
  enableLegacyWebImplementation: () => {},
};

export const PanGestureHandler = View;
export const TapGestureHandler = View;
export const LongPressGestureHandler = View;
export const RotationGestureHandler = View;
export const PinchGestureHandler = View;
export const FlingGestureHandler = View;
export const ForceTouchGestureHandler = View;
export const NativeViewGestureHandler = View;
export const RawButton = View;
export const BaseButton = View;
export const RectButton = View;
export const BorderlessButton = View;
export const TouchableHighlight = View;
export const TouchableOpacity = View;
export const TouchableWithoutFeedback = View;
export const TouchableNativeFeedback = View;
export const Pressable = View;
export const GestureHandlerRootView = View;
export const Gesture = {
  Pan: () => ({
    enabled: () => ({
      minDistance: () => ({
        onUpdate: () => ({
          onEnd: () => ({}),
        }),
      }),
    }),
  }),
  Tap: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  LongPress: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  Fling: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  Pinch: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  Rotation: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  Race: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  Simultaneous: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
  Exclusive: () => ({
    onBegin: () => ({}),
    onEnd: () => ({}),
  }),
};
export const State = {
  BEGAN: 1,
  FAILED: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
  UNDETERMINED: 0,
};
export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};
