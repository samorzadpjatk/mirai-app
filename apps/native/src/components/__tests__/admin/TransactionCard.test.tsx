import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import TransactionCard from "../../admin/transactions/TransactionCard";

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
    const { getByText } = renderWithProviders(
      <TransactionCard transaction={mockTransaction} />
    );

    expect(getByText("Test Group")).toBeTruthy();
    expect(getByText("Test reason")).toBeTruthy();
    expect(getByText("Admin: John Doe")).toBeTruthy();
    expect(getByText("+50")).toBeTruthy();
  });

  it("renders negative amounts with a minus sign", () => {
    const { getByText } = renderWithProviders(
      <TransactionCard
        transaction={{ ...mockTransaction, amount: -25 }}
      />
    );

    expect(getByText("-25")).toBeTruthy();
  });
});
