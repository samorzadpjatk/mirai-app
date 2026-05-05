import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { TransactionHistory } from "../../../trips/groups/details/TransactionHistory";

describe("TransactionHistory", () => {
  const mockTransactions = [
    {
      id: "1",
      amount: 100,
      reason: "Challenge completion bonus",
      createdAt: "2024-01-15T10:00:00Z",
      admin: {
        id: "admin1",
        firstName: "John",
        lastName: "Doe",
      },
    },
    {
      id: "2",
      amount: -50,
      reason: "Penalty for late submission",
      createdAt: "2024-01-14T15:30:00Z",
      admin: {
        id: "admin2",
        firstName: "Jane",
        lastName: "Smith",
      },
    },
    {
      id: "3",
      amount: 200,
      reason: null,
      createdAt: "2024-01-13T09:00:00Z",
      admin: {
        id: "admin3",
        firstName: null,
        lastName: null,
      },
    },
  ];

  it("should render title", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(getByText("Coin Transactions")).toBeTruthy();
  });

  it("should render positive amount with plus sign", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(getByText("+100")).toBeTruthy();
  });

  it("should render negative amount with minus sign", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(getByText("-50")).toBeTruthy();
  });

  it("should render 'coins' label", () => {
    const { getAllByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    const coinLabels = getAllByText("coins");
    expect(coinLabels.length).toBeGreaterThan(0);
  });

  it("should render admin name", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(getByText(/John Doe/)).toBeTruthy();
  });

  it("should render 'Unknown Admin' when admin name is null", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(getByText(/Unknown Admin/)).toBeTruthy();
  });

  it("should render reason when provided", () => {
    const { getAllByText, getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    const reasonLabels = getAllByText("Reason:");
    expect(reasonLabels.length).toBeGreaterThanOrEqual(1);
    expect(getByText("Challenge completion bonus")).toBeTruthy();
  });

  it("should not render reason section when reason is null", () => {
    const transactionsWithNullReason = [
      {
        id: "1",
        amount: 100,
        reason: null,
        createdAt: "2024-01-15T10:00:00Z",
        admin: {
          id: "admin1",
          firstName: "John",
          lastName: "Doe",
        },
      },
    ];
    const { queryByText } = renderWithProviders(
      <TransactionHistory transactions={transactionsWithNullReason} />
    );
    expect(queryByText("Reason:")).toBeNull();
  });

  it("should render empty state when no transactions", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={[]} />
    );
    expect(getByText("No transactions yet")).toBeTruthy();
  });

  it("should render empty state subtitle", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={[]} />
    );
    expect(getByText("Coin transactions will appear here once coins are added or removed")).toBeTruthy();
  });

  it("should handle Date object for createdAt", () => {
    const transactionsWithDate = [
      {
        id: "1",
        amount: 100,
        reason: "Test",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        admin: {
          id: "admin1",
          firstName: "John",
          lastName: "Doe",
        },
      },
    ];
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={transactionsWithDate} />
    );
    expect(getByText("Coin Transactions")).toBeTruthy();
  });

  it("should handle partial admin name (firstName only)", () => {
    const transactionsWithPartialName = [
      {
        id: "1",
        amount: 100,
        reason: "Test",
        createdAt: "2024-01-15T10:00:00Z",
        admin: {
          id: "admin1",
          firstName: "John",
          lastName: null,
        },
      },
    ];
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={transactionsWithPartialName} />
    );
    expect(getByText(/John/)).toBeTruthy();
  });

  it("should handle partial admin name (lastName only)", () => {
    const transactionsWithPartialName = [
      {
        id: "1",
        amount: 100,
        reason: "Test",
        createdAt: "2024-01-15T10:00:00Z",
        admin: {
          id: "admin1",
          firstName: null,
          lastName: "Doe",
        },
      },
    ];
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={transactionsWithPartialName} />
    );
    expect(getByText(/Doe/)).toBeTruthy();
  });

  it("should render multiple transactions", () => {
    const { getByText } = renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(getByText("+100")).toBeTruthy();
    expect(getByText("-50")).toBeTruthy();
    expect(getByText("+200")).toBeTruthy();
  });
});
