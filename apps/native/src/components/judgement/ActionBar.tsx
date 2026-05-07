import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/styles';
import { viewStyles, textStyles } from '~/styles/judgement';

const ActionBar = ({
  disabled,
  onReject,
  onApprove,
}: {
  disabled: boolean;
  onReject: () => void;
  onApprove: () => void;
}) => {
  return (
    <View style={viewStyles.actions}>
      <TouchableOpacity
        testID="reject-button"
        style={[viewStyles.actionButton, viewStyles.rejectButton]}
        disabled={disabled}
        onPress={onReject}
      >
        <Ionicons name="close" size={28} color={colors.white} />
      </TouchableOpacity>

      <View style={viewStyles.actionHint}>
        <Ionicons name="swap-horizontal" size={16} color={colors.textSecondary} />
        <Text style={textStyles.actionHintText}>Swipe to decide</Text>
      </View>

      <TouchableOpacity
        testID="approve-button"
        style={[viewStyles.actionButton, viewStyles.approveButton]}
        disabled={disabled}
        onPress={onApprove}
      >
        <Ionicons name="checkmark" size={28} color={colors.backgroundDark} />
      </TouchableOpacity>
    </View>
  );
};

export { ActionBar };
