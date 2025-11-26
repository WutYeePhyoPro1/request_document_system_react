import React, { useState, useEffect } from 'react';
import { Bell, Info, X, CheckCircle } from 'lucide-react';
import { getNotificationRecipients } from '../../utils/notificationService';

/**
 * Notification Recipients Preview Component
 * 
 * Shows who will receive notifications when a form is created or approved.
 * This mirrors the Laravel notification logic.
 * 
 * USAGE:
 * <NotificationRecipientsPreview
 *   formData={formData}
 *   action="create" // or "approve", "check", "acknowledge", "issue"
 *   approvals={approvals} // approval process users from API
 * />
 */

export default function NotificationRecipientsPreview({
  formData = {},
  action = 'create',
  approvals = [],
  onClose = () => {}
}) {
  const [recipients, setRecipients] = useState([]);

  useEffect(() => {
    const calculatedRecipients = getNotificationRecipients({
      formData,
      approvals,
      action
    });
    setRecipients(calculatedRecipients);
  }, [formData, action, approvals]);

  if (recipients.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Info className="w-4 h-4" />
          <span className="text-sm">No notifications will be sent for this action.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">
            Notification Recipients ({recipients.length})
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {recipients.map((recipient, index) => (
          <div
            key={`${recipient.id}-${index}`}
            className="bg-white rounded-md p-3 border border-blue-100"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{recipient.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {recipient.role}
                  </span>
                  {recipient.branch && (
                    <span className="text-xs text-gray-500">({recipient.branch})</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">{recipient.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-blue-200">
        <p className="text-xs text-blue-700">
          <Info className="w-3 h-3 inline mr-1" />
          Notifications are automatically sent when you submit this action.
        </p>
      </div>
    </div>
  );
}
