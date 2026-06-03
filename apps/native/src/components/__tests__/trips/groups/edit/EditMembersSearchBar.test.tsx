import { screen, userEvent } from "@testing-library/react-native";
import { EditMembersSearchBar } from "../../../../trips/groups/edit/EditMembersSearchBar";
import { renderWithProviders } from "../../../helpers/renderWithProviders";

describe("EditMembersSearchBar", () => {
  it("renders search input with placeholder", () => {
    renderWithProviders(<EditMembersSearchBar value="" onChangeText={jest.fn()} />);

    expect(screen.getByPlaceholderText("Search by name")).toBeOnTheScreen();
  });

  it("displays current value", () => {
    renderWithProviders(<EditMembersSearchBar value="John" onChangeText={jest.fn()} />);

    expect(screen.getByDisplayValue("John")).toBeOnTheScreen();
  });

  it("calls onChangeText when typing", async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<EditMembersSearchBar value="" onChangeText={onChangeText} />);

    const input = screen.getByPlaceholderText("Search by name");
    await user.type(input, "abc");

    expect(onChangeText).toHaveBeenCalledTimes(3);
  });
});
