# Team Join Requests and Team Chat Frontend Integration Notes

## API Endpoints Used

### Authentication
- Protected HTTP calls rely on the existing Bearer JWT interceptor.
- Frontend shows clear errors for 401 and 403 responses and redirects to login when needed.

### Team Join Requests
- `POST /api/teams/{teamId}/join-requests`
- `GET /api/teams/join-requests`
- `GET /api/team-members/requests`
- `PATCH /api/teams/join-requests/{id}/approve`
- `POST /api/teams/join-requests/{id}/reject`

### Team Details and Search
- `GET /api/teams/{id}/details`
- `GET /api/teams/search/by-category-owner?category=&owner=`

### Chat REST
- `GET /api/chat/rooms`
- `GET /api/chat/messages/{roomId}?limit=&lastMessageId=`
- `POST /api/chat/private-room`
- `POST /api/chat/team-room/{teamId}`
- `POST /api/chat/community-room/{communityId}`
- `POST /api/chat/mark-read/{roomId}`

### WebSocket / STOMP
- SockJS endpoints: `/ws` and `/ws-chat`
- App destination prefix: `/app`
- Broker topics: `/topic`, `/queue`, `/user`
- User destination prefix: `/user`

## Message Mapping

### Client Sends
- `/app/chat.join`
- `/app/chat.leave`
- `/app/chat.send`
- `/app/chat.typing`
- `/app/chat.history`

### Client Subscribes
- `/topic/room/{roomId}`
- `/topic/room/{roomId}/typing`
- `/topic/room/{roomId}/members`
- `/user/queue/history`
- `/user/queue/errors`

## Frontend Behavior Implemented

- Team chat room ids use the backend format `team_{teamId}`.
- Approved team members can enter the team chat page.
- Non-members are blocked by route guard and backend error handling.
- Join requests are visible to admins and can be approved or rejected.
- Chat supports live messages, typing state, presence count, unread badge, and older-message pagination.
- Read state is updated through `POST /api/chat/mark-read/{roomId}` and on-scroll behavior.
- UI shows clear feedback for forbidden or disconnected states.

## Manual Test Checklist

1. Player requests to join a team.
2. Admin opens the pending requests page and approves the request.
3. Approved player can open the team chat page.
4. Player sends a message and other connected team members receive it in real time.
5. Typing indicator appears while a member is composing a message.
6. Online member count updates when users join or leave the room.
7. Unread badge increments when a new message arrives while the chat is not focused.
8. Loading older history appends the earlier messages without cross-team leakage.
9. Non-member opening `/app/team/{id}/chat` is redirected or blocked with a clear error.
10. Reconnect after refresh restores the chat room and history.

## Validation Results
- Angular build: passed
- Edited TypeScript files: no diagnostics
- Remaining build warnings: initial bundle budget and CommonJS warnings for `@stomp/stompjs` and `sockjs-client`
