import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";

export interface UseMapOverlayGesturesReturn {
  listDragStart: ReturnType<typeof useSharedValue<number>>;
  panGesture: ReturnType<typeof Gesture.Pan>;
  panelStyle: ReturnType<typeof useAnimatedStyle>;
  usersListStyle: ReturnType<typeof useAnimatedStyle>;
}

export function useMapOverlayGestures(
  expandValue: { value: number },
  panelAnimValue: { value: number },
  selectedUser: unknown,
  showUsersList: boolean,
  isListExpanded: boolean,
  toggleListExpansion: () => void,
  listMaxHeight = 300,
): UseMapOverlayGesturesReturn {
  const listDragStart = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      listDragStart.value = expandValue.value;
    })
    .onUpdate((event) => {
      if (selectedUser || !showUsersList) return;
      const dragProgress = listDragStart.value + -event.translationY / listMaxHeight;
      expandValue.value = Math.max(0, Math.min(1, dragProgress));
    })
    .onEnd((event) => {
      if (selectedUser || !showUsersList) return;
      const shouldExpand = expandValue.value > 0.5 || event.velocityY < -500;
      expandValue.value = withSpring(shouldExpand ? 1 : 0);
      if (shouldExpand !== isListExpanded) {
        runOnJS(toggleListExpansion)();
      }
    });

  const panelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(panelAnimValue.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(panelAnimValue.value, [0, 1], [220, 0]),
        },
      ],
    };
  });

  const usersListStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(expandValue.value, [0, 1], [0, listMaxHeight]);
    return { maxHeight };
  });

  return {
    listDragStart,
    panGesture,
    panelStyle,
    usersListStyle,
  };
}
