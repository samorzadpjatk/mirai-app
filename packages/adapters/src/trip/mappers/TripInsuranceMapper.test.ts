import { describe, it, expect } from "bun:test";
import { tripInsuranceMapper } from "./TripInsuranceMapper";

describe("[UNIT] TripInsuranceMapper", () => {
  const mockInsurance = {
    id: "insurance-123",
    tripId: "trip-456",
    title: "Travel Insurance",
    description: "Comprehensive travel coverage",
    provider: "SafeTravel Inc",
    policyNumber: "POL-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockSteps = [
    {
      id: "step-1",
      insuranceId: "insurance-123",
      stepNumber: 1,
      title: "Step One",
      description: "First step description",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "step-2",
      insuranceId: "insurance-123",
      stepNumber: 2,
      title: "Step Two",
      description: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ];

  it("converts database insurance record to DTO", () => {
    const dto = tripInsuranceMapper.toDTO(mockInsurance, mockSteps);

    expect(dto.id).toBe("insurance-123");
    expect(dto.tripId).toBe("trip-456");
    expect(dto.title).toBe("Travel Insurance");
    expect(dto.description).toBe("Comprehensive travel coverage");
    expect(dto.provider).toBe("SafeTravel Inc");
    expect(dto.policyNumber).toBe("POL-789");
  });

  it("converts database steps to InsuranceStep DTOs sorted by stepNumber", () => {
    const dto = tripInsuranceMapper.toDTO(mockInsurance, mockSteps);

    expect(dto.steps).toHaveLength(2);
    const step0 = dto.steps[0]!;
    const step1 = dto.steps[1]!;
    expect(step0.stepNumber).toBe(1);
    expect(step0.title).toBe("Step One");
    expect(step0.description).toBe("First step description");
    expect(step1.stepNumber).toBe(2);
    expect(step1.title).toBe("Step Two");
    expect(step1.description).toBeNull();
  });

  it("handles empty steps array", () => {
    const dto = tripInsuranceMapper.toDTO(mockInsurance, []);

    expect(dto.steps).toHaveLength(0);
    expect(dto.steps).toEqual([]);
  });

  it("handles null description", () => {
    const insuranceWithNullDesc = {
      ...mockInsurance,
      description: null,
    };

    const dto = tripInsuranceMapper.toDTO(insuranceWithNullDesc, mockSteps);

    expect(dto.description).toBeNull();
  });

  it("handles null provider and policyNumber", () => {
    const insuranceWithNulls = {
      ...mockInsurance,
      provider: null,
      policyNumber: null,
    };

    const dto = tripInsuranceMapper.toDTO(insuranceWithNulls, mockSteps);

    expect(dto.provider).toBeNull();
    expect(dto.policyNumber).toBeNull();
  });

  it("sorts steps by stepNumber even if input is unsorted", () => {
    const unsortedSteps = [
      {
        id: "step-3",
        insuranceId: "insurance-123",
        stepNumber: 3,
        title: "Step Three",
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "step-1",
        insuranceId: "insurance-123",
        stepNumber: 1,
        title: "Step One",
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "step-2",
        insuranceId: "insurance-123",
        stepNumber: 2,
        title: "Step Two",
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    const dto = tripInsuranceMapper.toDTO(mockInsurance, unsortedSteps);

    expect(dto.steps[0]!.stepNumber).toBe(1);
    expect(dto.steps[1]!.stepNumber).toBe(2);
    expect(dto.steps[2]!.stepNumber).toBe(3);
  });
});
