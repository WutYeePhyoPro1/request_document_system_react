# Notification System & Unread Badge Visibility Documentation

## Overview
The notification system filters notifications and unread badges based on user roles and form status. Users only see notifications and badges for forms that require their action.

## Role-Based Notification & Badge Visibility Table

| User Role | User Type | Form Status | Notification Shown? | Unread Badge Shown? | When Badge Disappears |
|-----------|-----------|-------------|---------------------|---------------------|----------------------|
| **Checker** | C, CS | Ongoing | ✅ Yes | ✅ Yes | When form is checked (status becomes "Checked" or higher) |
| **Checker** | C, CS | Checked | ❌ No | ❌ No | N/A - Not relevant to checker |
| **Checker** | C, CS | BM Approved | ❌ No | ❌ No | N/A - Not relevant to checker |
| **Checker** | C, CS | OP Approved | ❌ No | ❌ No | N/A - Not relevant to checker |
| **Checker** | C, CS | Acknowledged | ❌ No | ❌ No | N/A - Not relevant to checker |
| **Checker** | C, CS | Completed/Issued | ❌ No | ❌ No | N/A - Not relevant to checker |
| | | | | | |
| **Branch Manager (BM)** | A1, BM, ABM | Ongoing | ❌ No | ❌ No | N/A - Not relevant to BM |
| **Branch Manager (BM)** | A1, BM, ABM | Checked | ✅ Yes | ✅ Yes | When BM approves the form (status becomes "BM Approved" or higher) |
| **Branch Manager (BM)** | A1, BM, ABM | BM Approved | ❌ No | ❌ No | N/A - Already approved by BM |
| **Branch Manager (BM)** | A1, BM, ABM | OP Approved | ❌ No | ❌ No | N/A - Not relevant to BM |
| **Branch Manager (BM)** | A1, BM, ABM | Acknowledged | ❌ No | ❌ No | N/A - Not relevant to BM |
| **Branch Manager (BM)** | A1, BM, ABM | Completed/Issued | ❌ No | ❌ No | N/A - Not relevant to BM |
| | | | | | |
| **Operation Manager** | A2 | Ongoing | ❌ No | ❌ No | N/A - Not relevant to OP Manager |
| **Operation Manager** | A2 | Checked | ❌ No | ❌ No | N/A - Not relevant to OP Manager |
| **Operation Manager** | A2 | BM Approved | ✅ Yes | ✅ Yes | When OP Manager approves (status becomes "OP Approved" or higher) |
| **Operation Manager** | A2 | OP Approved | ❌ No | ❌ No | N/A - Already approved by OP Manager |
| **Operation Manager** | A2 | Acknowledged | ❌ No | ❌ No | N/A - Not relevant to OP Manager |
| **Operation Manager** | A2 | Completed/Issued | ❌ No | ❌ No | N/A - Not relevant to OP Manager |
| | | | | | |
| **Branch Account** | AC, Account | Ongoing | ❌ No | ❌ No | N/A - Not relevant to Account |
| **Branch Account** | AC, Account | Checked | ❌ No | ❌ No | N/A - Not relevant to Account |
| **Branch Account** | AC, Account | BM Approved | ✅ Yes | ✅ Yes | When Account acknowledges (status becomes "Acknowledged" or higher) |
| **Branch Account** | AC, Account | OP Approved | ✅ Yes | ✅ Yes | When Account acknowledges (status becomes "Acknowledged" or higher) |
| **Branch Account** | AC, Account | Acknowledged | ✅ Yes | ✅ Yes | When Account issues the form (status becomes "Completed/Issued") |
| **Branch Account** | AC, Account | Completed/Issued | ❌ No | ❌ No | N/A - Already completed |

## How It Works

### 1. Notification Filtering (Backend → Frontend)

**Location**: `Dashboard.jsx` and `Navbar.jsx`

- Notifications are fetched from the API
- Each notification is checked against the user's role and the form's status
- Only notifications matching the role requirements are counted/displayed
- The notification count in the navbar bell icon only shows relevant notifications

**Filtering Logic**:
```javascript
shouldShowNotificationForRole(user, formStatus) {
  // Checker: Only "Ongoing" forms
  // BM: Only "Checked" forms
  // OP Manager: Only "BM Approved" forms
  // Account: Only "BM Approved", "OP Approved", and "Acknowledged" forms
}
```

