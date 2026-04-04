import { useEffect, useState } from 'react';

const useDetectOtherTab = (formId) => {
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    if (!formId) return;

    const channel = new BroadcastChannel(`form-${formId}-channel`);

    const tabId = Date.now() + Math.random(); // unique id
    let activeTabs = new Set([tabId]);

    const updateOwnership = () => {
      // The smallest ID is the "main tab"
      const mainTabId = Math.min(...activeTabs);
      setIsDuplicate(mainTabId !== tabId);
    };

    // 🔹 Step 1: announce "I opened this form"
    channel.postMessage({
      type: 'FORM_OPENED',
      tabId,
    });

    channel.onmessage = (msg) => {
      const { type, tabId: incomingTabId } = msg.data;

      // 🔹 Another tab opened
      if (type === 'FORM_OPENED') {
        activeTabs.add(incomingTabId);

        // Tell the new tab: "I already exist"
        channel.postMessage({
          type: 'FORM_ALREADY_OPEN',
          tabId,
        });

        updateOwnership();
      }

      // 🔹 Receive info about existing tabs
      if (type === 'FORM_ALREADY_OPEN') {
        activeTabs.add(incomingTabId);
        updateOwnership();
      }

      // 🔹 A tab closed
      if (type === 'FORM_CLOSED') {
        activeTabs.delete(incomingTabId);
        updateOwnership();
      }
    };

    // 🔹 Notify when closing
    const handleUnload = () => {
      channel.postMessage({
        type: 'FORM_CLOSED',
        tabId,
      });
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      channel.postMessage({
        type: 'FORM_CLOSED',
        tabId,
      });
      channel.close();
    };
  }, [formId]);

  return isDuplicate;
};

export default useDetectOtherTab;