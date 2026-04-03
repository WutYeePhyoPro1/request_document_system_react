import { useEffect, useState } from 'react';

const useDetectOtherTab = (formId) => {
  const [anotherTabOpen, setAnotherTabOpen] = useState(false);

  useEffect(() => {
    if (!formId) return;

    const channel = new BroadcastChannel(`form-${formId}-channel`);

    let isDuplicate = false;

    channel.postMessage({ type: 'CHECK' });

    channel.onmessage = (msg) => {
      const { type } = msg.data;

      if (type === 'CHECK') {
        channel.postMessage({ type: 'EXISTS' });
      }

      if (type === 'EXISTS') {
        if (!isDuplicate) {
          isDuplicate = true;
          setAnotherTabOpen(true);
        }
      }

      if (type === 'TAB_CLOSED') {
        setAnotherTabOpen(false);
      }
    };

    // Optional: notify on close
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