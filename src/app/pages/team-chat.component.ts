import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Loader2, Send, Wifi, WifiOff, Users, MessagesSquare, Clock3, ChevronsUp } from 'lucide-angular';
import { ChatHistoryMessage, ChatHistoryPage, ChatService, TeamChatMessage } from '../services/chat.service';
import { Team, TeamService } from '../services/team.service';
import { ChangeDetectorRef, NgZone } from '@angular/core';
interface TeamChatUiMessage {
  id: string;
  type: string;
  senderName: string;
  content: string;
  timestamp: string;
  mine: boolean;
}

@Component({
  selector: 'app-team-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="mx-auto flex max-w-5xl flex-col gap-4">
        <button (click)="goBack()" class="inline-flex w-fit items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm hover:bg-muted/70 transition-colors">
          <lucide-icon [name]="ArrowLeftIcon" [size]="16"></lucide-icon>
          Back to team details
        </button>

        <div *ngIf="loading" class="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
          Loading team chat...
        </div>

        <div *ngIf="errorBanner && !loading" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {{ errorBanner }}
        </div>

        <div *ngIf="!loading && !errorBanner" class="grid gap-4">
          <section class="rounded-2xl border border-border bg-card p-4 md:p-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 class="text-2xl font-bold">{{ team?.name || ('Team #' + teamId) }} Chatroom</h1>
                <p class="text-sm text-muted-foreground">Only approved team members can access this room.</p>
              </div>

              <div class="flex items-center gap-2 text-xs font-semibold">
                <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                      [ngClass]="connected ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/15 text-red-700 dark:text-red-300'">
                  <lucide-icon [name]="connected ? WifiIcon : WifiOffIcon" [size]="13"></lucide-icon>
                  {{ connected ? 'Connected' : 'Disconnected' }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  <lucide-icon [name]="UsersIcon" [size]="13"></lucide-icon>
                  {{ onlineMembersCount || team?.members?.length || 0 }} online
                </span>
                <span *ngIf="typingUsers.length > 0" class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                  <lucide-icon [name]="MessagesSquareIcon" [size]="13"></lucide-icon>
                  {{ typingUsers.join(', ') }} typing...
                </span>
                <span *ngIf="unreadCount > 0" class="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-700 dark:text-blue-300">
                  {{ unreadCount }} new
                </span>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-border bg-card overflow-hidden relative">
            <div class="border-b border-border px-4 py-3 text-xs text-muted-foreground">
              Messages are broadcast in real time to connected members of this team.
            </div>

            <div class="h-[52vh] overflow-y-auto p-4 space-y-3" #chatScrollContainer (scroll)="onScrollMessages()">
              <button *ngIf="hasMoreHistory && !loadingHistory" (click)="loadOlderMessages()" class="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/70">
                <lucide-icon [name]="ChevronsUpIcon" [size]="13"></lucide-icon>
                Load older messages
              </button>

              <div *ngIf="loadingHistory" class="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <lucide-icon [name]="Clock3Icon" [size]="13"></lucide-icon>
                Loading history...
              </div>

              <div *ngIf="messages.length === 0" class="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </div>

              <div *ngFor="let message of messages"
                   class="rounded-xl border px-3 py-2"
                   [ngClass]="message.mine ? 'ml-auto max-w-[85%] border-primary/30 bg-primary/10' : 'mr-auto max-w-[85%] border-border bg-muted/20'">
                <div class="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span class="font-semibold">{{ message.senderName }}</span>
                  <span>{{ message.timestamp | date:'shortTime' }}</span>
                </div>
                <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
              </div>
            </div>

            <button
              *ngIf="unreadCount > 0"
              (click)="openUnreadMessages()"
              class="absolute bottom-[74px] left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              {{ unreadCount }} new message{{ unreadCount > 1 ? 's' : '' }}
            </button>

            <div *ngIf="typingUsers.length > 0" class="absolute bottom-[114px] left-4 right-4">
              <div class="mx-auto w-fit rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur">
                {{ typingUsers.join(', ') }} typing...
              </div>
            </div>

            <div class="border-t border-border p-3">
              <div class="flex items-end gap-2">
                <textarea
                  [(ngModel)]="draftMessage"
                  (ngModelChange)="onDraftChanged()"
                  (keydown.enter)="handleEnter($any($event))"
                  rows="2"
                  placeholder="Write a message"
                  [disabled]="!connected || sending"
                  class="min-h-[46px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                ></textarea>
                <button
                  (click)="sendMessage()"
                  [disabled]="!canSendMessage"
                  class="inline-flex h-[46px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  <lucide-icon [name]="SendIcon" [size]="14"></lucide-icon>
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `
})
export class TeamChatComponent implements OnInit, OnDestroy {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly Loader2Icon = Loader2;
  readonly SendIcon = Send;
  readonly WifiIcon = Wifi;
  readonly WifiOffIcon = WifiOff;
  readonly UsersIcon = Users;
  readonly MessagesSquareIcon = MessagesSquare;
  readonly Clock3Icon = Clock3;
  readonly ChevronsUpIcon = ChevronsUp;

  loading = true;
  connected = false;
  sending = false;
  errorBanner: string | null = null;
  loadingHistory = false;

  teamId = 0;
  roomId = '';
  team: Team | null = null;
  currentUserId: number | null = null;
  currentUserName = 'Member';
  draftMessage = '';
  unreadCount = 0;
  onlineMembersCount = 0;
  typingUsers: string[] = [];
  hasMoreHistory = true;
  private historyCursor: number | string | null = null;

  messages: TeamChatUiMessage[] = [];
  @ViewChild('chatScrollContainer') private chatScrollContainer?: ElementRef<HTMLDivElement>;

  private readonly subscriptions: Subscription[] = [];
  private windowFocused = true;
  private typingStopHandle: ReturnType<typeof setTimeout> | null = null;
  private readonly knownMessageIds = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private chatService: ChatService,
      private cdr: ChangeDetectorRef,  // ✅ ajout
  private ngZone: NgZone            // ✅ ajout
  ) { }

  get canSendMessage(): boolean {
    return this.connected && !this.sending && this.draftMessage.trim().length > 0;
  }

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(this.teamId) || this.teamId <= 0) {
      this.loading = false;
      this.errorBanner = 'Invalid team id.';
      return;
    }

    this.roomId = `team_${this.teamId}`;
    this.currentUserId = this.parseCurrentUserId();
    this.currentUserName = this.getCurrentUserName();

    this.loadTeamAndConnect();
  }

  ngOnDestroy(): void {
    if (this.typingStopHandle) {
      clearTimeout(this.typingStopHandle);
      this.typingStopHandle = null;
    }

    this.chatService.leaveRoom();
    this.chatService.disconnect();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.windowFocused = true;
    if (this.isNearBottom()) {
      this.resetUnreadCount();
    }
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    this.windowFocused = false;
  }

  goBack(): void {
    this.router.navigate(['/app/team', this.teamId]);
  }

  handleEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }



  loadOlderMessages(): void {
    if (!this.roomId || this.loadingHistory || !this.hasMoreHistory) {
      return;
    }

    const oldestId = this.historyCursor ?? this.getOldestMessageId();
    if (!oldestId) {
      this.hasMoreHistory = false;
      return;
    }

    this.loadingHistory = true;
    this.chatService.fetchRoomMessages(this.roomId, 30, oldestId).subscribe({
      next: (page) => {
        this.mergeHistoryPage(page, true);
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  onScrollMessages(): void {
    if (this.isNearBottom()) {
      this.resetUnreadCount();
      this.chatService.markRoomRead(this.roomId).subscribe({ error: () => { } });
    }
  }

  onDraftChanged(): void {
    if (!this.connected) {
      return;
    }

    const content = this.draftMessage.trim();
    this.chatService.sendTeamTyping(this.teamId, content.length > 0);

    if (this.typingStopHandle) {
      clearTimeout(this.typingStopHandle);
    }

    this.typingStopHandle = setTimeout(() => this.stopTyping(), 1200);
  }

  openUnreadMessages(): void {
    this.scrollToBottomSoon();
    this.resetUnreadCount();
  }

  private loadTeamAndConnect(): void {
    this.loading = true;
    this.errorBanner = null;

    this.teamService.getTeamDetails(this.teamId).subscribe({
      next: (team) => {
        this.team = team;

        if (!this.isCurrentUserTeamMember(team)) {
          this.loading = false;
          this.errorBanner = 'Only approved team members can access this chatroom.';
          return;
        }

        this.connectAndJoinRoom();
      },
      error: () => {
        this.loading = false;
        this.errorBanner = 'Unable to load this team chatroom right now.';
      }
    });
  }

private connectAndJoinRoom(): void {
  const connectedSub = this.chatService.connected$.subscribe((connected) => {
    this.ngZone.run(() => {
      this.connected = connected;
      if (connected) {
        this.chatService.joinTeamRoom(this.teamId);
      }
      this.cdr.detectChanges();
    });
  });

  const messagesSub = this.chatService.roomMessages$.subscribe((message) => {
    this.ngZone.run(() => {
      const wasNearBottom = this.isNearBottom();
      const uiMessage = this.mapIncomingMessage(message);
      if (!uiMessage) return;
      if (!this.knownMessageIds.has(uiMessage.id)) {
        this.pushUiMessage(uiMessage);
        if (uiMessage.mine || (this.windowFocused && wasNearBottom)) {
          this.scrollToBottomSoon();
          this.resetUnreadCount();
        } else {
          this.unreadCount += 1;
        }
      }
      this.cdr.detectChanges();
    });
  });

  const historySub = this.chatService.roomHistory$.subscribe((page) => {
    this.ngZone.run(() => {
      this.mergeHistoryPage(page, false);
      this.cdr.detectChanges();
    });
  });

  const typingSub = this.chatService.roomTypingUsers$.subscribe((users) => {
    this.ngZone.run(() => {
      this.typingUsers = (users || []).filter(u => u && u !== this.currentUserName);
      this.cdr.detectChanges();
    });
  });

  const membersSub = this.chatService.roomMembersCount$.subscribe((count) => {
    this.ngZone.run(() => {
      this.onlineMembersCount = Number(count || 0);
      this.cdr.detectChanges();
    });
  });

  const errorsSub = this.chatService.roomErrors$.subscribe((error) => {
    this.ngZone.run(() => {
      if (!error?.message) return;
      if (error.code === 'WS_HANDSHAKE_FORBIDDEN' || error.code === 'WS_HANDSHAKE_ERROR') {
        this.errorBanner = 'WebSocket handshake blocked by backend (403).';
        return;
      }
      if (error.status === 403) {
        this.errorBanner = 'Only approved team members can access this chatroom.';
        return;
      }
      this.errorBanner = error.message;
      this.cdr.detectChanges();
    });
  });

  const presenceSub = this.chatService.roomPresence$.subscribe((presence) => {
    this.ngZone.run(() => {
      if (!presence.content) return;
      this.pushUiMessage({
        id: `presence-${Date.now()}`,
        type: presence.type || 'SYSTEM',
        senderName: 'System',
        content: String(presence.content),
        timestamp: presence.timestamp || new Date().toISOString(),
        mine: false
      });
      this.scrollToBottomSoon();
      this.cdr.detectChanges();
    });
  });

  this.subscriptions.push(connectedSub, messagesSub, historySub, typingSub, membersSub, errorsSub, presenceSub);
  
  this.ngZone.run(() => {
    this.chatService.connect(this.currentUserName);
    this.loading = false;          // ✅ dans ngZone
    this.cdr.detectChanges();      // ✅ force l'affichage
  });

  this.scrollToBottomSoon();
}

  private isCurrentUserTeamMember(team: Team): boolean {
    const userId = this.currentUserId;
    if (!userId || !Array.isArray(team.members)) {
      return false;
    }

    return team.members.some((member) => member.userId === userId);
  }

  private parseCurrentUserId(): number | null {
    const raw = localStorage.getItem('user_id');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private getCurrentUserName(): string {
    const stored = localStorage.getItem('user_name')?.trim();
    if (stored) {
      return stored;
    }

    const email = localStorage.getItem('user_email')?.trim();
    if (email) {
      return email;
    }

    return 'Member';
  }


  private pushUiMessage(message: TeamChatUiMessage): void {
    this.knownMessageIds.add(message.id);
    this.messages = [...this.messages, message].slice(-200);
  }

  private mergeHistoryPage(page: ChatHistoryPage | null | undefined, prepend = false): void {
    const items = Array.isArray(page?.items) ? page!.items : [];
    const mapped = items
      .map((item) => this.mapHistoryMessage(item))
      .filter((item): item is TeamChatUiMessage => !!item && !this.knownMessageIds.has(item.id));

    if (mapped.length === 0) {
      if (page?.hasMore === false) {
        this.hasMoreHistory = false;
      }
      return;
    }

    mapped.forEach((item) => this.knownMessageIds.add(item.id));

    if (prepend) {
      this.messages = [...mapped, ...this.messages].slice(-200);
    } else {
      this.messages = [...this.messages, ...mapped].slice(-200);
    }

    this.historyCursor = page?.lastMessageId ?? this.getOldestMessageId();
    this.hasMoreHistory = page?.hasMore ?? items.length >= 30;

    this.scrollToBottomSoon();
  }

  private mapIncomingMessage(message: TeamChatMessage): TeamChatUiMessage | null {
    // Filtre seulement si roomId est présent ET différent
    const incomingRoomId = typeof message.roomId === 'string' ? message.roomId : null;
    if (incomingRoomId !== null && incomingRoomId !== this.roomId) {
      return null;
    }

    const content = typeof message.content === 'string'
      ? message.content.trim()
      : '';

    if (!content) {
      return null;
    }

    const senderName = typeof message.senderName === 'string' && message.senderName.trim().length > 0
      ? message.senderName.trim()
      : 'Member';

    const senderId = Number(message.senderId);
    const mine = Number.isFinite(senderId) && senderId > 0 && senderId === this.currentUserId;

    // ID stable basé sur l'id du message venant du serveur
    const id = message['id']
      ? String(message['id'])
      : `${message.senderId ?? 'unknown'}-${message.timestamp ?? Date.now()}-${content.slice(0, 20)}`;

    return {
      id,
      type: message.type || 'MESSAGE',
      senderName,
      content,
      timestamp: message.timestamp || new Date().toISOString(),
      mine
    };
  }

  sendMessage(): void {
    const content = this.draftMessage.trim();
    if (!content || !this.connected) {
      return;
    }

    this.sending = true;
    this.stopTyping();

    // On envoie au serveur — il va broadcaster à tous via /topic/room/{roomId}
    // roomMessages$ recevra le message → pas besoin d'ajouter localement
    this.chatService.sendTeamMessage(this.teamId, content);

    this.draftMessage = '';
    this.sending = false;
    this.chatService.markRoomRead(this.roomId).subscribe({ error: () => { } });
  }

  private mapHistoryMessage(message: ChatHistoryMessage): TeamChatUiMessage | null {
    const content = String(message?.content || '').trim();
    if (!content) {
      return null;
    }

    const senderId = Number(message.senderId);
    const mine = Number.isFinite(senderId) && senderId > 0 && senderId === this.currentUserId;

    // ID stable basé sur l'id persisté en base
    const id = message.id
      ? String(message.id)
      : `history-${message.senderId ?? 'unknown'}-${message.createdAt ?? message.timestamp ?? content.slice(0, 20)}`;

    return {
      id,
      type: message.type || 'MESSAGE',
      senderName: message.senderName || 'Member',
      content,
      timestamp: message.createdAt || message.timestamp || new Date().toISOString(),
      mine
    };
  }

  private getOldestMessageId(): number | string | null {
    const first = this.messages.find(m => {
      const id = String(m.id);
      return !id.startsWith('presence-') && !id.startsWith('local-');
    });
    return first ? first.id : null;
  }

  private stopTyping(): void {
    this.chatService.sendTeamTyping(this.teamId, false);
    if (this.typingStopHandle) {
      clearTimeout(this.typingStopHandle);
      this.typingStopHandle = null;
    }
  }

  private isNearBottom(): boolean {
    const container = this.chatScrollContainer?.nativeElement;
    if (!container) {
      return true;
    }

    const threshold = 56;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }

  private scrollToBottomSoon(): void {
    setTimeout(() => {
      const container = this.chatScrollContainer?.nativeElement;
      if (!container) {
        return;
      }

      container.scrollTop = container.scrollHeight;
    }, 0);
  }

  private resetUnreadCount(): void {
    this.unreadCount = 0;
  }
}
