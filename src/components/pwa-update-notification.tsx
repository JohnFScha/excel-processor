import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateNotification() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          // Listen for service worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  setShowUpdatePrompt(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          // Log the error so the promise rejection is handled
          // and doesn't trigger the "must be awaited" lint rule.
          // Keeping behavior non-blocking: we don't want to interrupt the app.
          console.error('navigator.serviceWorker.ready failed:', err);
        });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleUpdateClick = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <RefreshCw className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Actualización de la App Disponible</p>
          <p className="text-xs text-muted-foreground">Una nueva versión está lista. Actualiza para obtenerla.</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={handleUpdateClick} size="sm">
          Actualizar
        </Button>
        <Button onClick={handleDismiss} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
