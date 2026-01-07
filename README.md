# Request Document System - React Frontend

This is the React frontend application for the Request Document System, built with React, Vite, and Redux.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variable:

```env
VITE_API_URL=http://localhost:8000
```

**Note:** 
- Replace `8000` with the port your Laravel backend is running on (default is 8000)
- If `VITE_API_URL` is not set, the app will default to `http://localhost:8000`
- Make sure your Laravel backend is running before starting the frontend

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Proxy Configuration

The Vite dev server is configured to proxy all `/api/*` requests to your Laravel backend. The proxy configuration can be found in `vite.config.js`.

If you need to change the backend URL:
1. Update the `VITE_API_URL` in your `.env` file
2. Restart the dev server

## Troubleshooting

### 404 Error on API Requests

If you're getting 404 errors when making API requests:
1. Check that your Laravel backend is running
2. Verify the `VITE_API_URL` in your `.env` matches your backend URL
3. Ensure the backend is accessible at the configured URL
4. Restart the Vite dev server after changing environment variables

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
