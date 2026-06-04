import { EmptyStateCard } from "../../judgement/EmptyStateCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => {
      return <Text>{name}</Text>;
    },
  };
});

describe("EmptyStateCard", () => {
  it("should render checkmark-done icon", () => {
    const { getByText } = renderWithProviders(<EmptyStateCard maxCardHeight={500} />);

    expect(getByText("checkmark-done")).toBeTruthy();
  });

  it("should render title", () => {
    const { getByText } = renderWithProviders(<EmptyStateCard maxCardHeight={500} />);

    expect(getByText("All caught up")).toBeTruthy();
  });

  it("should render subtitle", () => {
    const { getByText } = renderWithProviders(<EmptyStateCard maxCardHeight={500} />);

    expect(getByText("There are no pending submissions to review.")).toBeTruthy();
  });

  it("should apply maxCardHeight", () => {
    const { getByTestId } = renderWithProviders(<EmptyStateCard maxCardHeight={400} />);

    const view = getByTestId("empty-state-card");
    expect(view).toBeTruthy();
  });

  it("should render with different maxCardHeight values", () => {
    const { getByText, rerender } = renderWithProviders(<EmptyStateCard maxCardHeight={300} />);

    expect(getByText("All caught up")).toBeTruthy();

    rerender(<EmptyStateCard maxCardHeight={600} />);

    expect(getByText("All caught up")).toBeTruthy();
  });
});
