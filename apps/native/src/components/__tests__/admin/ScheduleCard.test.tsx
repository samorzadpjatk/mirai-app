import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ScheduleCard } from "../../admin/schedules/ScheduleCard";
import type { NotificationSchedule } from "../../../hooks/admin/useAdminSchedules";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const baseSchedule: NotificationSchedule = {
  id: "schedule-1",
  name: "Morning Update",
  message: "Send a morning update",
  triggerTime: "08:00",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  executionCount: 0,
  isRecurring: true,
  hour: 8,
  minute: 0,
  notificationType: "morning_update",
};

describe("ScheduleCard", () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onToggle = jest.fn();
  const onTrigger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders schedule details", () => {
    renderWithProviders(
      <ScheduleCard
        schedule={baseSchedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />,
    );

    expect(screen.getByText("Morning Update")).toBeOnTheScreen();
    expect(screen.getByText(/08:00/)).toBeOnTheScreen();
    expect(screen.getByText("Send a morning update")).toBeOnTheScreen();
    expect(screen.getByText("Active")).toBeOnTheScreen();
  });

  it("calls the action handlers", () => {
    renderWithProviders(
      <ScheduleCard
        schedule={baseSchedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />,
    );

    fireEvent.press(screen.getByText("Edit"));
    fireEvent.press(screen.getByText("Trigger"));
    fireEvent.press(screen.getByText("Pause"));
    fireEvent.press(screen.getByText("Delete"));

    expect(onEdit).toHaveBeenCalledWith(baseSchedule);
    expect(onTrigger).toHaveBeenCalledWith(baseSchedule);
    expect(onToggle).toHaveBeenCalledWith(baseSchedule);
    expect(onDelete).toHaveBeenCalledWith(baseSchedule);
  });

  it("shows start and inactive when schedule is disabled", () => {
    const inactiveSchedule: NotificationSchedule = { ...baseSchedule, isActive: false };
    renderWithProviders(
      <ScheduleCard
        schedule={inactiveSchedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />,
    );

    expect(screen.getByText("Inactive")).toBeOnTheScreen();
    expect(screen.getByText("Start")).toBeOnTheScreen();
  });
});
