import type React from "react";
import { View, Text } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CurrentSubmissionCard } from "../../judgement/CurrentSubmissionCard";

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    useSharedValue: jest.fn().mockReturnValue({ value: 0 }),
    useAnimatedStyle: jest.fn().mockReturnValue({}),
    withSpring: jest.fn().mockReturnValue({ value: 0 }),
    withTiming: jest.fn().mockReturnValue({ value: 0 }),
    interpolate: jest.fn().mockReturnValue(0),
    Extrapolation: { CLAMP: "clamp" },
    View: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <View style={style}>{children}</View>
    ),
    default: {
      View: ({ children, style }: { children: React.ReactNode; style?: object }) => (
        <View style={style}>{children}</View>
      ),
    },
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock("expo-image", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Image: ({ source }: { source: { uri: string } }) => <Text testID="image">{source.uri}</Text>,
  };
});

jest.mock("~/utils/validation", () => ({
  formatDate: jest.fn().mockReturnValue("Jan 15, 2024"),
  getInitials: jest.fn().mockReturnValue("GN"),
}));

jest.mock("~/components/judgement/SubmissionAssetPreview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SubmissionAssetPreview: () => <View testID="asset-preview" />,
  };
});

const mockSubmission = {
  id: "sub-1",
  status: "PENDING",
  group: {
    id: "group-1",
    name: "Test Group",
    description: null,
    image: null,
  },
  createdAt: new Date("2024-01-15"),
  textContent: "This is a test submission",
  latitude: 52.2297,
  longitude: 21.0122,
  imageIds: [],
  videoId: null,
};

const mockSubmissionWithImage = {
  ...mockSubmission,
  group: {
    ...mockSubmission.group,
    image: "https://example.com/group-image.jpg",
  },
};

const mockSubmissionWithoutLocation = {
  ...mockSubmission,
  latitude: null,
  longitude: null,
};

const mockSubmissionWithoutText = {
  ...mockSubmission,
  textContent: "",
};

const mockCardStyle = {};
const mockApproveStampStyle = {};
const mockRejectStampStyle = {};

describe("CurrentSubmissionCard", () => {
  it("should render group name", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText("Test Group")).toBeTruthy();
  });

  it("should render submission date", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText(/Submitted/)).toBeTruthy();
  });

  it("should render group initials when no image", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText("GN")).toBeTruthy();
  });

  it("should render group image when available", () => {
    const { getByTestId } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmissionWithImage}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByTestId("image")).toBeTruthy();
  });

  it("should render text content", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText("This is a test submission")).toBeTruthy();
  });

  it("should render location when available", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText(/52.22970/)).toBeTruthy();
    expect(getByText(/21.01220/)).toBeTruthy();
  });

  it("should not render location when not available", () => {
    const { queryByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmissionWithoutLocation}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(queryByText(/52.22970/)).toBeNull();
  });

  it("should not render text block when text is empty", () => {
    const { queryByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmissionWithoutText}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(queryByText("This is a test submission")).toBeNull();
  });

  it("should render approve stamp", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText("APPROVE")).toBeTruthy();
    expect(getByText("checkmark")).toBeTruthy();
  });

  it("should render reject stamp", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText("REJECT")).toBeTruthy();
    expect(getByText("close")).toBeTruthy();
  });

  it("should render asset preview", () => {
    const { getByTestId } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByTestId("asset-preview")).toBeTruthy();
  });

  it("should render location icon", () => {
    const { getByText } = renderWithProviders(
      <CurrentSubmissionCard
        submission={mockSubmission}
        maxCardHeight={500}
        cardStyle={mockCardStyle}
        approveStampStyle={mockApproveStampStyle}
        rejectStampStyle={mockRejectStampStyle}
      />
    );

    expect(getByText("location")).toBeTruthy();
  });
});
