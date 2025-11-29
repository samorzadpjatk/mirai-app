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
import { useSignupForm } from "@integral-2025-app/auth";
import { useRouter } from "expo-router";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
} from "@tamagui/lucide-icons";
import { StatusBar } from "expo-status-bar";

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
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
        padding="$6"
      >
        <YStack space="$4" alignItems="center" maxWidth={400}>
          <View
            width={80}
            height={80}
            borderRadius={40}
            backgroundColor="$green3"
            alignItems="center"
            justifyContent="center"
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
            textAlign="center"
            animation="quick"
            enterStyle={{ y: 20, opacity: 0 }}
          >
            Welcome Aboard!
          </H1>
          <Text color="$gray11" fontSize="$4" textAlign="center" opacity={0.8}>
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
        backgroundColor="$background"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack flex={1} padding="$6" paddingTop="$12" justifyContent="center">
          <YStack space="$6" maxWidth={400} width="100%" alignSelf="center">
            {/* Logo */}
            <YStack space="$4" alignItems="center" marginBottom="$2">
              <View
                width={100}
                height={100}
                borderRadius={50}
                borderWidth={5}
                borderColor="$red9"
                overflow="hidden"
                animation="quick"
                enterStyle={{ scale: 0, opacity: 0, rotate: "-180deg" }}
                scale={1}
                opacity={1}
                rotate="0deg"
              >
                <View width="100%" height="50%" backgroundColor="white" />
                <View width="100%" height="50%" backgroundColor="$red9" />
              </View>
              <H1
                color="$color"
                fontSize="$10"
                fontWeight="900"
                textAlign="center"
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
                textAlign="center"
                opacity={0.8}
              >
                Join PJapp today
              </Text>
            </YStack>

            {error && (
              <XStack
                backgroundColor="$red3"
                padding="$3"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$red7"
                space="$2"
                alignItems="center"
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
                backgroundColor="$gray3"
                borderRadius="$4"
                borderWidth={2}
                borderColor="$gray7"
                paddingHorizontal="$4"
                alignItems="center"
                space="$3"
              >
                <User size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                  backgroundColor="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  paddingVertical="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Email
              </Text>
              <XStack
                backgroundColor="$gray3"
                borderRadius="$4"
                borderWidth={2}
                borderColor="$gray7"
                paddingHorizontal="$4"
                alignItems="center"
                space="$3"
              >
                <Mail size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isLoading}
                  backgroundColor="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  paddingVertical="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Password
              </Text>
              <XStack
                backgroundColor="$gray3"
                borderRadius="$4"
                borderWidth={2}
                borderColor="$gray7"
                paddingHorizontal="$4"
                alignItems="center"
                space="$3"
              >
                <Lock size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                  backgroundColor="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  paddingVertical="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text color="$color" fontSize="$3" fontWeight="600">
                Confirm Password
              </Text>
              <XStack
                backgroundColor="$gray3"
                borderRadius="$4"
                borderWidth={2}
                borderColor="$gray7"
                paddingHorizontal="$4"
                alignItems="center"
                space="$3"
              >
                <Lock size={20} color="$gray11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                  backgroundColor="transparent"
                  color="$color"
                  placeholderTextColor="$gray11"
                  paddingVertical="$3.5"
                  focusStyle={{ outlineStyle: "none" }}
                />
              </XStack>
            </YStack>

            <Button
              backgroundColor="$red9"
              color="white"
              size="$5"
              fontWeight="700"
              borderRadius="$4"
              onPress={onSubmit}
              disabled={isLoading}
              hoverStyle={{ backgroundColor: "$red10" }}
              pressStyle={{ backgroundColor: "$red8", scale: 0.98 }}
              animation="quick"
            >
              {isLoading ? (
                <XStack space="$2" alignItems="center">
                  <Spinner color="white" />
                  <Text color="white" fontWeight="700">
                    Creating Account...
                  </Text>
                </XStack>
              ) : (
                "Create Account"
              )}
            </Button>

            <XStack justifyContent="center" space="$2" paddingBottom="$6">
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
