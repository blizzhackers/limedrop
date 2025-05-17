# LimeDrop

A modern web interface for managing, searching, and automating item drops in Diablo II. Built with React, Vite, and TypeScript, LimeDrop provides a fast, user-friendly experience for bot-assisted item management and drop queueing.

---

## Features

- **Account & Character Management**: View, filter, and manage multiple accounts and characters.
- **Inventory Search & Filtering**: Fast, natural sorting and advanced filtering by quality, account, and character.
- **Drop Queue**: Add items to a drop list and initiate secure, automated drops with game name/password.
- **Recent Drops**: Track and review recent drop actions.
- **Responsive UI**: Mobile-friendly sidebar, topbar, and inventory grid.
- **Session Management**: Secure login, session validation, and error handling.
- **Polling & Automation**: Efficient polling for game actions with automatic session recovery.
- **Modern Stack**: Built with React, Zustand, TanStack Form, Vite, and TypeScript.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or newer recommended)
- [pnpm](https://pnpm.io/)

### Installation

```sh
# Clone the repository
$ git clone https://github.com/blizzhackers/limedrop.git
$ cd limedrop

# Install dependencies
$ pnpm install
```

### Development

```sh
# Start the development server
$ pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Production Build

```sh
# Build the app for production
$ pnpm build

# Preview the production build
$ pnpm preview
```

---

## Usage

1. **Connect to D2Bot API**: Ensure your D2Bot API server is running and accessible (default: `http://localhost:8080`).
2. **Login**: Enter your API URL, username, and password in the login dialog.
3. **Browse Inventory**: Use the sidebar to filter by realm, account, character, and item quality.
4. **Search**: Use the topbar search to find items quickly.
5. **Drop Items**: Add items to your cart, then use the drop form to specify game name and password (max 15 alphanumeric chars each) and initiate a drop.
6. **Recent Drops**: View your recent drop history for auditing and review.

---

## Project Structure

```
├── public/                # Static assets (favicon, logos)
├── src/
│   ├── components/        # React UI components
│   ├── lib/               # API, utilities, and workers
│   ├── stores/            # Zustand state management
│   ├── assets/            # App images and SVGs
│   └── ...
├── index.html             # Main HTML entry
├── vite.config.ts         # Vite configuration
├── package.json           # Project metadata and scripts
└── README.md              # This file
```

---

## Configuration & Deployment

- **Vite Base Path**: If deploying to a subdirectory or using static hosting, set `base: './'` in `vite.config.ts`.
- **Static Assets**: Place custom images in `public/` or `src/assets/` and reference them with relative paths.
- **API Server**: The app expects a D2Bot-compatible API at the configured URL. CORS and session management are handled by the backend.

---

## Troubleshooting

- **CORS Issues**: If you see CORS errors, you must use a proxy or ensure your backend allows cross-origin requests. See the README or docs for proxy setup.
- **Static Asset 404s**: If assets fail to load after build, ensure you are serving the `dist/` folder with a static server and that all asset paths are relative.
- **Session Expiry**: If your session expires, simply log in again. The app will automatically handle most session errors.
- **API Connection**: Make sure your API server is running and accessible from your browser (check firewall and network settings).

---

## License

[MIT](LICENSE)

---
