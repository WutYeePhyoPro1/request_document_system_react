# Multi-Language Support (i18n) Usage Guide

This project uses `react-i18next` for internationalization (i18n) support with English and Burmese languages.

## Setup

The i18n system is already configured and initialized in `src/main.jsx`. The configuration file is located at `src/i18n/config.js`.

## Translation Files

Translation files are located in:
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/my.json` - Burmese (Myanmar) translations

## How to Use Translations in Components

### 1. Import the `useTranslation` hook

```jsx
import { useTranslation } from "react-i18next";
```

### 2. Use the `t` function in your component

```jsx
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### 3. Translation Key Structure

Translation keys are organized by namespace and category:
- `common.*` - Common UI elements (buttons, labels, etc.)
- `investigation.*` - Investigation form related
- `damageForm.*` - Damage form related
- `approval.*` - Approval section related
- `status.*` - Status labels
- `messages.*` - Success/error messages

### Examples

```jsx
// Simple translation
{t('common.save')}  // "Save" or "သိမ်းဆည်းရန်"

// With namespace (if using multiple namespaces)
{t('common:save')}

// Translation with interpolation (for dynamic values)
{t('investigation.percentagesMustTotal', { total: 95.5 })}
// Result: "percentages must total 100%. Currently 95.50%."
```

## Language Switcher Component

A `LanguageSwitcher` component is available at `src/components/LanguageSwitcher.jsx`. You can add it to your navbar or anywhere in your app:

```jsx
import LanguageSwitcher from './components/LanguageSwitcher';

function Navbar() {
  return (
    <nav>
      {/* Other navbar content */}
      <LanguageSwitcher />
    </nav>
  );
}
```

## Adding New Translations

### 1. Add to English file (`en.json`)

```json
{
  "common": {
    "myNewKey": "My New Text"
  }
}
```

### 2. Add to Burmese file (`my.json`)

```json
{
  "common": {
    "myNewKey": "ကျွန်ုပ်၏ စာသားအသစ်"
  }
}
```

### 3. Use in component

```jsx
{t('common.myNewKey')}
```

## Programmatically Change Language

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const changeToBurmese = () => {
    i18n.changeLanguage('my');
  };
  
  const changeToEnglish = () => {
    i18n.changeLanguage('en');
  };
  
  return (
    <div>
      <button onClick={changeToEnglish}>English</button>
      <button onClick={changeToBurmese}>မြန်မာ</button>
    </div>
  );
}
```

## Get Current Language

```jsx
const { i18n } = useTranslation();
const currentLanguage = i18n.language; // 'en' or 'my'
```

## Language Persistence

The selected language is automatically saved to `localStorage` and will persist across page refreshes.

## Best Practices

1. **Always use translation keys** - Don't hardcode text strings
2. **Use descriptive keys** - `investigation.bmReasonRequired` is better than `error1`
3. **Group related translations** - Use namespaces like `investigation.*`, `damageForm.*`
4. **Keep translations consistent** - Use the same key for the same concept across the app
5. **Update both languages** - Always add translations to both `en.json` and `my.json`

## Example: Complete Component with Translations

```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

function MyForm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    if (!name) {
      toast.error(t('messages.pleaseFillRequired'));
      return;
    }
    
    toast.success(t('messages.formCreated'));
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <label>{t('common.name')}</label>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder={t('common.enterName')}
      />
      <button type="submit">{t('common.submit')}</button>
    </form>
  );
}
```

## Troubleshooting

### Translation not showing
- Check if the key exists in both `en.json` and `my.json`
- Verify the key path is correct (e.g., `common.save` not `commonSave`)
- Check browser console for i18n errors

### Language not persisting
- Check if `localStorage` is enabled in browser
- Verify `i18n.config.js` has `detection.caches: ['localStorage']`

### Missing translations
- Add the missing key to both language files
- The system will fallback to English if a key is missing

