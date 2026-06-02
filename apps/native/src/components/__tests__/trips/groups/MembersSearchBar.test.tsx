import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { MembersSearchBar } from "../../../trips/groups/create/MembersSearchBar";

const searchPlaceholder = "Search by name";

describe("MembersSearchBar", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    renderWithProviders(<MembersSearchBar value="" onChangeText={mockOnChangeText} />);
    expect(screen.getByPlaceholderText(searchPlaceholder)).toBeOnTheScreen();
  });

  it("should render with placeholder text", () => {
    renderWithProviders(<MembersSearchBar value="" onChangeText={mockOnChangeText} />);
    expect(screen.getByPlaceholderText(searchPlaceholder)).toBeOnTheScreen();
  });

  it("should display current value", () => {
    renderWithProviders(<MembersSearchBar value="test query" onChangeText={mockOnChangeText} />);
    expect(screen.getByDisplayValue("test query")).toBeOnTheScreen();
  });

  it("should call onChangeText when text changes", () => {
    renderWithProviders(<MembersSearchBar value="" onChangeText={mockOnChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText(searchPlaceholder), "new search");
    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    expect(mockOnChangeText).toHaveBeenCalledWith("new search");
  });

  it("should handle empty value", () => {
    renderWithProviders(<MembersSearchBar value="" onChangeText={mockOnChangeText} />);
    expect(screen.getByPlaceholderText(searchPlaceholder)).toHaveProp("value", "");
  });

  it("should render search icon", () => {
    renderWithProviders(<MembersSearchBar value="" onChangeText={mockOnChangeText} />);
    expect(screen.getByText("search")).toBeOnTheScreen();
  });

  it("should render with correct container styling", () => {
    renderWithProviders(<MembersSearchBar value="" onChangeText={mockOnChangeText} />);
    expect(screen.getByTestId("members-search-bar-container")).toBeOnTheScreen();
  });
});
