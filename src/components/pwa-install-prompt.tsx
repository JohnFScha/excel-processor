import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'splitty.pwa_install_decision'; // 'accepted' | 'rejected'

function getStoredDecision(): 'accepted' | 'rejected' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'accepted' ? 'accepted' : v === 'rejected' ? 'rejected' : null;
  } catch {
    return null;
  }
}

function setStoredDecision(value: 'accepted' | 'rejected') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // If user already made a decision, don't show the prompt again
    if (getStoredDecision() !== null) return;

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Prevent the mini-infobar from appearing on mobile
    if (navigator.userAgent.toLowerCase().includes('android') || navigator.userAgent.toLowerCase().includes('ios')) return;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handler);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setStoredDecision('accepted');
      toast.success('App instalada correctamente');
    } else {
      setStoredDecision('rejected');
      toast.error('Error al instalar la app');
    }

    // Clear the deferredPrompt so it can only be used once
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setStoredDecision('rejected');
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Download className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Instalar Splitty</p>
          <p className="text-xs text-muted-foreground">Agrega a tu pantalla de inicio para un acceso rápido</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={void handleInstallClick} size="sm">
          Instalar
        </Button>
        <Button onClick={handleDismiss} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
