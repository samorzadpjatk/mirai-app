export interface RankingTemplateValues {
  groupName: string;
  rankingPosition: string;
  activeChallengesCount: string;
  tripName: string;
  totalGroupsCount: string;
  groupMembersCount: string;
  currentDate: string;
  currentTime: string;
}

export interface ScheduledNotificationTemplate {
  key: "daily_morning" | "daily_evening";
  name: string;
  hour: number;
  minute: number;
  notificationType: "custom";
  notificationTitle: string;
  notificationBody: string;
  notificationUrl: string;
}

export const RANKING_TEMPLATE_PLACEHOLDERS = {
  groupName: "<nazwa-grupy>",
  rankingPosition: "<miejsce-w-rankingu>",
  activeChallengesCount: "<liczba-aktywnych-wyzwan>",
  tripName: "<nazwa-wycieczki>",
  totalGroupsCount: "<liczba-grup>",
  groupMembersCount: "<liczba-czlonkow-grupy>",
  currentDate: "<data-dzisiaj>",
  currentTime: "<godzina-teraz>",
} as const;

const PLACEHOLDER_ALIASES: Record<keyof RankingTemplateValues, string[]> = {
  groupName: [RANKING_TEMPLATE_PLACEHOLDERS.groupName, "<nazwa_grupy>"],
  rankingPosition: [RANKING_TEMPLATE_PLACEHOLDERS.rankingPosition, "<miejsce_w_rankingu>"],
  activeChallengesCount: [
    RANKING_TEMPLATE_PLACEHOLDERS.activeChallengesCount,
    "<liczba-aktywnych-wyzwań>",
    "<liczba_aktywnych_wyzwan>",
    "<liczba_aktywnych_wyzwań>",
  ],
  tripName: [RANKING_TEMPLATE_PLACEHOLDERS.tripName, "<nazwa_wycieczki>"],
  totalGroupsCount: [RANKING_TEMPLATE_PLACEHOLDERS.totalGroupsCount, "<liczba_grup>"],
  groupMembersCount: [
    RANKING_TEMPLATE_PLACEHOLDERS.groupMembersCount,
    "<liczba-członków-grupy>",
    "<liczba_czlonkow_grupy>",
    "<liczba_członków_grupy>",
  ],
  currentDate: [RANKING_TEMPLATE_PLACEHOLDERS.currentDate, "<data_dzisiaj>"],
  currentTime: [RANKING_TEMPLATE_PLACEHOLDERS.currentTime, "<godzina_teraz>"],
};

export const DAILY_RANKING_SCHEDULE_TEMPLATES: ScheduledNotificationTemplate[] = [
  {
    key: "daily_morning",
    name: "Daily ranking update (07:30)",
    hour: 7,
    minute: 30,
    notificationType: "custom",
    notificationTitle: "Dzieeeeń dobry! Pobudka",
    notificationBody: `twoja grupa ${RANKING_TEMPLATE_PLACEHOLDERS.groupName} jest ${RANKING_TEMPLATE_PLACEHOLDERS.rankingPosition} w rankingu. Czeka na Was ${RANKING_TEMPLATE_PLACEHOLDERS.activeChallengesCount} wyzwań do wykonania. Powodzenia!`,
    notificationUrl: "/ranking",
  },
  {
    key: "daily_evening",
    name: "Daily ranking update (18:00)",
    hour: 18,
    minute: 0,
    notificationType: "custom",
    notificationTitle: "Dobry wieczór!",
    notificationBody: `twoja grupa ${RANKING_TEMPLATE_PLACEHOLDERS.groupName} jest ${RANKING_TEMPLATE_PLACEHOLDERS.rankingPosition} w rankingu. Czeka na Was ${RANKING_TEMPLATE_PLACEHOLDERS.activeChallengesCount} wyzwań do wykonania. Powodzenia!`,
    notificationUrl: "/ranking",
  },
];

export function getDailyRankingScheduleTemplate(
  key: ScheduledNotificationTemplate["key"],
): ScheduledNotificationTemplate {
  const template = DAILY_RANKING_SCHEDULE_TEMPLATES.find((item) => item.key === key);

  if (!template) {
    throw new Error(`Unknown scheduled notification template: ${key}`);
  }

  return template;
}

function replaceAll(input: string, searchValue: string, replaceValue: string): string {
  return input.split(searchValue).join(replaceValue);
}

export function applyRankingTemplate(input: string, values: RankingTemplateValues): string {
  let output = input;

  (Object.keys(PLACEHOLDER_ALIASES) as (keyof RankingTemplateValues)[]).forEach((field) => {
    const value = values[field];
    PLACEHOLDER_ALIASES[field].forEach((placeholder) => {
      output = replaceAll(output, placeholder, value);
    });
  });

  return output;
}

export function containsRankingTemplate(input: string): boolean {
  return Object.values(PLACEHOLDER_ALIASES).some((aliases) =>
    aliases.some((placeholder) => input.includes(placeholder)),
  );
}
