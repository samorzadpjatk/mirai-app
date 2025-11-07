import { render } from "@testing-library/react-native";
import Home from "../index";

describe("Home", () => {
  it("should render without crashing", () => {
    const { toJSON } = render(<Home />);
    expect(toJSON()).toBeTruthy();
  });

  it("should display the correct text", () => {
    const { getByText } = render(<Home />);
    expect(getByText("Integral app PJATK")).toBeTruthy();
  });
});
