import { YStack, XStack, Button, Input, Text, View, Spinner } from "tamagui";
import { useLoginForm } from "@integral-2025-app/auth";
import { useRouter } from "expo-router";
import { Lock, Mail, AlertCircle } from "@tamagui/lucide-icons";
import { StatusBar } from "expo-status-bar";

export default function LoginScreen() {
  const { formState, setEmail, setPassword, handleSubmit } = useLoginForm();
  const router = useRouter();

  const onSubmit = async () => {
    await handleSubmit(() => {
      router.replace("/");
    });
  };

  const { email, password, isLoading, error } = formState;

  return (
    <>
      <StatusBar style="auto" />
      <YStack
        flex={1}
        backgroundColor="$background"
        padding="$6"
        justifyContent="center"
      >
        <YStack space="$6" maxWidth={400} width="100%" alignSelf="center">
          <YStack space="$4" alignItems="center" marginBottom="$4">
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
            <Text
              fontSize="$10"
              fontWeight="900"
              textAlign="center"
              animation="quick"
              enterStyle={{ y: 20, opacity: 0 }}
              y={0}
              opacity={1}
            >
              Welcome Back
            </Text>
            <Text
              color="$gray11"
              fontSize="$4"
              textAlign="center"
              opacity={0.8}
            >
              Sign in to continue to PJapp
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
                placeholder="Enter your password"
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
                  Signing In...
                </Text>
              </XStack>
            ) : (
              "Sign In"
            )}
          </Button>

          <XStack justifyContent="center" space="$2">
            <Text color="$gray11" fontSize="$3">
              Don't have an account?
            </Text>
            <Text
              color="$red9"
              fontSize="$3"
              fontWeight="700"
              cursor="pointer"
              onPress={() => router.push("/auth/signup")}
              hoverStyle={{ opacity: 0.8 }}
              pressStyle={{ opacity: 0.6 }}
            >
              Sign Up
            </Text>
          </XStack>
        </YStack>
      </YStack>
    </>
  );
}
