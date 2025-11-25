import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import './style.css'

// Generate a random user color for collaboration cursors
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Generate a random user name
function getRandomUserName() {
    const adjectives = ['Quick', 'Bright', 'Swift', 'Smart', 'Kind', 'Bold', 'Calm', 'Cool'];
    const nouns = ['Fox', 'Eagle', 'Wolf', 'Bear', 'Lion', 'Tiger', 'Hawk', 'Deer'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}`;
}

// Initialize Yjs document and WebSocket provider
const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:8080', 'collaborative-document', ydoc)

// User info for collaboration
const userInfo = {
    name: getRandomUserName(),
    color: getRandomColor()
}

// Update connection status
const connectionStatus = document.getElementById('connection-status')
const userCount = document.getElementById('user-count')

provider.on('status', event => {
    console.log('Connection status:', event.status)
    
    if (event.status === 'connected') {
        connectionStatus.textContent = 'Connected'
        connectionStatus.className = 'status-indicator online'
    } else {
        connectionStatus.textContent = 'Disconnected'
        connectionStatus.className = 'status-indicator offline'
    }
})

// Track connected users
provider.awareness.on('change', () => {
    const states = provider.awareness.getStates()
    const connectedUsers = states.size
    userCount.textContent = `Users: ${connectedUsers}`
})

// Set user info for awareness
provider.awareness.setLocalStateField('user', userInfo)

// Initialize TipTap editor
const editor = new Editor({
    element: document.getElementById('editor'),
    extensions: [
        StarterKit.configure({
            // Disable the default history extension since we're using Yjs
            history: false,
        }),
        Collaboration.configure({
            document: ydoc,
        }),
        CollaborationCursor.configure({
            provider: provider,
            user: userInfo,
        }),
    ],
    content: `
        <h2>Welcome to the Collaborative Editor!</h2>
        <p>Start typing to test real-time collaboration. Open this page in multiple tabs or browsers to see the magic happen!</p>
        <p>Your username: <strong>${userInfo.name}</strong></p>
        <p>Try these features:</p>
        <ul>
            <li><strong>Bold text</strong> - Ctrl/Cmd + B</li>
            <li><em>Italic text</em> - Ctrl/Cmd + I</li>
            <li>Lists and headings</li>
            <li>Real-time cursor positions</li>
        </ul>
    `,
    autofocus: true,
    editable: true,
    injectCSS: false,
})

// Handle editor events
editor.on('create', () => {
    console.log('Editor created successfully')
})

editor.on('update', () => {
    console.log('Editor content updated')
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (editor) {
        editor.destroy()
    }
    if (provider) {
        provider.destroy()
    }
})
