# 🔔 Push Notifications Implementation Guide

## Overview

This system enables **real-time push notifications** that work even when the website is closed! Users will receive notifications on their desktop or mobile device instantly when:
- A new form is created (Checkers receive notification)
- A form is checked (Form creator receives notification)
- A form is approved (Form creator receives notification)

## 🎯 How It Works

### 1. **User Perspective**

1. User logs into the system
2. After 5 seconds, a popup appears asking to enable notifications
3. User clicks "Enable" → Browser asks for permission
4. User grants permission → Push notifications are now enabled!
5. User can now **close the website** and still receive notifications

### 2. **Technical Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ USER ENABLES NOTIFICATIONS                                  │
│ ✓ Browser requests permission                               │
│ ✓ Service Worker subscribes to push service                │
│ ✓ Subscription saved to database (push_subscriptions table)│
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FORM CREATED (Backend)                                      │
│ ✓ Find all checkers (role_id = 2) assigned to form        │
│ ✓ Send database notification                               │
│ ✓ Send push notification to checker's device              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PUSH NOTIFICATION RECEIVED                                  │
│ ✓ Browser/OS shows notification (even if site is closed)  │
│ ✓ User clicks notification → Opens form directly          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Features Implemented

### ✅ Frontend
- **PushNotificationManager** component that:
  - Checks if notifications are supported
  - Requests user permission elegantly
  - Subscribes to push service
  - Saves subscription to backend
  - Shows test notification on success
  - Auto-dismisses and re-prompts after 1 hour if declined

- **Enhanced Service Worker** (`sw.js`) that:
  - Handles incoming push notifications
  - Shows rich notifications with icon and badge
  - Handles notification clicks
  - Opens existing tabs or creates new ones
  - Supports action buttons (Open/Dismiss)

### ✅ Backend
- **sendCreatorNotification()** function enhanced to send:
  - Database notification (for in-app bell icon)
  - Push notification (for device notifications)
  
- **Push notification for Checkers** when form is created:
  - Only sends to users with `role_id = 2` (Checker)
  - Does NOT send to Supervisors (`role_id = 10`)
  
- **Push notification for Creators** when form is checked/approved

## 📱 Testing Instructions

### Step 1: Enable Notifications

1. **Login to the system**
2. **Wait 5 seconds** - A popup will appear at bottom-right
3. **Click "Enable"** button
4. **Grant permission** when browser asks
5. **See test notification**: "Notifications Enabled!"

### Step 2: Test with Real Form

#### As a Staff Member:
1. Create a new Big Damage Issue form
2. Submit the form
3. Backend sends notification to assigned checker

#### As a Checker (role_id = 2):
1. You should receive a push notification immediately
2. Notification shows: "[Creator Name] ([Role]) created form [DOC-NUMBER]"
3. Click the notification → Opens the form directly

#### With Website Closed:
1. **Close all browser tabs** (or close the browser completely)
2. Have someone create a form
3. **You still receive the notification!** 🎉
4. Click it → Browser opens and navigates to the form

### Step 3: Verify in Database

```bash
# Check if subscription was saved
cd /var/www/html/code/requestDocumentSystem && php artisan tinker
```

Then run:
```php
// Check subscriptions
$subscriptions = App\Models\PushSubscription::all();
foreach ($subscriptions as $sub) {
    echo "User: {$sub->user_id}, Role: {$sub->role}, Emp: {$sub->emp_id}\n";
}
```

## 🔧 Configuration

### VAPID Keys (Already Configured)

The system uses VAPID keys for authentication:

```env
VAPID_PUBLIC_KEY=BCPKeVfYglhfqpsmmQXv-MP7oihVtZiVzRUXkVxojeQgAlGOWB07YI77J-A8awLcqv4ZKNPHVFQimsrutIIeRhM
VAPID_PRIVATE_KEY=eKgHDO5_5S6Uep7j1Vm9UdJUOiwe1OkzLPSMusWXA5g
VAPID_SUBJECT=mailto:your@email.com
```

