import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return; // App is already installed
    }

    // Check if the user has previously dismissed the prompt
    const promptDismissed = localStorage.getItem("pwaPromptDismissed");
    if (promptDismissed && Date.now() - parseInt(promptDismissed) < 7 * 24 * 60 * 60 * 1000) {
      return; // Prompt was dismissed less than 7 days ago
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
        // Store the dismissal time
        localStorage.setItem("pwaPromptDismissed", Date.now().toString());
      }
      // Clear the deferredPrompt variable
      setDeferredPrompt(null);
      setShowPrompt(false);
    });
  };

  const handleDismiss = () => {
    // Store the dismissal time
    localStorage.setItem("pwaPromptDismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("pwa.installTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {t("pwa.installDescription")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-500 p-1"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-4 flex space-x-3">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleInstallClick}
        >
          {t("pwa.install")}
        </Button>
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={handleDismiss}
        >
          {t("common.notNow")}
        </Button>
      </div>
    </div>
  );
};

export default InstallPrompt;
