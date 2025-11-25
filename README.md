# Collaborative Editor MVP

A lightweight collaborative text editor built with TipTap and Yjs for real-time synchronization. Perfect for testing collaborative editing functionality.

## Features

- **Real-time collaboration**: Multiple users can edit simultaneously
- **Live cursors**: See where other users are typing
- **Rich text editing**: Bold, italic, headings, lists, and more
- **WebSocket-based**: Fast and reliable synchronization
- **Simple UI**: Clean, focused interface for testing

## Technology Stack

- **Frontend**: Vanilla HTML/JavaScript with TipTap editor and Vite bundler
- **Backend**: Node.js with Hocuspocus server (TipTap's recommended WebSocket solution)
- **Synchronization**: Yjs with HocuspocusProvider
- **Build Tool**: Vite for fast development and ES module bundling
- **Styling**: Pure CSS for clean, responsive design

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start both the Hocuspocus server and Vite dev server:
```bash
npm start
```

This will:
- Start the Hocuspocus WebSocket server on `ws://localhost:8080`  
- Start the Vite dev server on `http://localhost:3000`
- Automatically open your browser

Alternatively, you can run them separately:
```bash
# Terminal 1 - Start the WebSocket server
npm run server

# Terminal 2 - Start the frontend dev server  
npm run dev
```

### Testing Collaboration

1. Open your browser and go to `http://localhost:3000`
2. Open the same URL in multiple browser tabs or different browsers
3. Start typing in one tab and watch the changes appear in real-time in other tabs
4. Notice the collaborative cursors showing where other users are editing

## Project Structure

```
collaborative-editor/
├── package.json           # Node.js dependencies and scripts
├── vite.config.js         # Vite bundler configuration
├── server.js              # Hocuspocus WebSocket server
├── index.html             # Main HTML page (Vite entry point)
├── src/
│   ├── main.js            # Client-side JavaScript with ES6 imports
│   └── style.css          # Styling for the editor
└── README.md              # This file
```

## How It Works

1. **Server**: Hocuspocus server handles WebSocket connections and Yjs document synchronization
2. **Client**: Vite serves the frontend and bundles ES modules; each browser tab connects to Hocuspocus via WebSocket
3. **Synchronization**: All changes are synchronized in real-time through Yjs and the HocuspocusProvider
4. **Collaboration**: Users see each other's cursors and changes instantly with conflict-free resolution

## Customization

### Adding New TipTap Extensions

Edit `src/main.js` and add extensions to the `extensions` array:

```javascript
// First import the extension
import NewExtension from '@tiptap/extension-new-extension'

// Then add to extensions array
extensions: [
    StarterKit.configure({
        history: false,
    }),
    NewExtension,  // Add your extensions here
    Collaboration.configure({
        document: ydoc,
    }),
    CollaborationCursor.configure({
        provider: provider,
        user: userInfo,
    }),
],
```

### Changing the Ports

- **Frontend (Vite)**: Modify `vite.config.js` to change the dev server port (default: 3000)
- **Backend (Hocuspocus)**: Modify `server.js` to change the WebSocket port (default: 8080)

```javascript
// In vite.config.js
server: {
  port: 4000  // Change frontend port
}

// In server.js  
const server = new HocuspocusServer({
  port: 9000,  // Change WebSocket port
})
```

### Styling

Modify `src/style.css` to customize the appearance of the editor.

## Development Notes

- Documents are stored in memory and will be lost when the server restarts
- The server uses CORS headers for development convenience
- User names and colors are randomly generated for each session
- The editor supports standard keyboard shortcuts (Ctrl/Cmd + B for bold, etc.)

## Troubleshooting

### Connection Issues

- Make sure the server is running on port 3000
- Check that no firewall is blocking the WebSocket connection
- Verify the WebSocket URL in `app.js` matches your server address

### Editor Not Loading

- Check the browser console for JavaScript errors
- Ensure all CDN resources are loading properly
- Verify that the `public` directory contains all required files

## Next Steps for Production

- Add document persistence (database or file system)
- Implement user authentication
- Add document management (create, save, load documents)
- Implement proper error handling and reconnection logic
- Add more TipTap extensions for richer editing
- Deploy to a cloud platform

## License

MIT License - feel free to use this code for your own projects!
