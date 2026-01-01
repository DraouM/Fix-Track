import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from "react";

interface EventContextType {
  subscribe: (event: string, callback: () => void) => void;
  unsubscribe: (event: string, callback: () => void) => void;
  emit: (event: string) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

interface EventCallback {
  id: string;
  callback: () => void;
}

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use a ref to store callbacks to prevent re-renders when subscribing/unsubscribing
  const eventCallbacks = useRef<Record<string, EventCallback[]>>({});

  const subscribe = useCallback((event: string, callback: () => void) => {
    const callbackId = `${event}_${callback.toString()}`;

    if (!eventCallbacks.current[event]) {
      eventCallbacks.current[event] = [];
    }

    const existingCallbacks = eventCallbacks.current[event];
    const isAlreadySubscribed = existingCallbacks.some(
      (item) => item.id === callbackId
    );

    if (!isAlreadySubscribed) {
      eventCallbacks.current[event].push({ id: callbackId, callback });
    }
  }, []);

  const unsubscribe = useCallback((event: string, callback: () => void) => {
    const callbackId = `${event}_${callback.toString()}`;

    if (eventCallbacks.current[event]) {
      eventCallbacks.current[event] = eventCallbacks.current[event].filter(
        (item) => item.id !== callbackId
      );
    }
  }, []);

  const emit = useCallback((event: string) => {
    const callbacks = eventCallbacks.current[event];
    if (callbacks) {
      // Create a shallow copy to prevent issues if a callback unsubs during emission
      [...callbacks].forEach((item) => {
        try {
          item.callback();
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }, []);

  const value = {
    subscribe,
    unsubscribe,
    emit,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
};

// Hook to listen for specific events with stable callback
export const useEvent = (event: string, callback: () => void) => {
  const { subscribe, unsubscribe } = useEvents();

  useEffect(() => {
    subscribe(event, callback);
    return () => {
      unsubscribe(event, callback);
    };
  }, [event]); // Only event as dependency to avoid infinite loop
};
