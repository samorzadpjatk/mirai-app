import {
  YStack,
  XStack,
  Button,
  Input,
  Text,
  H1,
  View,
  Spinner,
  ScrollView,
} from "tamagui";
import { useSignupForm } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
} from "@tamagui/lucide-icons";
import { StatusBar } from "expo-status-bar";
import Logo from "../../components/Logo";

export default function SignupScreen() {
  const {
    formState,
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  } = useSignupForm();
  const router = useRouter();

  const onSubmit = async () => {
    await handleSubmit(() => {
      setTimeout(() => {
        router.replace("/");
      }, 2000);
    });
  };

  const { name, email, password, confirmPassword, isLoading, error, success } =
    formState;

  if (success) {
    return (
      <YStack
        flex={1}
        bg="$background"
        justify="center"
        items="center"
        p="$6"
      >
        <YStack space="$4" items="center" maxW={400}>
          <View
            width={80}
            height={80}
            rounded={40}
            bg="$green3"
            items="center"
            justify="center"
            animation="quick"
            enterStyle={{ scale: 0, rotate: "-180deg" }}
            scale={1}
            rotate="0deg"
          >
            <CheckCircle size={40} color="$green9" />
          </View>
          <H1
            color="$color"
            fontSize="$9"
            fontWeight="900"
            text="center"
            animation="quick"
            enterStyle={{ y: 20, opacity: 0 }}
          >
            Welcome Aboard!
          </H1>
          <Text color="$gray11" fontSize="$4" text="center" opacity={0.8}>
            Your account has been created successfully
          </Text>
          <Spinner color="$red9" />
        </YStack>
      </YStack>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <ScrollView
        flex={1}
        bg="$background"
        contentContainerStyle={{ grow: 1 }}
      >
        <YStack flex={1} p="$6" pt="$12" justify="center">
          <YStack space="$6" maxW={400} width="100%" self="center">
            {/* Logo */}
            <YStack space="$4" items="center" mb="$2">
              <Logo size={100} />
              <H1
                color="$color"
                fontSize="$10"
                fontWeight="900"
                text="center"
                animation="quick"
                enterStyle={{ y: 20, opacity: 0 }}
                y={0}
                opacity={1}
              >
                Create Account
              </H1>
              <Text
                color="$gray11"
                fontSize="$4"
                text="center"
                opacity={0.8}
              >
                Join PJapp today
              </Text>
            </YStack>

            {error && (
              <XStack
                bg="$red3"
                p="$3"
                rounded="$4"
                borderWidth={1}
                borderColor="$red7"
                space="$2"
                items="center"
                animation="quick"
                enterStyle={{ y: -10, opacity: 0 }}
              >
                <AlertCircle size={20} color="$red9" />
                <Text color="$red11" fontSize="$3" flex={1}>
                  {error}
                </Text>
              </XStack>
            )}

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Full Name
              </Text>
              <XStack
                bg="$gray3"
                rounded="$4"
                borderWidth={2}
                borderColor="$gray7"
                px="$4"
                items="center"
                space="$3"
              >
                <User size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="John Doe"
                  value={name}
                  onChangeText={(e) => setName(e.nativeEvent.text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                  bg="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  py="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Email
              </Text>
              <XStack
                bg="$gray3"
                rounded="$4"
                borderWidth={2}
                borderColor="$gray7"
                px="$4"
                items="center"
                space="$3"
              >
                <Mail size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={(e) => setEmail(e.nativeEvent.text)}
                  autoCapitalize="none"
                  
                  keyboardType="email-address"
                  editable={!isLoading}
                  bg="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  py="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Password
              </Text>
              <XStack
                bg="$gray3"
                rounded="$4"
                borderWidth={2}
                borderColor="$gray7"
                px="$4"
                items="center"
                space="$3"
              >
                <Lock size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={(e) => setPassword(e.nativeEvent.text)}
                  secureTextEntry
                  editable={!isLoading}
                  bg="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  py="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Confirm Password
              </Text>
              <XStack
                bg="$gray3"
                rounded="$4"
                borderWidth={2}
                borderColor="$gray7"
                px="$4"
                items="center"
                space="$3"
              >
                <Lock size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={(e) => setConfirmPassword(e.nativeEvent.text)}
                  secureTextEntry
                  editable={!isLoading}
                  bg="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  py="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <Button
              size="$5"
              rounded="$4"
              onPress={onSubmit}
              disabled={isLoading}
              animation="quick"
              testID="signup-submit-button"
            >
              {isLoading ? (
                <XStack space="$2" items="center">
                  <Spinner />
                  <Text fontWeight="700">
                    Creating Account...
                  </Text>
                </XStack>
              ) : (
                "Create Account"
              )}
            </Button>

            <XStack justify="center" space="$2" pb="$6">
              <Text color="$gray11" fontSize="$3">
                Already have an account?
              </Text>
              <Text
                color="$red9"
                fontSize="$3"
                fontWeight="700"
                cursor="pointer"
                onPress={() => router.push("/auth/login")}
                hoverStyle={{ opacity: 0.8 }}
                pressStyle={{ opacity: 0.6 }}
              >
                Sign In
              </Text>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </>
  );
}
