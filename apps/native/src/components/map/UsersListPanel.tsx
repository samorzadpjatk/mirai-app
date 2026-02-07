import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { UserAvatar } from "~/components/map/UserAvatar";
import { formatRelativeTime } from "~/utils/format";
import type { UserLocation } from "~/components/map/UserMap";

interface UsersListPanelProps {
  users: UserLocation[];
  currentUserId?: string;
  usersListStyle: StyleProp<ViewStyle>;
  onToggleExpand: () => void;
  onAddPress: () => void;
  onManagePress: () => void;
  onSelectUser: (user: UserLocation) => void;
}

export function UsersListPanel({
  users,
  currentUserId,
  usersListStyle,
  onToggleExpand,
  onAddPress,
  onManagePress,
  onSelectUser,
}: UsersListPanelProps) {
  return (
    <>
      <View style={styles.handleBar} />
      <Pressable style={styles.listHeader} onPress={onToggleExpand}>
        <Text style={styles.listTitle}>People</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={styles.manageButton}
            onPress={(event) => {
              event.stopPropagation();
              onManagePress();
            }}
          >
            <Text style={styles.manageButtonText}>⚙</Text>
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={(event) => {
              event.stopPropagation();
              onAddPress();
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
      </Pressable>
      <Animated.View style={[styles.usersList, usersListStyle]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {users.map((user) => {
            const isMe = user.id === currentUserId;
            return (
              <Pressable
                key={user.id}
                style={styles.userListItem}
                onPress={() => {
                  if (isMe) return;
                  onSelectUser(user);
                }}
              >
                <View
                  style={[
                    styles.avatarWrapperSmall,
                    isMe && styles.avatarWrapperMe,
                  ]}
                >
                  <UserAvatar
                    imageUrl={user.avatarUrl}
                    name={user.name}
                    size={48}
                  />
                </View>
                <View style={styles.userListDetails}>
                  <View style={styles.userListRow}>
                    <Text style={styles.userListName}>
                      {isMe ? "Me" : user.name}
                    </Text>
                    <Text style={styles.userListTime}>
                      {isMe
                        ? "My Location"
                        : formatRelativeTime(new Date(user.lastActiveAt))}
                    </Text>
                  </View>
                  <Text style={styles.userListAddress}>
                    {user.address ?? "-"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(0, 206, 209, 0.4)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  manageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  manageButtonText: {
    color: "#00ced1",
    fontSize: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#00ced1",
    fontSize: 18,
    fontWeight: "700",
  },
  usersList: {
    overflow: "hidden",
  },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  avatarWrapperSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(0, 206, 209, 0.4)",
    overflow: "hidden",
    backgroundColor: "rgba(23, 24, 28, 0.8)",
    padding: 2,
  },
  avatarWrapperMe: {
    borderWidth: 0,
  },
  userListDetails: {
    flex: 1,
  },
  userListRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userListName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  userListTime: {
    fontSize: 11,
    color: "rgba(226,232,240,0.5)",
  },
  userListAddress: {
    fontSize: 13,
    color: "rgba(226,232,240,0.7)",
    marginTop: 2,
  },
});
