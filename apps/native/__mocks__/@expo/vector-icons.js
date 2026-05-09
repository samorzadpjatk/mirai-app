import { createElement } from "react";
import { Text } from "react-native";

/**
 * Create a mock icon component for a specific icon set
 * @param {string} iconSetName - The display name for the icon component
 * @returns {React.Component} A mock icon component that renders the icon name as text
 */
const createIconSetMock = (iconSetName) => {
  const MockIcon = ({ name, testID, ...props }) =>
    createElement(
      Text,
      { testID: testID || `icon-${name}`, ...props },
      name
    );
  MockIcon.displayName = iconSetName;
  return MockIcon;
};

/**
 * Global mock for @expo/vector-icons
 * 
 * This mock prevents React act() warnings by avoiding async font loading
 * and renders icon names as text for testability.
 * 
 * Benefits:
 * - Eliminates "An update to Icon inside a test was not wrapped in act(...)" warnings
 * - Makes icon names queryable via getByText("icon-name")
 * - Provides testIDs for icon querying
 */
export const Ionicons = createIconSetMock("Ionicons");
export const MaterialIcons = createIconSetMock("MaterialIcons");
export const Feather = createIconSetMock("Feather");
export const FontAwesome = createIconSetMock("FontAwesome");
export const AntDesign = createIconSetMock("AntDesign");
export const EvilIcons = createIconSetMock("EvilIcons");
export const Entypo = createIconSetMock("Entypo");
export const Foundation = createIconSetMock("Foundation");
export const MaterialCommunityIcons = createIconSetMock("MaterialCommunityIcons");
export const Octicons = createIconSetMock("Octicons");
export const Zocial = createIconSetMock("Zocial");
export const SimpleLineIcons = createIconSetMock("SimpleLineIcons");
export const Fontisto = createIconSetMock("Fontisto");
export function createIconSet() { return createIconSetMock("CustomIconSet"); }
