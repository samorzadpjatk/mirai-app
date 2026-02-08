import { View, Text, TouchableOpacity, Image, type ViewStyle, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Challenge, ChallengeStatus } from '../../types/challenges';

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const isLocked = challenge.status === ChallengeStatus.LOCKED;
  const isActive = challenge.status === ChallengeStatus.SELECTED;
  
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: '#23262b',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: 'transparent',
    };

    if (isActive) {
      baseStyle.borderColor = '#00ced1';
      baseStyle.shadowColor = '#00ced1';
      baseStyle.shadowOffset = { width: 0, height: 0 };
      baseStyle.shadowOpacity = 0.2;
      baseStyle.shadowRadius = 15;
    } else if (isLocked) {
      baseStyle.opacity = 0.6;
    }

    if (challenge.size === 'tall') {
      baseStyle.minHeight = 280;
    }

    return baseStyle;
  };

  const getStatusText = () => {
    switch (challenge.status) {
      case ChallengeStatus.SELECTED:
        return "Selected";
      case ChallengeStatus.COMPLETED:
        return "Completed";
      case ChallengeStatus.LOCKED:
        return "Locked";
      case ChallengeStatus.INCOMPLETE:
      default:
        return "Incomplete";
    }
  };


  const getPointsBadgeStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    };

    if (isActive) {
      return {
        ...baseStyle,
        backgroundColor: '#00ced1',
        color: '#17191c',
      };
    } else if (isLocked) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        color: '#6b7280',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(0, 206, 209, 0.2)',
        color: '#00ced1',
        borderWidth: 1,
        borderColor: 'rgba(0, 206, 209, 0.3)',
      };
    }
  };

  return (
    <TouchableOpacity
      style={getCardStyle()}
      onPress={() => !isLocked && onPress?.(challenge)}
      disabled={isLocked}
    >
      {/* Layout for wide tiles */}
      {challenge.size === 'wide' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Icon */}
          <View 
            style={{
              width: 56, 
              height: 56, 
              borderRadius: 12, 
              backgroundColor: `${challenge.iconColor}1a`,
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <Ionicons name={challenge.icon} size={30} color={challenge.iconColor} />
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                {challenge.title}
              </Text>
              {isLocked ? (
                <Ionicons name="lock-closed" size={16} color="#6b7280" />
              ) : (
                <Text style={getPointsBadgeStyle()}>
                  +{challenge.points}
                </Text>
              )}
            </View>
            {challenge.description && (
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                {challenge.description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Layout for normal tiles */}
      {challenge.size === 'normal' && (
        <View style={{ flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View 
              style={{
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                backgroundColor: `${challenge.iconColor}1a`,
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <Ionicons name={challenge.icon} size={24} color={challenge.iconColor} />
            </View>
            {isLocked ? (
              <Ionicons name="lock-closed" size={16} color="#6b7280" />
            ) : (
              <Text style={getPointsBadgeStyle()}>
                +{challenge.points}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', lineHeight: 20 }}>
              {challenge.title}
            </Text>
            <Text style={{ 
              fontSize: 10, 
              textTransform: 'uppercase', 
              fontWeight: 'bold', 
              letterSpacing: 2, 
              marginTop: 4,
              color: isActive ? '#00ced1' : '#6b7280'
            }}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      )}

      {/* Layout for tall tiles */}
      {challenge.size === 'tall' && (
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View 
              style={{
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                backgroundColor: `${challenge.iconColor}1a`,
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <Ionicons name={challenge.icon} size={24} color={challenge.iconColor} />
            </View>
            {isLocked ? (
              <Ionicons name="lock-closed" size={16} color="#6b7280" />
            ) : (
              <Text style={getPointsBadgeStyle()}>
                +{challenge.points}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', lineHeight: 22, marginBottom: 8 }}>
              {challenge.title}
            </Text>
            {challenge.description && (
              <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                {challenge.description}
              </Text>
            )}
          </View>

          {/* Participants (if any) */}
          {challenge.participantAvatars && challenge.participantAvatars.length > 0 && (
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
              <View style={{ flexDirection: 'row', marginLeft: -4 }}>
                {challenge.participantAvatars.slice(0, 2).map((avatar, index) => (
                  <View
                    key={index}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#23262b',
                      backgroundColor: '#6b7280',
                      overflow: 'hidden',
                      marginLeft: -4
                    }}
                  >
                    <Image
                      source={{ uri: avatar }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
                {challenge.additionalParticipants && challenge.additionalParticipants > 0 && (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#23262b',
                    backgroundColor: '#00ced1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -4
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#17191c' }}>
                      +{challenge.additionalParticipants}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

        </View>
      )}
    </TouchableOpacity>
  );
}