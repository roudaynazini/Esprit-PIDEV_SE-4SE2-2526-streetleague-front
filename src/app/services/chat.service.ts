import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, catchError, map, of, tap } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../environments/environment';

export interface ChatMessagePayload {
  roomId: string;
  content: string;
}

export interface ChatTypingPayload {
  roomId: string;
  isTyping: boolean;
}

export interface ChatRoomSummary {
  roomId: string;
  roomName?: string;
  teamId?: number;
  communityId?: number;
  memberCount?: number;
  unreadCount?: number;
  lastMessageAt?: string;
}

export interface ChatRoomMemberUpdate {
  roomId?: string;
  teamId?: number;
  count?: number;
  onlineCount?: number;
  members?: Array<{ userId?: number; userName?: string; name?: string }>;
  event?: 'JOIN' | 'LEAVE' | 'SYNC' | 'UPDATE' | string;
}

export interface ChatHistoryMessage {
  id?: number | string;
  roomId?: string;
  senderId?: number;
  senderName?: string;
  content?: string;
  createdAt?: string;
  timestamp?: string;
  type?: string;
  [key: string]: unknown;
}

export interface ChatHistoryPage {
  items: ChatHistoryMessage[];
  lastMessageId?: number | string | null;
  hasMore?: boolean;
}

export interface ChatErrorMessage {
  message: string;
  code?: string | number;
  roomId?: string;
  status?: number;
  [key: string]: unknown;
}

export interface TeamChatMessage {
  type?: 'MESSAGE' | 'TYPING' | 'USER_JOINED' | 'USER_LEFT' | 'SYSTEM' | string;
  roomId?: string;
  teamId?: number;
  senderId?: number;
  senderName?: string;
  content?: string;
  timestamp?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiBase = environment.apiUrl || 'http://localhost:8085/api';
  private readonly wsSockJsPaths = ['/ws', '/ws-chat'];
  private readonly maxReconnectFailures = 8;
  private stompClient: Client | null = null;
  private roomSubscription: StompSubscription | null = null;
  private roomTypingSubscription: StompSubscription | null = null;
  private roomMembersSubscription: StompSubscription | null = null;
  private historySubscription: StompSubscription | null = null;
  private replySubscription: StompSubscription | null = null;
  private errorSubscription: StompSubscription | null = null;
  private onMessageCallback: ((msg: TeamChatMessage) => void) | null = null;
  private currentRoomId: string | null = null;
  private pendingJoinRoomId: string | null = null;
  private wsAttemptIndex = 0;
  private reconnectFailures = 0;
  private manualDisconnect = false;
  private lastSocketPath = '/ws-chat';

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly roomMessagesSubject = new Subject<TeamChatMessage>();
  private readonly roomPresenceSubject = new Subject<TeamChatMessage>();
  private readonly roomTypingUsersSubject = new BehaviorSubject<string[]>([]);
  private readonly roomMembersCountSubject = new BehaviorSubject<number>(0);
  private readonly roomHistorySubject = new Subject<ChatHistoryPage>();
  private readonly roomErrorsSubject = new Subject<ChatErrorMessage>();
  readonly connected$: Observable<boolean> = this.connectedSubject.asObservable();
  readonly roomMessages$: Observable<TeamChatMessage> = this.roomMessagesSubject.asObservable();
  readonly roomPresence$: Observable<TeamChatMessage> = this.roomPresenceSubject.asObservable();
  readonly roomTypingUsers$: Observable<string[]> = this.roomTypingUsersSubject.asObservable();
  readonly roomMembersCount$: Observable<number> = this.roomMembersCountSubject.asObservable();
  readonly roomHistory$: Observable<ChatHistoryPage> = this.roomHistorySubject.asObservable();
  readonly roomErrors$: Observable<ChatErrorMessage> = this.roomErrorsSubject.asObservable();

  constructor(private http: HttpClient) {}

