import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  waitingWorker: ServiceWorker | null;
  updateAvailable: boolean;
}

/**
 * Hook to detect and manage service worker updates.
 * Returns state about whether an update is available and a function to apply it.
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    waitingWorker: null,
    updateAvailable: false,
  });

  const applyUpdate = useCallback(() => {
    if (state.waitingWorker) {
      // Tell the waiting service worker to skip waiting and become active
      state.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.waitingWorker]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      // When the service worker controlling the page changes, reload to get new content
      window.location.reload();
    };

    const trackWaitingWorker = (registration: ServiceWorkerRegistration) => {
      const worker = registration.waiting;
      if (worker) {
        setState({ waitingWorker: worker, updateAvailable: true });
      }
    };

    const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // When the new worker becomes 'installed' and there's already a controller,
        // it means there's an update waiting
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setState({ waitingWorker: newWorker, updateAvailable: true });
        }
      });
    };

    // Listen for controller changes (when skipWaiting is called)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check existing registration
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // Check if there's already a waiting worker
      if (registration.waiting) {
        trackWaitingWorker(registration);
      }

      // Listen for new service workers
      registration.addEventListener('updatefound', () => {
        handleUpdateFound(registration);
      });

      // Periodically check for updates (every 60 seconds when tab is visible)
      const checkForUpdates = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {
            // Silently fail - network might be unavailable
          });
        }
      };

      const intervalId = setInterval(checkForUpdates, 60 * 1000);

      // Also check when tab becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return {
    updateAvailable: state.updateAvailable,
    applyUpdate,
  };
}
