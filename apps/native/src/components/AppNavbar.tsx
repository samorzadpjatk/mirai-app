import { View, Text, StyleSheet } from "react-native";
import Logo from "./Logo";

export default function AppNavbar() {
  return (
    <View style={styles.navLeft}>
      <View style={styles.logoContainer}>
        <Logo size={40} />
      </View>
      <View>
        <Text style={styles.appName}>PJapp</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(23, 24, 28, 0.8)",
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
});
