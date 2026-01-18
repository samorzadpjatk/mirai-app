import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Logo from "./Logo";

interface AppNavbarProps {
  userEmail?: string;
  onAvatarPress?: () => void;
}

export default function AppNavbar({ userEmail, onAvatarPress }: AppNavbarProps) {
  const avatarLetter = userEmail?.charAt(0).toUpperCase() || 'U';

  return (
    <View style={styles.navbar}>
      <View style={styles.navLeft}>
        <View style={styles.logoContainer}>
          <Logo size={40} />
        </View>
        <View>
          <Text style={styles.appName}>PJapp</Text>

        </View>
      </View>
      <TouchableOpacity style={styles.avatarButton} onPress={onAvatarPress}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(23, 24, 28, 0.8)",
    backdropFilter: "blur(12px)",
  },
  navLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  appSubtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#00ced1",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(0, 206, 209, 0.2)",
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1b2828",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#00ced1",
    fontSize: 16,
    fontWeight: "bold",
  },
});
