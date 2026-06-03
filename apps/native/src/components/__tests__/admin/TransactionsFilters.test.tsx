import { fireEvent } from "@testing-library/react-native";
import { TransactionsFilters } from "../../admin/transactions/TransactionsFilters";
import { renderWithProviders } from "../helpers/renderWithProviders";

describe("TransactionsFilters", () => {
  const mockOnSearchChange = jest.fn();
  const mockOnGroupChange = jest.fn();

  const groups = [
    { id: "group-1", name: "Group A" },
    { id: "group-2", name: "Group B" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the search bar and group filters", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <TransactionsFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        selectedGroupId="all"
        onGroupChange={mockOnGroupChange}
        groups={groups}
      />,
    );

    expect(getByPlaceholderText("Search transactions...")).toBeTruthy();
    expect(getByText("All Groups")).toBeTruthy();
    expect(getByText("Group A")).toBeTruthy();
    expect(getByText("Group B")).toBeTruthy();
  });

  it("calls onSearchChange when the query changes", () => {
    const { getByPlaceholderText } = renderWithProviders(
      <TransactionsFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        selectedGroupId="all"
        onGroupChange={mockOnGroupChange}
        groups={groups}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Search transactions..."), "coffee");
    expect(mockOnSearchChange).toHaveBeenCalledWith("coffee");
  });

  it("calls onGroupChange when a group is selected", () => {
    const { getByText } = renderWithProviders(
      <TransactionsFilters
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        selectedGroupId="all"
        onGroupChange={mockOnGroupChange}
        groups={groups}
      />,
    );

    fireEvent.press(getByText("Group A"));
    expect(mockOnGroupChange).toHaveBeenCalledWith("group-1");
  });
});
