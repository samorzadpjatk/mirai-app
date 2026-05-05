// Manual mock for @expo/vector-icons to avoid babel transformation issues
// This file is used by jest automatically when @expo/vector-icons is imported

const React = require("react");
const { Text } = require("react-native");

// Create a mock icon component that renders text with the icon name
function createMockIconComponent(displayName) {
  const MockIcon = function MockIcon(props) {
    return React.createElement(Text, {
      testID: `icon-${props.name || "unknown"}`,
      accessibilityLabel: props.name || "unknown",
      children: props.name || "unknown",
    });
  };
  MockIcon.displayName = displayName;
  return MockIcon;
}

module.exports = {
  Ionicons: createMockIconComponent("Ionicons"),
  MaterialIcons: createMockIconComponent("MaterialIcons"),
  MaterialCommunityIcons: createMockIconComponent("MaterialCommunityIcons"),
  FontAwesome: createMockIconComponent("FontAwesome"),
  FontAwesome5: createMockIconComponent("FontAwesome5"),
  Feather: createMockIconComponent("Feather"),
  AntDesign: createMockIconComponent("AntDesign"),
  Entypo: createMockIconComponent("Entypo"),
  EvilIcons: createMockIconComponent("EvilIcons"),
  Foundation: createMockIconComponent("Foundation"),
  Octicons: createMockIconComponent("Octicons"),
  SimpleLineIcons: createMockIconComponent("SimpleLineIcons"),
  Zocial: createMockIconComponent("Zocial"),
};
