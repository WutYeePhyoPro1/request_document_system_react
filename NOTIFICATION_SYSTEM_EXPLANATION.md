# Notification System Implementation in React

## Overview

This document explains how the notification system works in the Big Damage Issue form and how to implement it in React.

## How Notifications Work in Laravel (Backend)

### When Form is Created

1. **Checker Notification (user_type = 'C')**
   ```php
   // Find checkers in the same branch, department 8
   $checkers = User::where([
       'role_id' => $checker_role->id, 
       'from_branch_id' => $general_form->from_branch, 
       'department_id' => 8  // Big Damage department
   ])->get();
   
   // Send notification to each checker
   foreach ($checkers as $checker) {
       Notification::send($checker, new ApproverNotification(...));
   }
   ```

2. **Approver Notification (user_type = 'A1')**
   - BM/ABM approvers assigned in approval workflow
   - Found from `approval_process_users` table where `user_type = 'A1'`

### Notification Flow Based on Status

```
Form Created (Ongoing)
    ↓
Checker (C) receives notification
    ↓
Checker Approves → Status: "Checked"
    ↓
BM Approver (A1) receives notification
    ↓
BM Approves → Status: "BM Approved"
    ↓
    ├─ Amount > 500,000 → Operation Manager (OP) receives notification
    └─ Amount ≤ 500,000 → Branch Account (ACK) receives notification
    ↓
Operation Manager Acknowledges → Status: "Ac_Acknowledged"
    ↓
Branch Account (ACK) receives notification
    ↓
Branch Account Issues → Status: "Completed"
    ↓
Form Creator (Originator) receives notification
```

## React Implementation

### 1. Notification Service (`utils/notificationService.js`)

This service provides helper functions to:
- Get approval process users by type
- Calculate who will receive notifications
- Preview notification recipients

### 2. Notification Preview Component

Use `NotificationRecipientsPreview` component to show who will be notified:

```jsx
import NotificationRecipientsPreview from '../components/DamageForm/NotificationRecipientsPreview';

// In your form component
<NotificationRecipientsPreview
  formData={formData}
  action="create" // or "approve", "check", "acknowledge"
  approvals={approvals} // From API: /general-forms/{id}/approvals
/>
```

### 3. How to Determine Recipients (React Logic)

The component automatically calculates recipients based on:

**When Action = "create":**
- Finds approvals with `user_type = 'C'` (Checkers)
- Finds approvals with `user_type = 'A1'` (BM Approvers)

**When Action = "approve" and Status = "Checked":**
- Finds approvals with `user_type = 'A1'` (BM Approvers)

**When Action = "approve" and Status = "BM Approved":**
- If `total_amount > 500000`: Operation Manager (emp_id: '666-666666')
- If `total_amount ≤ 500000`: Approvals with `user_type = 'ACK'` (Branch Account)

**When Action = "acknowledge":**
- Finds approvals with `user_type = 'ACK'` or `'AC'` (Branch Account)

**When Action = "issue":**
- Form creator (user_id from general_form)

## Example Usage in Form Submission

```jsx
import NotificationRecipientsPreview from './NotificationRecipientsPreview';

function DamageFormLayout() {
  const [formData, setFormData] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [showNotificationPreview, setShowNotificationPreview] = useState(false);

  // Fetch approvals
  useEffect(() => {
    if (formData.generalFormId) {
      fetch(`/api/general-forms/${formData.generalFormId}/approvals`)
        .then(res => res.json())
        .then(data => setApprovals(data.data || []));
    }
  }, [formData.generalFormId]);

  // Show preview before submitting
  const handleBeforeSubmit = (action) => {
    setShowNotificationPreview(true);
  };

  return (
    <>
      {/* Show notification preview */}
      {showNotificationPreview && (
        <NotificationRecipientsPreview
          formData={formData}
          action={action}
          approvals={approvals}
          onClose={() => setShowNotificationPreview(false)}
        />
      )}
      
      {/* Your form... */}
    </>
  );
}
```

## Key Points

1. **Notifications are created automatically on the backend** when forms are submitted/approved
2. **React can preview** who will receive notifications before submission
3. **Recipients are determined by** `approval_process_users` table entries
4. **User types map to roles**: C=Checker, A1=BM, OP=Operation Manager, ACK=Branch Account

## Notification Data Structure

Notifications stored in `notifications` table contain:
```json
{
  "form_id": 1,
  "specific_form_id": 12345,
  "form_doc_no": "BDI-2024-001"
}
```

These notifications appear in:
- User's notification dropdown (bell icon)
- Form list (filtered by notification)
- API endpoint: `/api/notifications/{user_id}`