### To Generate New Keys (if needed):

```bash
php artisan webpush:vapid
```

## 🐛 Troubleshooting

### Issue: No notification popup appears

**Solution:**
- Check browser console for errors
- Verify service worker is registered: `navigator.serviceWorker.controller`
- Check if notifications are blocked in browser settings

### Issue: Permission denied

**Solution:**
1. Click the lock icon in browser address bar
2. Reset notifications permission
3. Refresh the page
4. Try again

### Issue: Notification received but doesn't work when clicked

**Solution:**
- Check service worker console: `chrome://serviceworker-internals/`
- Verify the URL in notification data is correct
- Check browser console for navigation errors

### Issue: Push notification not received even though subscribed

**Solution:**
1. Check logs:
   ```bash
   tail -f storage/logs/laravel.log | grep "PUSH NOTIFICATION"
   ```

2. Verify subscription exists:
   ```php
   $user = App\Models\User::find(YOUR_USER_ID);
   $subs = App\Models\PushSubscription::where('user_id', $user->id)->get();
   ```

3. Test manually:
   ```php
   $user = App\Models\User::find(YOUR_USER_ID);
   $role = \Spatie\Permission\Models\Role::find($user->role_id);
   sendPushNotification(
       $role->name, 
       $user->emp_id, 
       'Test', 
       'This is a test notification', 
       'https://carmgmt.sdpghc.net'
   );
   ```

## 📊 Database Schema

### `push_subscriptions` Table

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | User ID |
| role | string | User role name |
| emp_id | string | Employee number |
| endpoint | text | Push service endpoint |
| publicKey | text | P256DH key |
| authToken | text | Auth token |
| created_at | timestamp | Subscription date |

## 🎨 Notification Customization

### Modify Notification Appearance

Edit `/var/www/html/code/request_document_system_react/public/sw.js`:

```javascript
const options = {
    body: notificationData.body,
    icon: '/PRO1logo.png',        // Change icon
    badge: '/PRO1logo.png',       // Change badge
    vibrate: [200, 100, 200],     // Change vibration pattern
    requireInteraction: false,     // Auto-dismiss time
    tag: 'form-notification',     // Grouping tag
    // Add more options...
};
```

### Modify Notification Timing

Edit `/var/www/html/code/request_document_system_react/src/components/common/PushNotificationManager.jsx`:

```javascript
// Show prompt after 5 seconds (change this)
const timer = setTimeout(() => {
    if (Notification.permission === 'default' && !isSubscribed) {
        setShowPrompt(true);
    }
}, 5000); // Change to desired milliseconds
```

## 🌐 Browser Support

### Fully Supported:
- ✅ Chrome 50+ (Desktop & Android)
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Opera 37+
- ✅ Samsung Internet 4+

### Not Supported:
- ❌ iOS Safari (Apple doesn't support Web Push on iOS yet)
- ❌ Internet Explorer

## 📈 Future Enhancements

Possible improvements:
1. **Notification Preferences**: Let users choose which notifications to receive
2. **Quiet Hours**: Don't send notifications during specific hours
3. **Notification History**: Show all past notifications
4. **Rich Notifications**: Add images, buttons, and more interactive elements
5. **Notification Sounds**: Custom sounds for different notification types

## 🔐 Security

- **VAPID Keys**: Secure authentication between server and push service
- **User Consent**: Users must explicitly grant permission
- **Endpoint Privacy**: Push subscription endpoints are encrypted
- **Server-side Validation**: All notifications verified before sending

## 📝 Summary

✅ **Push notifications work even when website is closed**
✅ **Only Checkers (role_id=2) receive "form created" notifications**  
✅ **Form creators receive "checked" and "approved" notifications**  
✅ **Elegant user prompting with auto-retry**  
✅ **Rich notifications with icons and actions**  
✅ **Automatic subscription management**  
✅ **Comprehensive error handling and logging**  

🎉 **The system is production-ready!**
