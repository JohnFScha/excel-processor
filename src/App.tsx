import { PWAInstallPrompt } from "./components/pwa-install-prompt.tsx";
import { PWAUpdateNotification } from "./components/pwa-update-notification.tsx";
import { AppRouter } from "./routes/AppRouter.tsx";

export default function App() {
  return (
    <>
      <AppRouter />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </>
  );
}
