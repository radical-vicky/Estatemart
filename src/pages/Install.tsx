import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Share, MoreVertical, Plus, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center max-w-md">
        <Link to="/" className="self-start mb-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to store</span>
        </Link>

        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        {installed ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">App Installed!</h1>
            <p className="text-muted-foreground">EstateMart is now on your home screen. Open it anytime to shop.</p>
          </div>
        ) : (
          <div className="text-center space-y-6 w-full">
            <h1 className="text-2xl font-bold text-foreground">Install EstateMart</h1>
            <p className="text-muted-foreground">Get the full app experience — install EstateMart on your phone for quick access.</p>

            {deferredPrompt ? (
              <Button variant="glow" size="lg" className="w-full gap-2" onClick={handleInstall}>
                <Download className="w-5 h-5" /> Install App
              </Button>
            ) : isIOS ? (
              <div className="glass rounded-xl p-6 text-left space-y-4">
                <p className="font-semibold text-foreground text-sm">Install on iPhone / iPad:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Share className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">1. Tap the Share button</p>
                      <p className="text-xs text-muted-foreground">At the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">2. Tap "Add to Home Screen"</p>
                      <p className="text-xs text-muted-foreground">Scroll down in the share menu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">3. Tap "Add"</p>
                      <p className="text-xs text-muted-foreground">The app icon will appear on your home screen</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-xl p-6 text-left space-y-4">
                <p className="font-semibold text-foreground text-sm">Install on Android:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MoreVertical className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">1. Tap the menu (⋮)</p>
                      <p className="text-xs text-muted-foreground">Top right of Chrome</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Download className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">2. Tap "Install app" or "Add to Home Screen"</p>
                      <p className="text-xs text-muted-foreground">Follow the prompt to install</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
