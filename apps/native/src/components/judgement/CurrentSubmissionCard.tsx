import { View, Text, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '~/styles';
import { type Submission } from '~/contexts/judgement';
import { formatDate, getInitials } from '~/utils/judgement';
import { viewStyles, textStyles } from '~/styles/judgement';
import { SubmissionAssetPreview } from '~/components/judgement/SubmissionAssetPreview';

const CurrentSubmissionCard = ({
  submission,
  maxCardHeight,
  cardStyle,
  approveStampStyle,
  rejectStampStyle,
}: {
  submission: Submission;
  maxCardHeight: number;
  cardStyle: AnimatedStyle<ViewStyle>;
  approveStampStyle: AnimatedStyle<ViewStyle>;
  rejectStampStyle: AnimatedStyle<ViewStyle>;
}) => {
  return (
    <Animated.View style={[viewStyles.card, { maxHeight: maxCardHeight }, cardStyle]}>
      <Animated.View style={[viewStyles.stamp, viewStyles.stampApprove, approveStampStyle]}>
        <Ionicons name="checkmark" size={18} color={colors.primary} />
        <Text style={textStyles.stampTextApprove}>APPROVE</Text>
      </Animated.View>
      <Animated.View style={[viewStyles.stamp, viewStyles.stampReject, rejectStampStyle]}>
        <Ionicons name="close" size={18} color={colors.red400} />
        <Text style={textStyles.stampTextReject}>REJECT</Text>
      </Animated.View>

      <View style={viewStyles.cardHeader}>
        <View style={viewStyles.groupAvatar}>
          {submission.group.image ? (
            <Image source={{ uri: submission.group.image }} style={viewStyles.groupAvatarImage} contentFit="cover" />
          ) : (
            <Text style={textStyles.groupAvatarText}>{getInitials(submission.group.name)}</Text>
          )}
        </View>
        <View style={viewStyles.groupMeta}>
          <Text style={textStyles.groupName}>{submission.group.name}</Text>
          <Text style={textStyles.groupHint}>Submitted {formatDate(submission.createdAt)}</Text>
        </View>
      </View>

      <SubmissionAssetPreview submission={submission} />

      {submission.textContent && submission.textContent.trim().length > 0 && (
        <View style={viewStyles.textBlock}>
          <Text style={textStyles.textContent} numberOfLines={6}>
            {submission.textContent}
          </Text>
        </View>
      )}

      {(submission.latitude !== null || submission.longitude !== null) && (
        <View style={viewStyles.locationBlock}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={textStyles.locationText}>
            {submission.latitude?.toFixed(5) ?? '—'}, {submission.longitude?.toFixed(5) ?? '—'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export { CurrentSubmissionCard };
