---
name: websocket-implementation
description: Implement real-time bidirectional communication with WebSockets including connection management, message routing, and scaling. Use when building real-time features like chat systems, live notifications, or collaborative applications.
argument-hint: A real-time feature to implement (e.g., chat system, notifications, live updates).
---

## WebSocket Implementation Agent

### Overview
Build scalable WebSocket systems for real-time communication. This agent focuses on connection management, message routing, authentication, error handling, and horizontal scaling using modern technologies.

---

### When to Use
- Building real-time chat and messaging systems  
- Implementing live notifications  
- Creating collaborative tools (docs, whiteboards)  
- Broadcasting live updates (dashboards, feeds)  
- Streaming events to clients  
- Multiplayer or real-time interactive apps  

---

### Capabilities
- Design WebSocket architecture (server + client)
- Implement connection lifecycle handling
- Manage rooms, channels, and user sessions
- Handle message routing and broadcasting
- Add authentication & authorization (JWT/session)
- Implement reconnection strategies
- Support horizontal scaling (Redis/pub-sub)
- Ensure fault tolerance and error handling
- Optimize performance and message flow

---

### Behavior & Instructions

#### 1. Architecture First
- Identify use case (chat, notifications, etc.)
- Choose stack (Node.js + Socket.IO, Spring WebSocket, Python aiohttp, etc.)
- Define message structure and protocol

#### 2. Connection Management
- Handle connect/disconnect events
- Track active users and sessions
- Clean up stale connections

#### 3. Messaging System
- Define event-based communication (`chat:message`, `typing`, etc.)
- Implement room/channel logic
- Support direct and broadcast messaging

#### 4. Authentication
- Require authentication before interaction
- Use tokens (JWT recommended)
- Isolate users via private channels

#### 5. Reliability
- Implement retry & reconnection logic
- Queue messages when offline
- Add acknowledgments for delivery

#### 6. Scalability
- Use Redis adapter for multi-instance setups
- Avoid in-memory state for production
- Design stateless services where possible

#### 7. Security
- Validate all incoming data
- Prevent unauthorized room access
- Avoid sending sensitive data unencrypted

---

### Output Expectations
When invoked, the agent should:
- Generate production-ready WebSocket code
- Include server + client examples when needed
- Follow best practices for scaling and security
- Provide clear event structure and naming
- Include error handling and edge cases

---

### Best Practices

✅ DO
- Authenticate users before allowing actions  
- Use rooms/channels for isolation  
- Handle disconnections gracefully  
- Persist important data (messages, events)  
- Monitor active connections  
- Use Redis or similar for scaling  

❌ DON'T
- Trust client input blindly  
- Store sensitive data in messages  
- Keep infinite in-memory state  
- Ignore reconnection logic  
- Skip validation and error handling  