import {
  TextInput,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { Input } from "@mirai-app/ui";

interface ThemedTextInputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<TextStyle>;
  error?: boolean;
}

export function ThemedTextInput({
  style,
  error = false,
  ...props
}: ThemedTextInputProps) {
  return (
    <Input
      backgroundColor="$backgroundDark"
      borderRadius="$md"
      borderWidth={1}
      borderColor={error ? "$danger" : "$borderDark"}
      paddingHorizontal="$md"
      paddingVertical="$md"
      fontSize="$base"
      color="$white"
      placeholderTextColor="#64748b"
      style={style}
      {...props}
    />
  );
}
