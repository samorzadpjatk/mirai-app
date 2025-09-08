"use client";

import { useState, useEffect } from "react";
import { Button, Card, Flex, Text, Dialog, Heading } from "@radix-ui/themes";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Check if iOS
    const checkIfIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    // Check if desktop (not mobile)
    const checkIfDesktop = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsDesktop(!isMobile);
    };

    checkIfInstalled();
    checkIfIOS();
    checkIfDesktop();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);


  const handleShowInstructions = () => {
    setShowInstallDialog(true);
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Card>
        <Flex direction="column" gap="2">
          <Flex justify={"between"} align="center">
            <Heading size="2">Install App</Heading>
            <Button size={"1"} onClick={handleShowInstructions} variant="solid">
              Installation Guide
            </Button>
          </Flex>
          <Text size="1">
            Install Treasure Bank as an app on your device for a better experience!
          </Text>
        </Flex>
      </Card>

      {/* Installation Instructions Dialog */}
      <Dialog.Root open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>How to Install Treasure Bank</Dialog.Title>

          <Flex direction="column" gap="4" mt="4">
            {isIOS ? (
              <>
                <Text size="2" weight="bold">On iOS (iPhone/iPad):</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Open &quot;Settings&quot;</Text>
                  <Text size="2">2. Open &quot;Apps&quot; section</Text>
                  <Text size="2">3. Select &quot;Safari&quot; App</Text>
                  <Text size="2">4. Scroll down to &quot;Advanced &quot;section</Text>
                  <Text size="2">5. Click on &quot;Feature Flags&quot; button</Text>
                  <Text size="2">6. Find and enable &quot;Notifications&quot; feature</Text>
                  <Text size="2">7. Restart Safari for changes to take effect</Text>
                  <Text size="2">8. Open this page in Safari</Text>
                  <Text size="2">9. Tap the Share button (square with arrow up)</Text>
                  <Text size="2">10. Scroll down and tap &quot;Add to Home Screen&quot;</Text>
                  <Text size="2">11. Tap &quot;Add&quot; to confirm</Text>
                </Flex>
              </>
            ) : isDesktop ? (
              <>
                <Text size="2" weight="bold">On Chrome (Windows/Mac):</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Look for install icon (⬇️) in the address bar</Text>
                  <Text size="2">2. Or go to Menu (⋮) → &quot;Install Treasure Bank...&quot;</Text>
                  <Text size="2">3. Click &quot;Install&quot; - app will be added to your system</Text>
                </Flex>

                <Text size="2" weight="bold">On Safari (Mac):</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Go to Safari menu → &quot;Add to Dock&quot;</Text>
                  <Text size="2">2. Click &quot;Add&quot; to install the PWA</Text>
                  <Text size="2">3. Find &quot;Treasure Bank&quot; in your Dock or Applications</Text>
                </Flex>

                <Text size="2" weight="bold">On Firefox:</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Go to Menu (☰) → &quot;Install this site as an app&quot;</Text>
                  <Text size="2">2. Or use keyboard shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac)</Text>
                  <Text size="2">3. Click &quot;Install&quot; to add to your applications</Text>
                </Flex>
              </>
            ) : (
              <>
                <Text size="2" weight="bold">On Android:</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Tap the menu button (three dots) in Chrome</Text>
                  <Text size="2">2. Select &quot;Add to Home screen&quot; or &quot;Install app&quot;</Text>
                  <Text size="2">3. Tap &quot;Add&quot; or &quot;Install&quot; to confirm</Text>
                </Flex>
              </>
            )}

            <Text size="1" color="gray">
              Once installed, you&apos;ll be able to use Treasure Bank like a native app with
              offline support and push notifications!
            </Text>
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft">
                Got it
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
