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
  const [_isDesktop, setIsDesktop] = useState(false);

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

  const _handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

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
        <Flex direction="column" gap="3">
          <Heading size="3">Install App</Heading>
          <Text size="2">
            Install Bank Monet as an app on your device for a better experience!
          </Text>
          
          <Flex gap="2">
            <Button onClick={handleShowInstructions} variant="solid">
              Installation Guide
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Installation Instructions Dialog */}
      <Dialog.Root open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>How to Install Bank Monet</Dialog.Title>
          
          <Flex direction="column" gap="4" mt="4">
            {isIOS ? (
              <>
                <Text size="2" weight="bold">On iOS (iPhone/iPad):</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Open this page in Safari</Text>
                  <Text size="2">2. Tap the Share button (square with arrow up)</Text>
                  <Text size="2">3. Scroll down and tap &quot;Add to Home Screen&quot;</Text>
                  <Text size="2">4. Tap &quot;Add&quot; to confirm</Text>
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
                
                <Text size="2" weight="bold">On Chrome (Windows/Mac):</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Look for install icon (⬇️) in the address bar</Text>
                  <Text size="2">2. Or go to Menu (⋮) → &quot;Install Bank Monet...&quot;</Text>
                  <Text size="2">3. Click &quot;Install&quot; - app will be added to your system</Text>
                </Flex>

                <Text size="2" weight="bold">On Safari (Mac):</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Go to Safari menu → &quot;Add to Dock&quot;</Text>
                  <Text size="2">2. Click &quot;Add&quot; to install the PWA</Text>
                  <Text size="2">3. Find &quot;Bank Monet&quot; in your Dock or Applications</Text>
                </Flex>

                <Text size="2" weight="bold">On Firefox:</Text>
                <Flex direction="column" gap="2">
                  <Text size="2">1. Go to Menu (☰) → &quot;Install this site as an app&quot;</Text>
                  <Text size="2">2. Or use keyboard shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac)</Text>
                  <Text size="2">3. Click &quot;Install&quot; to add to your applications</Text>
                </Flex>
              </>
            )}
            
            <Text size="1" color="gray">
              Once installed, you&apos;ll be able to use Bank Monet like a native app with 
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
