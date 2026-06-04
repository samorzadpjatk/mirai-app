import { screen } from "@testing-library/react-native";
import TransactionCard from "../../admin/transactions/TransactionCard";
import { renderWithProviders } from "../helpers/renderWithProviders";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

describe("TransactionCard", () => {
  const mockTransaction = {
    id: "trans-1",
    amount: 50,
    reason: "Test reason",
    createdAt: "2024-01-01T10:00:00.000Z",
    group: {
      id: "group-1",
      name: "Test Group",
    },
    admin: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
    },
  };

  it("renders transaction details", () => {
    renderWithProviders(<TransactionCard transaction={mockTransaction} />);

    expect(screen.getByText("Test Group")).toBeOnTheScreen();
    expect(screen.getByText("Test reason")).toBeOnTheScreen();
    expect(screen.getByText("Admin: John Doe")).toBeOnTheScreen();
    expect(screen.getByText("+50")).toBeOnTheScreen();
  });

  it("renders negative amounts with a minus sign", () => {
    renderWithProviders(<TransactionCard transaction={{ ...mockTransaction, amount: -25 }} />);

    expect(screen.getByText("-25")).toBeOnTheScreen();
  });
});
