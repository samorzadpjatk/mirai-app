import { describe, expect, it } from "vitest";
import { validateUserRegistration } from "../validateUserRegistration";

describe("validateUserRegistration", () => {
  it("trims and lowercases inputs", () => {
    const result = validateUserRegistration({
      firstName: "  Jan  ",
      lastName: "  Kowalski  ",
      email: "  JAN@EXAMPLE.COM  ",
    });
    expect(result).toEqual({
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan@example.com",
    });
  });

  it("throws when firstName is too short", () => {
    expect(() =>
      validateUserRegistration({ firstName: "A", lastName: "Kowalski", email: "jan@example.com" }),
    ).toThrow("Imię musi mieć co najmniej 2 znaki");
  });

  it("throws when lastName is too short", () => {
    expect(() =>
      validateUserRegistration({ firstName: "Jan", lastName: "K", email: "jan@example.com" }),
    ).toThrow("Nazwisko musi mieć co najmniej 2 znaki");
  });

  it("throws when firstName contains digits", () => {
    expect(() =>
      validateUserRegistration({
        firstName: "J4n",
        lastName: "Kowalski",
        email: "jan@example.com",
      }),
    ).toThrow("Imię nie może zawierać cyfr");
  });

  it("throws when lastName contains digits", () => {
    expect(() =>
      validateUserRegistration({
        firstName: "Jan",
        lastName: "K0walski",
        email: "jan@example.com",
      }),
    ).toThrow("Nazwisko nie może zawierać cyfr");
  });

  it("passes for valid names", () => {
    const result = validateUserRegistration({
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@example.com",
    });
    expect(result).toEqual({
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@example.com",
    });
  });
});
