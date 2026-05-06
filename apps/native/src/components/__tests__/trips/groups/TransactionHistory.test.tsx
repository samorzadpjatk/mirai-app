import React from "react";
import { render, screen } from "@testing-library/react-native";
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
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(screen.getByText("Coin Transactions")).toBeOnTheScreen();
  });

  it("should render positive amount with plus sign", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(screen.getByText("+100")).toBeOnTheScreen();
  });

  it("should render negative amount with minus sign", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(screen.getByText("-50")).toBeOnTheScreen();
  });

  it("should render 'coins' label", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    const coinLabels = screen.getAllByText("coins");
    expect(coinLabels.length).toBeGreaterThan(0);
  });

  it("should render admin name", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(screen.getByText(/John Doe/)).toBeOnTheScreen();
  });

  it("should render 'Unknown Admin' when admin name is null", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(screen.getByText(/Unknown Admin/)).toBeOnTheScreen();
  });

  it("should render reason when provided", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    const reasonLabels = screen.getAllByText("Reason:");
    expect(reasonLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Challenge completion bonus")).toBeOnTheScreen();
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
    renderWithProviders(
      <TransactionHistory transactions={transactionsWithNullReason} />
    );
    expect(screen.queryByText("Reason:")).toBeNull();
  });

  it("should render empty state when no transactions", () => {
    renderWithProviders(
      <TransactionHistory transactions={[]} />
    );
    expect(screen.getByText("No transactions yet")).toBeOnTheScreen();
  });

  it("should render empty state subtitle", () => {
    renderWithProviders(
      <TransactionHistory transactions={[]} />
    );
    expect(screen.getByText("Coin transactions will appear here once coins are added or removed")).toBeOnTheScreen();
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
    renderWithProviders(
      <TransactionHistory transactions={transactionsWithDate} />
    );
    expect(screen.getByText("Coin Transactions")).toBeOnTheScreen();
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
    renderWithProviders(
      <TransactionHistory transactions={transactionsWithPartialName} />
    );
    expect(screen.getByText(/John/)).toBeOnTheScreen();
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
    renderWithProviders(
      <TransactionHistory transactions={transactionsWithPartialName} />
    );
    expect(screen.getByText(/Doe/)).toBeOnTheScreen();
  });

  it("should render multiple transactions", () => {
    renderWithProviders(
      <TransactionHistory transactions={mockTransactions} />
    );
    expect(screen.getByText("+100")).toBeOnTheScreen();
    expect(screen.getByText("-50")).toBeOnTheScreen();
    expect(screen.getByText("+200")).toBeOnTheScreen();
  });
});
