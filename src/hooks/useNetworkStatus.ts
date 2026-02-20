import { useState, useEffect } from 'react';
import { OperationQueue } from '@/services/retryService';

/**
 * Hook for monitoring network status and handling offline scenarios
 * Automatically processes queued operations when connection is restored
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Función para actualizar estado de conexión
    const updateNetworkStatus = () => {
      const online = navigator?.onLine ?? true;
      const previouslyOnline = isOnline;

      setIsOnline(online);

      // Si acabamos de reconectarnos después de estar offline
      if (online && !previouslyOnline && wasOffline) {
        console.log('Connection restored, processing queued operations...');
        OperationQueue.processQueue().catch(error => {
          console.error('Error processing queued operations:', error);
        });
        setWasOffline(false);
      } else if (!online && previouslyOnline) {
        // Acabamos de perder conexión
        setWasOffline(true);
        console.log('Connection lost, operations will be queued');
      }
    };

    // Solo en entornos web
    if (typeof window !== 'undefined') {
      // Estado inicial
      updateNetworkStatus();

      // Listeners para cambios de conectividad
      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);

      return () => {
        window.removeEventListener('online', updateNetworkStatus);
        window.removeEventListener('offline', updateNetworkStatus);
      };
    }
  }, [isOnline, wasOffline]);

  // Función para añadir operación a la cola
  const queueOperation = (
    id: string,
    operation: () => Promise<any>,
    options = {}
  ) => {
    OperationQueue.enqueue(id, operation, options);
  };

  // Función para procesar cola manualmente
  const processQueue = async () => {
    if (isOnline) {
      await OperationQueue.processQueue();
    }
  };

  // Información de la cola
  const queueInfo = OperationQueue.getQueueInfo();

  return {
    isOnline,
    wasOffline,
    queuedOperations: queueInfo.count,
    queueOperation,
    processQueue,
    clearQueue: OperationQueue.clearQueue
  };
};