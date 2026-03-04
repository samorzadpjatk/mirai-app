import { StyleSheet } from "react-native";
import { PrimaryAddButton } from "~/components/common/buttons/PrimaryAddButton";

interface GroupsCreateButtonProps {
  onPress: () => void;
}

export function GroupsCreateButton({ onPress }: GroupsCreateButtonProps) {
  return <PrimaryAddButton onPress={onPress} style={styles.createButton} />;
}

const styles = StyleSheet.create({
  createButton: {
    marginBottom: 16,
  },
});