### 2. Unread Badge (Speech Icon) Display

**Location**: `DamageIssueList.jsx`

The red speech bubble icon appears when:
- ✅ Form status matches user's role requirements
- ✅ User has NOT completed their required action
- ✅ Form is NOT marked as viewed
- ✅ Form is NOT in completed state (Completed/Issued)
- ✅ No notification count badge is shown (to avoid duplication)

**Badge Disappears When**:
- User completes their required action (e.g., Checker checks, BM approves)
- Form is marked as viewed
- Form reaches final completed state
- Form status doesn't match role requirements

### 3. Notification Count Badge (Red Number Badge)

**Location**: `DamageIssueList.jsx`

The red number badge appears when:
- ✅ Form has unread notifications
- ✅ Form status matches user's role requirements
- ✅ Notifications are filtered by role at the source (Dashboard/Navbar)

**Badge Disappears When**:
- All notifications are marked as read (after user completes action)
- Form status doesn't match role requirements

### 4. Notification Marking as Read

**Location**: `DamageFormLayout.jsx`

Notifications are marked as read when:
- User completes a button action (Check, Approve, Acknowledge, Issue)
- API call to `/api/notifications/mark-as-read` is made
- Custom event `notificationsUpdated` is dispatched
- Navbar refreshes notification count

**Important**: Notifications are NOT marked as read when:
- User merely views the form
- User opens the form without taking action

## Workflow Examples

### Example 1: Checker Workflow
1. Form created → Status: "Ongoing"
2. Checker sees notification (1) and unread badge ✅
3. Checker views form → Badge still visible ✅
4. Checker clicks "Check" button → Form status: "Checked"
5. Notification marked as read → Badge disappears ✅
6. BM now sees notification for this form ✅

### Example 2: Branch Manager Workflow
1. Form checked → Status: "Checked"
2. BM sees notification (1) and unread badge ✅
3. BM views form → Badge still visible ✅
4. BM clicks "Approve" button → Form status: "BM Approved"
5. Notification marked as read → Badge disappears ✅
6. OP Manager (if amount > 500k) or Account now sees notification ✅

### Example 3: Branch Account Workflow
1. Form BM Approved → Status: "BM Approved"
2. Account sees notification (1) and unread badge ✅
3. Account views form → Badge still visible ✅
4. Account clicks "Acknowledge" button → Form status: "Acknowledged"
5. Notification marked as read → Badge disappears ✅
6. Account sees new notification for "Acknowledged" status ✅
7. Account clicks "Issue" button → Form status: "Completed"
8. All badges disappear ✅

## Key Implementation Details

### Helper Function: `isFormRelevantToUser(gf)`
**Location**: `DamageIssueList.jsx`

This function determines if a form is relevant to the current user based on:
- User's role/user_type
- Form's current status

Returns `true` only if the form requires action from the current user.

### Notification Count Filtering
**Location**: `Dashboard.jsx` - `notificationCountsByForm`

- Creates a map of form IDs to notification counts
- Only counts notifications for forms relevant to the user's role
- Uses `shouldShowNotificationForRole()` to filter

### Navbar Notification Filtering
**Location**: `Navbar.jsx`

- Filters notifications when displaying count
- Only shows notifications for relevant forms
- Updates in real-time when `notificationsUpdated` event is dispatched

## Edge Cases Handled

1. **Multiple Notifications**: If a form has multiple notifications, the count badge shows the total (e.g., "3")
2. **Form Status Changes**: When form status changes, badges automatically update based on new status
3. **User Role Changes**: If user role changes, badges update to reflect new role requirements
4. **Completed Forms**: No badges shown for completed forms regardless of role
5. **Viewed but Not Acted**: Badge remains visible until action is completed, not just viewed

## Testing Checklist

- [ ] Checker sees badge only for "Ongoing" forms
- [ ] BM sees badge only for "Checked" forms (NOT Ongoing)
- [ ] OP Manager sees badge only for "BM Approved" forms
- [ ] Account sees badge for "BM Approved", "OP Approved", and "Acknowledged" forms (NOT Ongoing)
- [ ] Badge disappears after user completes their action
- [ ] Badge does NOT disappear when user only views the form
- [ ] Notification count in navbar matches badge visibility
- [ ] Notification count updates after action is completed

