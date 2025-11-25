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

// Get room name from URL parameters or default to 'default'
function getRoomNameFromURL() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('room') || 'default'
}

// Global variables for dynamic connections
let ydoc = new Y.Doc()
let provider = null
let editor = null
let currentRoom = getRoomNameFromURL()

// Initialize connection to a room
function connectToRoom(roomName) {
    // Clean up existing provider if it exists
    if (provider) {
        provider.destroy()
    }
    
    // Create new provider for the room
    provider = new WebsocketProvider('ws://localhost:8080', roomName, ydoc)
    
    return provider
}

// User info for collaboration (persistent across room switches)
const userInfo = {
    name: getRandomUserName(),
    color: getRandomColor()
}

// DOM elements
const connectionStatus = document.getElementById('connection-status')
const userCount = document.getElementById('user-count')
const roomNameElement = document.getElementById('room-name')
const roomInput = document.getElementById('room-input')
const joinRoomBtn = document.getElementById('join-room-btn')

// Set up provider event listeners
function setupProviderListeners(provider) {
    provider.on('status', event => {
        console.log(`Connection status for room "${currentRoom}":`, event.status)
        
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
}

// Update room display
function updateRoomDisplay(roomName) {
    roomNameElement.textContent = roomName
    currentRoom = roomName
    
    // Update URL without page reload
    const newUrl = new URL(window.location)
    if (roomName === 'default') {
        newUrl.searchParams.delete('room')
    } else {
        newUrl.searchParams.set('room', roomName)
    }
    window.history.pushState({}, '', newUrl)
}

// Join a room (switch rooms)
function joinRoom(roomName) {
    if (!roomName || roomName.trim() === '') {
        alert('Please enter a room name')
        return
    }
    
    roomName = roomName.trim()
    
    if (roomName === currentRoom) {
        console.log(`Already in room "${roomName}"`)
        return
    }
    
    console.log(`Switching from room "${currentRoom}" to "${roomName}"`)
    
    // Create new document for the new room
    ydoc = new Y.Doc()
    
    // Connect to the new room
    provider = connectToRoom(roomName)
    setupProviderListeners(provider)
    
    // Update the editor's collaboration configuration
    if (editor) {
        editor.destroy()
    }
    
    initializeEditor()
    updateRoomDisplay(roomName)
    
    // Clear the room input
    roomInput.value = ''
    
    console.log(`Successfully joined room "${roomName}"`)
}

// Initialize TipTap editor
function initializeEditor() {
    editor = new Editor({
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
            <p>You are in room: <strong>${currentRoom}</strong></p>
            <p>Start typing to test real-time collaboration. Share the room name with others to collaborate!</p>
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
        console.log(`Editor created successfully for room "${currentRoom}"`)
    })

    editor.on('update', () => {
        console.log('Editor content updated')
    })
}

// Initialize the application
function initializeApp() {
    // Connect to initial room
    provider = connectToRoom(currentRoom)
    setupProviderListeners(provider)
    
    // Initialize editor
    initializeEditor()
    
    // Update room display
    updateRoomDisplay(currentRoom)
    
    // Set up event listeners
    joinRoomBtn.addEventListener('click', () => {
        const roomName = roomInput.value
        joinRoom(roomName)
    })
    
    // Allow Enter key to join room
    roomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const roomName = roomInput.value
            joinRoom(roomName)
        }
    })
    
    console.log(`Application initialized in room "${currentRoom}"`)
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (editor) {
        editor.destroy()
    }
    if (provider) {
        provider.destroy()
    }
})

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp()
})