  connect(username: string, onMessage?: (msg: TeamChatMessage) => void): void {
    this.onMessageCallback = onMessage ?? null;

    if (this.stompClient?.active) {
      return;
    }

    const token = localStorage.getItem('auth_token') || '';
    const wsBase = environment.wsUrl || 'http://localhost:8085';
    this.manualDisconnect = false;

    this.stompClient = new Client({
      webSocketFactory: () => {
        const path = this.wsSockJsPaths[this.wsAttemptIndex % this.wsSockJsPaths.length];
        this.wsAttemptIndex += 1;
        this.lastSocketPath = path;
        return new SockJS(`${wsBase}${path}`);
      },
      connectHeaders: {
        username,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.reconnectFailures = 0;
        this.connectedSubject.next(true);

        this.replySubscription?.unsubscribe();
        this.errorSubscription?.unsubscribe();

        this.replySubscription = this.stompClient?.subscribe('/user/queue/reply', (msg: IMessage) => {
          this.safeEmit(msg.body);
        }) ?? null;

        this.errorSubscription = this.stompClient?.subscribe('/user/queue/errors', (msg: IMessage) => {
          this.handleQueueError(msg.body);
        }) ?? null;

        if (this.pendingJoinRoomId) {
          this.activateRoomSubscriptions(this.pendingJoinRoomId);
        }
      },
      onDisconnect: () => {
        const wasConnected = this.connectedSubject.getValue();
        this.connectedSubject.next(false);
        if (wasConnected) {
          this.emitPresence({
            type: 'SYSTEM',
            content: 'Disconnected from chat server',
            timestamp: new Date().toISOString(),
            roomId: this.currentRoomId ?? undefined
          });
        }
      },
      onWebSocketClose: () => {
        const wasConnected = this.connectedSubject.getValue();
        this.connectedSubject.next(false);

        if (!this.manualDisconnect) {
          this.reconnectFailures += 1;
        }

        if (!this.manualDisconnect && this.reconnectFailures >= this.maxReconnectFailures) {
          const client = this.stompClient;
          this.stompClient = null;
          client?.deactivate();
          this.roomErrorsSubject.next({
            status: 403,
            code: 'WS_HANDSHAKE_FORBIDDEN',
            message: `WebSocket handshake rejected repeatedly (last endpoint: ${this.lastSocketPath}). Check backend CORS/security for /ws and /ws-chat.`
          });
          return;
        }

        if (wasConnected) {
          this.emitPresence({
            type: 'SYSTEM',
            content: 'Connection closed',
            timestamp: new Date().toISOString(),
            roomId: this.currentRoomId ?? undefined
          });
        }
      },
      onWebSocketError: () => {
        if (!this.manualDisconnect) {
          this.roomErrorsSubject.next({
            status: 403,
            code: 'WS_HANDSHAKE_ERROR',
            message: `WebSocket handshake failed on ${this.lastSocketPath}.`
          });
        }
      },
      onStompError: (frame) => {
        this.safeEmit(frame.body || frame.headers?.['message'] || 'STOMP error');
      }
    });

    this.stompClient.activate();
  }

  joinTeamRoom(teamId: number): void {
    this.joinRoom(this.buildTeamRoomId(teamId));
  }

