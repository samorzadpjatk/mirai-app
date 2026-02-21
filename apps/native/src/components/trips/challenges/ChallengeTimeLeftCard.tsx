import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ChallengeTimeLeftCardProps {
  phaseLabel: "Submission" | "Voting";
  isRecurring?: boolean;
  status?: string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
}

const toDate = (value?: Date | string | null) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseClockToMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

const getNextRecurringDeadline = (
  dailyEndTime?: string | null,
  nowDate?: Date,
) => {
  if (!dailyEndTime) return null;
  const [hoursRaw, minutesRaw] = dailyEndTime.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const now = nowDate ?? new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
};

const formatCountdown = (ms: number) => {
  if (ms <= 0) return "Ended";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatDeadlineDate = (date: Date) => {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export function ChallengeTimeLeftCard({
  phaseLabel,
  isRecurring = false,
  status,
  startTime,
  endTime,
  dailyStartTime,
  dailyEndTime,
}: ChallengeTimeLeftCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const start = toDate(startTime);
  const end = toDate(endTime);
  const recurringDeadline = getNextRecurringDeadline(
    dailyEndTime,
    new Date(now),
  );
  const deadline = isRecurring ? recurringDeadline : end;
  const showScheduleOnly =
    (phaseLabel === "Submission" && status === "VISIBLE") ||
    (start ? now < start.getTime() : false);
  const activeDeadline = showScheduleOnly ? null : deadline;

  if (!activeDeadline && !showScheduleOnly) {
    return null;
  }

  const countdownText = showScheduleOnly
    ? ""
    : formatCountdown((activeDeadline as Date).getTime() - now);
  const countdownSubtext = showScheduleOnly
    ? ""
    : isRecurring
      ? `Daily reset at ${dailyEndTime ?? "--:--"}`
      : `Ends ${formatDeadlineDate(activeDeadline as Date)}`;

  const scheduleRows = [
    isRecurring
      ? {
          icon: "repeat-outline" as const,
          label: "Daily window",
          value: `${dailyStartTime ?? "--:--"} - ${dailyEndTime ?? "--:--"}`,
        }
      : null,
    start
      ? {
          icon: "play-circle-outline" as const,
          label: "Starts",
          value: formatDeadlineDate(start),
        }
      : null,
    end
      ? {
          icon: "flag-outline" as const,
          label: "Ends",
          value: formatDeadlineDate(end),
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }>;

  const statusTitle = showScheduleOnly ? "Schedule" : "Time left";

  const progressRatio = (() => {
    if (showScheduleOnly) {
      return 0;
    }
    if (isRecurring) {
      const startMinutes = parseClockToMinutes(dailyStartTime);
      const endMinutes = parseClockToMinutes(dailyEndTime);
      let cycleMs = 24 * 60 * 60 * 1000;

      if (startMinutes != null && endMinutes != null) {
        const dailyMinutes =
          endMinutes > startMinutes
            ? endMinutes - startMinutes
            : 24 * 60 - startMinutes + endMinutes;
        cycleMs = Math.max(dailyMinutes * 60 * 1000, 60 * 1000);
      }

      return clamp(((activeDeadline as Date).getTime() - now) / cycleMs, 0, 1);
    }

    if (!start || !end) return 0;
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return 0;
    return clamp(((activeDeadline as Date).getTime() - now) / totalMs, 0, 1);
  })();

  const progressColor =
    progressRatio > 0.66
      ? "#22c55e"
      : progressRatio > 0.33
        ? "#f59e0b"
        : "#ef4444";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{statusTitle}</Text>
        <Text style={styles.phase}>{phaseLabel}</Text>
      </View>

      {showScheduleOnly ? (
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleBadge}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.scheduleBadgeText}>Not active yet</Text>
          </View>
          {scheduleRows.map((row) => (
            <View key={row.label} style={styles.scheduleRow}>
              <View style={styles.scheduleRowLeft}>
                <Ionicons name={row.icon} size={14} color={colors.textMuted} />
                <Text style={styles.scheduleLabel}>{row.label}</Text>
              </View>
              <Text style={styles.scheduleValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.countdownCard}>
            <View style={styles.countdownIconWrap}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.countdownTextWrap}>
              <Text style={styles.countdownValue}>{countdownText}</Text>
              <Text style={styles.countdownSubtext}>{countdownSubtext}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${clamp(progressRatio * 100, 0, 100)}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  header: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  phase: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  countdownCard: {
    backgroundColor: colors.primaryOpacity10,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  countdownIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundDarkOpacity50,
  },
  countdownTextWrap: {
    flex: 1,
    gap: 2,
  },
  countdownValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  countdownSubtext: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "transparent",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  scheduleCard: {
    backgroundColor: colors.primaryOpacity10,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  scheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    backgroundColor: colors.backgroundDarkOpacity50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  scheduleBadgeText: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  scheduleRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scheduleLabel: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scheduleValue: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
});
