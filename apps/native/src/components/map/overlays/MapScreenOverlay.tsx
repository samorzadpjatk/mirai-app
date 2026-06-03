import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { MapActionButtons } from "~/components/map/MapActionButtons";
import { ManageSharingModal } from "~/components/map/modals/ManageSharingModal";
import { ShareLocationModal } from "~/components/map/modals/ShareLocationModal";
import { UsersListPanel } from "~/components/map/panels/UsersListPanel";
import { SelectedUserCard } from "~/components/map/ui/SelectedUserCard";
import { useLocationContext } from "~/stores/location";
import { useMapOverlayStore } from "~/stores/map";

export function MapScreenOverlay() {
  const { selectedUser, showUsersList, panelStyle, panGesture } = useMapOverlayStore();
  const { canViewOthersLocations } = useLocationContext();

  return (
    <>
      {canViewOthersLocations && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            pointerEvents={selectedUser || showUsersList ? "auto" : "none"}
            style={[styles.detailCard, panelStyle]}
          >
            {selectedUser ? <SelectedUserCard /> : showUsersList ? <UsersListPanel /> : null}
          </Animated.View>
        </GestureDetector>
      )}
      <MapActionButtons />
      <ShareLocationModal />
      <ManageSharingModal />
    </>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "rgba(23, 24, 28, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.25)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
});