  joinRoom(roomId: string): void {
    this.pendingJoinRoomId = roomId;

    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    this.activateRoomSubscriptions(roomId);

    this.stompClient.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({ roomId })
    });

    this.requestRoomHistory(roomId, 50);

    this.emitPresence({
      type: 'USER_JOINED',
      roomId,
      timestamp: new Date().toISOString(),
      content: 'Joined room'
    });
  }

  sendTeamMessage(teamId: number, content: string): void {
    this.sendMessage(this.buildTeamRoomId(teamId), content);
  }

  sendMessage(roomId: string, content: string): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    const payload: ChatMessagePayload = { roomId, content };
    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });
  }

  sendTeamTyping(teamId: number, isTyping: boolean): void {
    this.sendTyping(this.buildTeamRoomId(teamId), isTyping);
  }

  sendTyping(roomId: string, isTyping: boolean): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    const payload: ChatTypingPayload = { roomId, isTyping };
    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(payload)
    });
  }

  requestRoomHistory(roomId: string, limit = 50, lastMessageId?: number | string | null): void {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    const payload: Record<string, unknown> = { roomId, limit };
    if (lastMessageId !== undefined && lastMessageId !== null) {
      payload['lastMessageId'] = lastMessageId;
    }

    this.stompClient.publish({
      destination: '/app/chat.history',
      body: JSON.stringify(payload)
    });
  }

  fetchRoomMessages(roomId: string, limit = 50, lastMessageId?: number | string | null): Observable<ChatHistoryPage> {
    let params = new HttpParams().set('limit', String(limit));
    if (lastMessageId !== undefined && lastMessageId !== null && String(lastMessageId).length > 0) {
      params = params.set('lastMessageId', String(lastMessageId));
    }

    return this.http.get<any>(`${this.apiBase}/chat/messages/${encodeURIComponent(roomId)}`, { params }).pipe(
      map((response) => this.normalizeHistoryPage(response)),
      catchError((error) => {
        this.handleQueueErrorFromHttp(error, roomId);
        return of({ items: [], lastMessageId: null, hasMore: false });
      })
    );
  }

  getChatRooms(): Observable<ChatRoomSummary[]> {
    return this.http.get<any>(`${this.apiBase}/chat/rooms`).pipe(
      map((response) => {
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.content)
            ? response.content
            : Array.isArray(response?.items)
              ? response.items
              : Array.isArray(response?.data)
                ? response.data
                : [];

        return list.map((item: any) => this.normalizeRoomSummary(item));
      })
    );
  }

  createPrivateRoom(): Observable<ChatRoomSummary> {
    return this.http.post<any>(`${this.apiBase}/chat/private-room`, {}).pipe(map((room) => this.normalizeRoomSummary(room)));
  }

  createTeamRoom(teamId: number): Observable<ChatRoomSummary> {
    return this.http.post<any>(`${this.apiBase}/chat/team-room/${teamId}`, {}).pipe(map((room) => this.normalizeRoomSummary(room)));
  }

  createCommunityRoom(communityId: number): Observable<ChatRoomSummary> {
    return this.http.post<any>(`${this.apiBase}/chat/community-room/${communityId}`, {}).pipe(map((room) => this.normalizeRoomSummary(room)));
  }

  markRoomRead(roomId: string): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/chat/mark-read/${encodeURIComponent(roomId)}`, {});
  }

  getTypingUsers$(): Observable<string[]> {
    return this.roomTypingUsers$;
  }

  getOnlineMembersCount$(): Observable<number> {
    return this.roomMembersCount$;
  }

  pushHistoryPage(page: ChatHistoryPage): void {
    this.roomHistorySubject.next(page);
  }

  leaveRoom(): void {
    if (this.currentRoomId && this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.leave',
        body: JSON.stringify({ roomId: this.currentRoomId })
      });
    }

    if (this.currentRoomId) {
      this.emitPresence({
        type: 'USER_LEFT',
        roomId: this.currentRoomId,
        timestamp: new Date().toISOString(),
        content: 'Left room'
      });
    }

    this.roomSubscription?.unsubscribe();
    this.roomSubscription = null;
    this.roomTypingSubscription?.unsubscribe();
    this.roomTypingSubscription = null;
    this.roomMembersSubscription?.unsubscribe();
    this.roomMembersSubscription = null;
    this.historySubscription?.unsubscribe();
    this.historySubscription = null;
    this.currentRoomId = null;
    this.pendingJoinRoomId = null;
    this.roomTypingUsersSubject.next([]);
    this.roomMembersCountSubject.next(0);
  }

  disconnect(): void {
    this.manualDisconnect = true;
    this.leaveRoom();
    this.replySubscription?.unsubscribe();
    this.replySubscription = null;
    this.errorSubscription?.unsubscribe();
    this.errorSubscription = null;

    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }

    this.connectedSubject.next(false);
    this.stompClient = null;
  }

  private buildTeamRoomId(teamId: number): string {
    return `team_${teamId}`;
  }

  private activateRoomSubscriptions(roomId: string): void {
    if (!this.stompClient) {
      return;
    }

    this.roomSubscription?.unsubscribe();
    this.roomTypingSubscription?.unsubscribe();
    this.roomMembersSubscription?.unsubscribe();
    this.historySubscription?.unsubscribe();

    this.currentRoomId = roomId;
    this.pendingJoinRoomId = roomId;

    this.roomSubscription = this.stompClient.subscribe(this.buildRoomTopic(roomId), (msg: IMessage) => {
      this.safeEmit(msg.body);
    });

    this.roomTypingSubscription = this.stompClient.subscribe(this.buildRoomTypingTopic(roomId), (msg: IMessage) => {
      this.handleTypingEvent(msg.body);
    });

    this.roomMembersSubscription = this.stompClient.subscribe(this.buildRoomMembersTopic(roomId), (msg: IMessage) => {
      this.handleMembersEvent(msg.body);
    });

    this.historySubscription = this.stompClient.subscribe('/user/queue/history', (msg: IMessage) => {
      this.handleHistoryQueueMessage(msg.body);
    });
  }

  private buildRoomTopic(roomId: string): string {
    return `/topic/room/${roomId}`;
  }

  private buildRoomTypingTopic(roomId: string): string {
    return `/topic/room/${roomId}/typing`;
  }

  private buildRoomMembersTopic(roomId: string): string {
    return `/topic/room/${roomId}/members`;
  }

  private emitPresence(event: TeamChatMessage): void {
    this.roomPresenceSubject.next(event);
    this.onMessageCallback?.(event);
  }

  private handleTypingEvent(rawBody: string): void {
    const parsed = this.safeParse(rawBody) as ChatRoomMemberUpdate & { typingUsers?: string[]; isTyping?: boolean; userName?: string; senderName?: string };
    const typingUsers = Array.isArray(parsed?.typingUsers)
      ? parsed.typingUsers.map((value) => String(value)).filter((value) => value.length > 0)
      : parsed?.isTyping && (parsed?.userName || parsed?.senderName)
        ? [String(parsed.userName || parsed.senderName)]
        : [];

    this.roomTypingUsersSubject.next(Array.from(new Set(typingUsers)));
  }

  private handleMembersEvent(rawBody: string): void {
    const parsed = this.safeParse(rawBody) as ChatRoomMemberUpdate;
    const count = Number(
      parsed?.onlineCount
      ?? parsed?.count
      ?? (Array.isArray(parsed?.members) ? parsed.members?.length : 0)
    );
    this.roomMembersCountSubject.next(Number.isFinite(count) && count >= 0 ? count : 0);
  }

  private handleHistoryQueueMessage(rawBody: string): void {
    const parsed = this.safeParse(rawBody);
    this.roomHistorySubject.next(this.normalizeHistoryPage(parsed));
  }

  private handleQueueError(rawBody: string): void {
    const parsed = this.safeParse(rawBody) as ChatErrorMessage;
    const error = this.normalizeChatError(parsed);
    this.roomErrorsSubject.next(error);
  }

  private handleQueueErrorFromHttp(error: unknown, roomId?: string): void {
    const message = this.extractErrorMessage(error);
    this.roomErrorsSubject.next({ message, roomId, status: (error as any)?.status });
  }

  private normalizeRoomSummary(room: any): ChatRoomSummary {
    return {
      roomId: String(room?.roomId || room?.id || room?.name || ''),
      roomName: room?.roomName || room?.name || room?.title,
      teamId: Number(room?.teamId || 0) || undefined,
      communityId: Number(room?.communityId || 0) || undefined,
      memberCount: Number(room?.memberCount ?? room?.onlineMembers ?? 0) || 0,
      unreadCount: Number(room?.unreadCount ?? 0) || 0,
      lastMessageAt: room?.lastMessageAt || room?.updatedAt || room?.createdAt
    };
  }

  private normalizeHistoryPage(response: any): ChatHistoryPage {
    const list = Array.isArray(response)
      ? response
      : Array.isArray(response?.content)
        ? response.content
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.messages)
              ? response.messages
              : [];

    return {
      items: list.map((item: any) => this.normalizeHistoryMessage(item)),
      lastMessageId: response?.lastMessageId ?? response?.nextLastMessageId ?? null,
      hasMore: Boolean(response?.hasMore ?? response?.hasNext ?? false)
    };
  }

  private normalizeHistoryMessage(message: any): ChatHistoryMessage {
    return {
      ...message,
      id: message?.id ?? message?.messageId ?? message?.createdAt ?? message?.timestamp ?? undefined,
      roomId: message?.roomId || message?.room || undefined,
      senderId: Number(message?.senderId || message?.userId || 0) || undefined,
      senderName: message?.senderName || message?.userName || message?.authorName || message?.author || 'Member',
      content: message?.content || message?.message || '',
      createdAt: message?.createdAt || message?.timestamp || new Date().toISOString()
    };
  }

  private normalizeChatError(error: ChatErrorMessage): ChatErrorMessage {
    return {
      ...error,
      message: error?.message || 'WebSocket error',
      code: error?.code,
      roomId: error?.roomId,
      status: Number(error?.status || 0) || undefined
    };
  }

  private safeParse(rawBody: string): any {
    try {
      return JSON.parse(rawBody);
    } catch {
      return { message: rawBody };
    }
  }

  private extractErrorMessage(error: unknown): string {
    const status = (error as any)?.status;
    if (status === 401) return 'Session expirée. Reconnectez-vous.';
    if (status === 403) return 'Accès refusé au chat.';
    if (status === 404) return 'Ressource de chat introuvable.';
    if (status === 409) return 'Une ressource de chat existe déjà.';
    if (status === 0) return 'Impossible de joindre le serveur de chat.';

    const backendError = (error as any)?.error;
    if (typeof backendError === 'string') return backendError;
    if (backendError?.message) return backendError.message;
    if (backendError?.error) return backendError.error;

    return (error as any)?.message || 'Erreur inattendue dans le chat.';
  }

  private safeEmit(rawBody: string): void {
    const parsed = this.safeParse(rawBody) as TeamChatMessage;

    this.roomMessagesSubject.next(parsed);
    this.onMessageCallback?.(parsed);
  }
}
