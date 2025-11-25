import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'
import * as Y from 'yjs'

const PORT = 8080

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT })

// Store documents in memory (you can replace this with persistent storage)
const docs = new Map()

// Connection counter for logging
let connectionCounter = 0

wss.on('connection', (ws, req) => {
  const connectionId = ++connectionCounter
  console.log(`Connection ${connectionId} established from ${req.socket.remoteAddress}`)
  
  // Extract document name from URL (optional, defaults to 'default')
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const docName = url.searchParams.get('room') || 'collaborative-document'
  
  console.log(`User ${connectionId} connected to document "${docName}"`)
  
  // Get or create document
  if (!docs.has(docName)) {
    const ydoc = new Y.Doc()
    docs.set(docName, ydoc)
    console.log(`Document "${docName}" created`)
  }
  
  const ydoc = docs.get(docName)
  
  // Set up Y.js WebSocket connection
  setupWSConnection(ws, req, { 
    docName,
    doc: ydoc,
    gc: true // Enable garbage collection
  })
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`User ${connectionId} disconnected from document "${docName}" (code: ${code})`)
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