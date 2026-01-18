import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LayoutGrid, Map, Bell } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";

export type MenuTab = 'home' | 'trips' | 'notifications';

interface BottomMenuProps {
  activeTab?: MenuTab;
  onTabPress?: (tab: MenuTab) => void;
}

export default function BottomMenu({ activeTab = 'home', onTabPress }: BottomMenuProps) {
  const router = useRouter();

  const handleTabPress = (tab: MenuTab) => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      // Default navigation behavior
      switch (tab) {
        case 'home':
          router.push('/');
          break;
        case 'trips':
          router.push('/trips');
          break;
        case 'notifications':
          router.push('/notifications');
          break;
      }
    }
  };

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={activeTab === 'home' ? styles.navItemActive : styles.navItem}
          onPress={() => handleTabPress('home')}
        >
          <LayoutGrid
            size={24}
            color={activeTab === 'home' ? "#00ced1" : "#64748b"}
            fill={activeTab === 'home' ? "#00ced1" : "transparent"}
          />
          <Text style={activeTab === 'home' ? styles.navLabelActive : styles.navLabel}>
            HOME
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeTab === 'trips' ? styles.navItemActive : styles.navItem}
          onPress={() => handleTabPress('trips')}
        >
          <Map
            size={24}
            color={activeTab === 'trips' ? "#00ced1" : "#64748b"}
          />
          <Text style={activeTab === 'trips' ? styles.navLabelActive : styles.navLabel}>
            TRIPS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeTab === 'notifications' ? styles.navItemActive : styles.navItem}
          onPress={() => handleTabPress('notifications')}
        >
          <Bell
            size={24}
            color={activeTab === 'notifications' ? "#00ced1" : "#64748b"}
          />
          <Text style={activeTab === 'notifications' ? styles.navLabelActive : styles.navLabel}>
            NOTIFICATIONS
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: "absolute",
    bottom: 24,
    left: "5%",
    right: "5%",
    zIndex: 100,
  },
  bottomNav: {
    backgroundColor: "rgba(27, 40, 40, 0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navItemActive: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#64748b",
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#00ced1",
  },
});
