import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { styled, Text, YStack, XStack, Card } from "@mirai-app/ui";

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

const Container = styled(Card, {
  name: "TimeLeftContainer",
  backgroundColor: "$cardDark",
  borderRadius: "$xl",
  padding: "$xl",
  marginBottom: "$xl",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.05)",
});

const Header = styled(XStack, {
  name: "TimeLeftHeader",
  marginBottom: "$md",
  alignItems: "center",
  justifyContent: "space-between",
});

const Title = styled(Text, {
  name: "TimeLeftTitle",
  fontSize: "$xs",
  fontWeight: "$bold",
  color: "$textMuted",
  textTransform: "uppercase",
  letterSpacing: 2,
});

const Phase = styled(Text, {
  name: "TimeLeftPhase",
  color: "$primary",
  fontSize: "$xs",
  fontWeight: "$bold",
  textTransform: "uppercase",
  letterSpacing: 1.2,
});

const CountdownCard = styled(XStack, {
  name: "CountdownCard",
  backgroundColor: "$primaryOpacity10",
  borderWidth: 1,
  borderColor: "$primaryOpacity30",
  borderRadius: "$lg",
  padding: "$md",
  flexDirection: "row",
  gap: "$sm",
  marginBottom: "$md",
});

const CountdownIconWrap = styled(YStack, {
  name: "CountdownIconWrap",
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(10,11,13,0.5)",
});

const CountdownTextWrap = styled(YStack, {
  name: "CountdownTextWrap",
  flex: 1,
  gap: 2,
});

const CountdownValue = styled(Text, {
  name: "CountdownValue",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$white",
});

const CountdownSubtext = styled(Text, {
  name: "CountdownSubtext",
  fontSize: "$xs",
  color: "$textSecondary",
});

const ProgressTrack = styled(YStack, {
  name: "ProgressTrack",
  height: 10,
  borderRadius: 999,
  backgroundColor: "transparent",
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "$borderWhite5",
  position: "relative",
});

const ProgressFill = styled(YStack, {
  name: "ProgressFill",
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  borderRadius: 999,
});

const ScheduleCard = styled(YStack, {
  name: "ScheduleCard",
  backgroundColor: "$primaryOpacity10",
  borderWidth: 1,
  borderColor: "$primaryOpacity30",
  borderRadius: "$lg",
  padding: "$md",
  gap: "$sm",
});

const ScheduleBadge = styled(XStack, {
  name: "ScheduleBadge",
  flexDirection: "row",
  alignItems: "center",
  gap: "$xs",
  alignSelf: "flex-start",
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "$primaryOpacity30",
  backgroundColor: "rgba(10,11,13,0.5)",
  paddingHorizontal: "$sm",
  paddingVertical: 4,
});

const ScheduleBadgeText = styled(Text, {
  name: "ScheduleBadgeText",
  color: "$primary",
  fontSize: "$xs",
  fontWeight: "$bold",
  textTransform: "uppercase",
  letterSpacing: 0.8,
});

const ScheduleRow = styled(XStack, {
  name: "ScheduleRow",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$sm",
});

const ScheduleRowLeft = styled(XStack, {
  name: "ScheduleRowLeft",
  flexDirection: "row",
  alignItems: "center",
  gap: "$xs",
});

const ScheduleLabel = styled(Text, {
  name: "ScheduleLabel",
  color: "$textSecondary",
  fontSize: "$xs",
  textTransform: "uppercase",
  letterSpacing: 0.8,
});

const ScheduleValue = styled(Text, {
  name: "ScheduleValue",
  color: "$white",
  fontSize: "$sm",
  fontWeight: "$bold",
});

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
    : formatCountdown(activeDeadline!.getTime() - now);
  const countdownSubtext = showScheduleOnly
    ? ""
    : isRecurring
      ? `Daily reset at ${dailyEndTime ?? "--:--"}`
      : phaseLabel === "Voting"
        ? `Duration-based voting • ends ${formatDeadlineDate(activeDeadline!)} • started after moderation`
        : `Ends ${formatDeadlineDate(activeDeadline!)}`;

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
  ].filter(Boolean) as {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }[];

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

      return clamp((activeDeadline!.getTime() - now) / cycleMs, 0, 1);
    }

    if (!start || !end) return 0;
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return 0;
    return clamp((activeDeadline!.getTime() - now) / totalMs, 0, 1);
  })();

  const progressColor =
    progressRatio > 0.66
      ? "#22c55e"
      : progressRatio > 0.33
        ? "#f59e0b"
        : "#ef4444";

  return (
    <Container>
      <Header>
        <Title>{statusTitle}</Title>
        <Phase>{phaseLabel}</Phase>
      </Header>

      {showScheduleOnly ? (
        <ScheduleCard>
          <ScheduleBadge>
            <Ionicons name="calendar-outline" size={14} color="#00CED1" />
            <ScheduleBadgeText>Not active yet</ScheduleBadgeText>
          </ScheduleBadge>
          {scheduleRows.map((row) => (
            <ScheduleRow key={row.label}>
              <ScheduleRowLeft>
                <Ionicons
                  name={row.icon}
                  size={14}
                  color="rgba(255,255,255,0.4)"
                />
                <ScheduleLabel>{row.label}</ScheduleLabel>
              </ScheduleRowLeft>
              <ScheduleValue>{row.value}</ScheduleValue>
            </ScheduleRow>
          ))}
        </ScheduleCard>
      ) : (
        <>
          <CountdownCard>
            <CountdownIconWrap>
              <Ionicons name="time-outline" size={20} color="#00CED1" />
            </CountdownIconWrap>
            <CountdownTextWrap>
              <CountdownValue>{countdownText}</CountdownValue>
              <CountdownSubtext>{countdownSubtext}</CountdownSubtext>
            </CountdownTextWrap>
          </CountdownCard>

          <ProgressTrack>
            <ProgressFill
              width={`${clamp(progressRatio * 100, 0, 100)}%`}
              backgroundColor={progressColor}
            />
          </ProgressTrack>
        </>
      )}
    </Container>
  );
}
