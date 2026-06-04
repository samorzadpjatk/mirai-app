import { fireEvent } from "@testing-library/react-native";
import { NotificationFilters } from "../../admin/notifications/NotificationFilters";
import { renderWithProviders } from "../helpers/renderWithProviders";

describe("NotificationFilters", () => {
  const mockOnSearchChange = jest.fn();
  const mockOnStatusChange = jest.fn();
  const mockOnGroupChange = jest.fn();

  const groups = [
    { id: "group-1", name: "Group A" },
    { id: "group-2", name: "Group B" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search and filter chips", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <NotificationFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        status="all"
        onStatusChange={mockOnStatusChange}
        groups={groups}
        selectedGroupId="all"
        onGroupChange={mockOnGroupChange}
      />,
    );

    expect(getByPlaceholderText("Search notifications...")).toBeTruthy();
    expect(getByText("All")).toBeTruthy();
    expect(getByText("Pending")).toBeTruthy();
    expect(getByText("Sent")).toBeTruthy();
    expect(getByText("Failed")).toBeTruthy();
    expect(getByText("All groups")).toBeTruthy();
    expect(getByText("Group A")).toBeTruthy();
    expect(getByText("Group B")).toBeTruthy();
  });

  it("updates the search term", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <NotificationFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        status="all"
        onStatusChange={mockOnStatusChange}
        groups={groups}
        selectedGroupId="all"
        onGroupChange={mockOnGroupChange}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Search notifications..."), "alert");
    expect(mockOnSearchChange).toHaveBeenCalledWith("alert");
  });

  it("updates status and group selections", () => {
    const { getByText } = renderWithProviders(
      <NotificationFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        status="all"
        onStatusChange={mockOnStatusChange}
        groups={groups}
        selectedGroupId="all"
        onGroupChange={mockOnGroupChange}
      />,
    );

    fireEvent.press(getByText("Sent"));
    expect(mockOnStatusChange).toHaveBeenCalledWith("sent");

    fireEvent.press(getByText("Group A"));
    expect(mockOnGroupChange).toHaveBeenCalledWith("group-1");
  });
});
