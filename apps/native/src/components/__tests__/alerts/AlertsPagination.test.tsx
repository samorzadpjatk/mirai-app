import { fireEvent } from "@testing-library/react-native";
import { AlertsPagination } from "../../alerts/AlertsPagination";
import { renderWithProviders } from "../helpers/renderWithProviders";

describe("AlertsPagination", () => {
  it("should render pagination info", () => {
    const { getByText } = renderWithProviders(
      <AlertsPagination
        page={1}
        totalPages={5}
        onPrev={() => {
          /* noop */
        }}
        onNext={() => {
          /* noop */
        }}
      />,
    );

    expect(getByText("Page 1 of 5")).toBeTruthy();
  });

  it("should call onPrev when previous is pressed", () => {
    const onPrev = jest.fn();
    const { getByText } = renderWithProviders(
      <AlertsPagination
        page={2}
        totalPages={5}
        onPrev={onPrev}
        onNext={() => {
          /* noop */
        }}
      />,
    );

    fireEvent.press(getByText("Previous"));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("should call onNext when next is pressed", () => {
    const onNext = jest.fn();
    const { getByText } = renderWithProviders(
      <AlertsPagination
        page={1}
        totalPages={5}
        onPrev={() => {
          /* noop */
        }}
        onNext={onNext}
      />,
    );

    fireEvent.press(getByText("Next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("should return null when totalPages is 1", () => {
    const { queryByText } = renderWithProviders(
      <AlertsPagination
        page={1}
        totalPages={1}
        onPrev={() => {
          /* noop */
        }}
        onNext={() => {
          /* noop */
        }}
      />,
    );

    expect(queryByText(/Page/)).toBeNull();
    expect(queryByText("Previous")).toBeNull();
    expect(queryByText("Next")).toBeNull();
  });
});
