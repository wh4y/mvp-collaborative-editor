import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'
import * as Y from 'yjs'

const PORT = 8080

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT })

// Store documents and room metadata in memory
const docs = new Map()
const roomMetadata = new Map()
const roomCleanupTimers = new Map()

// Connection counter for logging
let connectionCounter = 0

// Room cleanup delay (5 minutes)
const CLEANUP_DELAY = 5 * 60 * 1000 // 300000 milliseconds

// Initialize room metadata
function initializeRoom(docName) {
  if (!roomMetadata.has(docName)) {
    roomMetadata.set(docName, {
      createdAt: new Date(),
      lastActivity: new Date(),
      userCount: 0,
      connections: new Set()
    })
    console.log(`Room "${docName}" metadata initialized`)
  }
}

// Update room activity
function updateRoomActivity(docName) {
  const metadata = roomMetadata.get(docName)
  if (metadata) {
    metadata.lastActivity = new Date()
  }
}

// Schedule room cleanup
function scheduleRoomCleanup(docName) {
  // Cancel existing cleanup timer if it exists
  if (roomCleanupTimers.has(docName)) {
    clearTimeout(roomCleanupTimers.get(docName))
  }
  
  const timer = setTimeout(() => {
    const metadata = roomMetadata.get(docName)
    if (metadata && metadata.userCount === 0) {
      console.log(`Cleaning up empty room "${docName}" after inactivity`)
      
      // Dispose of the document
      const ydoc = docs.get(docName)
      if (ydoc) {
        ydoc.destroy()
        docs.delete(docName)
      }
      
      // Clean up metadata and timer
      roomMetadata.delete(docName)
      roomCleanupTimers.delete(docName)
      
      console.log(`Room "${docName}" has been cleaned up and removed from memory`)
    }
  }, CLEANUP_DELAY)
  
  roomCleanupTimers.set(docName, timer)
  console.log(`Scheduled cleanup for room "${docName}" in ${CLEANUP_DELAY / 1000} seconds`)
}

// Cancel room cleanup
function cancelRoomCleanup(docName) {
  if (roomCleanupTimers.has(docName)) {
    clearTimeout(roomCleanupTimers.get(docName))
    roomCleanupTimers.delete(docName)
    console.log(`Cancelled cleanup timer for room "${docName}"`)
  }
}

wss.on('connection', (ws, req) => {
  const connectionId = ++connectionCounter
  console.log(`Connection ${connectionId} established from ${req.socket.remoteAddress}`)
  
  // Extract document name from URL (optional, defaults to 'default')
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const docName = url.pathname.split('/').pop() || 'default'
  
  console.log(`User ${connectionId} connected to room "${docName}"`)
  
  // Initialize room if it doesn't exist
  initializeRoom(docName)
  
  // Get or create document
  if (!docs.has(docName)) {
    const ydoc = new Y.Doc()
    docs.set(docName, ydoc)
    console.log(`Document "${docName}" created`)
  }
  
  const ydoc = docs.get(docName)
  const metadata = roomMetadata.get(docName)
  
  // Add connection to room and update user count
  metadata.connections.add(connectionId)
  metadata.userCount = metadata.connections.size
  updateRoomActivity(docName)
  
  // Cancel any pending cleanup since someone joined
  cancelRoomCleanup(docName)
  
  console.log(`Room "${docName}" now has ${metadata.userCount} user(s)`)
  
  // Set up Y.js WebSocket connection
  setupWSConnection(ws, req, { 
    docName,
    doc: ydoc,
    gc: true // Enable garbage collection
  })
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`User ${connectionId} disconnected from room "${docName}" (code: ${code})`)
    
    // Remove connection from room
    if (metadata.connections.has(connectionId)) {
      metadata.connections.delete(connectionId)
      metadata.userCount = metadata.connections.size
      updateRoomActivity(docName)
      
      console.log(`Room "${docName}" now has ${metadata.userCount} user(s)`)
      
      // If room is empty, schedule cleanup
      if (metadata.userCount === 0) {
        console.log(`Room "${docName}" is now empty, scheduling cleanup`)
        scheduleRoomCleanup(docName)
      }
    }
  })
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for connection ${connectionId}:`, error)
  })
})

wss.on('listening', () => {
  console.log(`Y.js WebSocket server running on ws://localhost:${PORT}`)
  console.log('WebSocket server ready for collaborative editing')
  console.log(`Documents are stored in memory and will persist during server runtime`)
})

wss.on('error', (error) => {
  console.error('WebSocket server error:', error)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket server...')
  wss.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down WebSocket server...')
  wss.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})