import { useEffect, useState } from 'react';

const useDetectOtherTab = (formId) => {
  const [anotherTabOpen, setAnotherTabOpen] = useState(false);

  useEffect(() => {
    if (!formId) return;

    const channel = new BroadcastChannel(`form-${formId}-channel`);

    // Announce this tab is open
    channel.postMessage({ type: 'TAB_OPENED', timestamp: Date.now() });

    // Listen to other tabs
    channel.onmessage = (msg) => {
      const { type } = msg.data;

      if (type === 'TAB_OPENED') {
        // Another tab opened
        // setAnotherTabOpen(true);

        // Reply to notify new tab that we already exist
        channel.postMessage({ type: 'TAB_ALREADY_OPEN' });
      }

      if (type === 'TAB_ALREADY_OPEN') {
        // Existing tab confirmed
        setAnotherTabOpen(true);
      }

      if (type === 'TAB_CLOSED') {
        setAnotherTabOpen(false);
      }
    };

    // Notify others if this tab closes
    const handleUnload = () => {
      channel.postMessage({ type: 'TAB_CLOSED' });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      channel.close();
    };
  }, [formId]);

  return anotherTabOpen;
};

export default useDetectOtherTab;