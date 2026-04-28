import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule, ArrowLeft, Loader2, Shield, RefreshCcw, MessageSquare, Trash2, Users, Star } from 'lucide-angular';
import { Team, TeamMember, TeamService } from '../services/team.service';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="max-w-5xl mx-auto">
        <button (click)="goBack()" class="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 transition-colors">
          <lucide-icon [name]="ArrowLeftIcon" [size]="16"></lucide-icon>
          Retour à la liste
        </button>

        <div *ngIf="loading" class="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
          Chargement du détail de l'équipe...
        </div>

        <div *ngIf="errorBanner" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{{ errorBanner }}</span>
          <button (click)="loadTeam()" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <lucide-icon [name]="RefreshCcwIcon" [size]="14"></lucide-icon>
            Réessayer
          </button>
        </div>

        <div *ngIf="warningBanner && !errorBanner" class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {{ warningBanner }}
        </div>

        <div *ngIf="!loading && team && !errorBanner">
          <!-- Team Header -->
          <div class="bg-card border border-border rounded-2xl overflow-hidden mb-6">
            <div class="h-40 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center relative">
              <div class="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg overflow-hidden">
                <img *ngIf="team.logo" [src]="team.logo" [alt]="team.name" class="w-full h-full object-cover">
                <lucide-icon *ngIf="!team.logo" [name]="ShieldIcon" [size]="42" class="text-white"></lucide-icon>
              </div>
              <div class="absolute right-6 top-6 px-3 py-1 rounded-lg bg-background/90 border border-border text-xs font-semibold">{{ team.status || 'UNKNOWN' }}</div>
            </div>

            <div class="p-6 md:p-8 space-y-4">
              <div>
                <h1 class="text-3xl font-bold">{{ team.name || 'Équipe sans nom' }}</h1>
                <div class="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                  <span class="font-semibold text-foreground">{{ team.sport || '-' }}</span>
                  <span>•</span>
                  <span class="font-semibold text-foreground">{{ team.level || '-' }}</span>
                </div>
              </div>

              <p class="text-foreground/80">{{ team.description || 'Aucune description disponible.' }}</p>

              <div *ngIf="isPlayer" class="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-sm font-semibold text-foreground">Join Team</p>
                    <p class="text-xs text-muted-foreground">Optional message for the admin.</p>
                  </div>
                  <span *ngIf="joinState === 'pending'" class="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Pending Approval
                  </span>
                </div>

                <textarea
                  *ngIf="joinState === 'default' || joinState === 'sending'"
                  [value]="joinMessage"
                  (input)="joinMessage = ($any($event.target).value || '')"
                  rows="3"
                  [disabled]="joinState === 'sending'"
                  placeholder="Optional message to the team admin"
                  class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                ></textarea>

                <div class="flex flex-wrap items-center gap-3">
                  <button
                    (click)="joinTeam()"
                    [disabled]="isJoinDisabled || !team.id"
                    [class]="joinButtonClasses"
                  >
                    {{ joinButtonLabel }}
                  </button>
                  <button
                    *ngIf="canOpenTeamChat"
                    (click)="openTeamChat()"
                    class="px-4 py-2 rounded-xl font-semibold transition-colors bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25"
                  >
                    Open Team Chat
                  </button>
                  <span *ngIf="joinFeedback" class="text-sm text-muted-foreground">{{ joinFeedback }}</span>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-3 text-sm">
                <div class="rounded-xl border border-border p-3"><span class="font-semibold">Ville:</span> {{ team.city || '-' }}</div>
                <div class="rounded-xl border border-border p-3"><span class="font-semibold">Créée le:</span> {{ team.createdAt ? (team.createdAt | date:'short') : '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Team Members Section -->
          <div class="bg-card border border-border rounded-2xl overflow-hidden">
            <div class="border-b border-border p-6 md:p-8 flex items-center gap-3">
              <lucide-icon [name]="UsersIcon" [size]="24"></lucide-icon>
              <h2 class="text-xl font-bold">Équipe ({{ team.members?.length || 0 }})</h2>
            </div>

            <div *ngIf="team.members && team.members.length > 0; else noMembers" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 md:p-8">
              <div *ngFor="let member of team.members" class="border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
                <!-- Member Header: Avatar & Role -->
                <div class="flex items-start gap-3 mb-3">
                  <img 
                    *ngIf="member.profileImageUrl" 
                    [src]="member.profileImageUrl" 
                    [alt]="member.firstName + ' ' + member.lastName"
                    class="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                  />
                  <div *ngIf="!member.profileImageUrl" class="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {{ member.firstName.charAt(0) }}{{ member.lastName.charAt(0) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-bold">{{ member.firstName }} {{ member.lastName }}</h3>
                    </div>
                    <div class="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold"
                         [ngClass]="{
                           'bg-blue-500/20 text-blue-700 dark:text-blue-300': member.role === 'RESPONSIBLE',
                           'bg-gray-500/20 text-gray-700 dark:text-gray-300': member.role === 'MEMBER',
                           'bg-purple-500/20 text-purple-700 dark:text-purple-300': member.role === 'ASSISTANT'
                         }">
                      {{ member.role }}
                    </div>
                  </div>
                </div>

                <!-- Position & Skill Info -->
                <div *ngIf="member.position" class="text-sm font-semibold text-muted-foreground mb-3">
                  {{ member.position }}
                </div>

                <!-- Rating -->
                <div *ngIf="member.rating !== undefined && member.rating !== null" class="flex items-center gap-2 mb-3">
                  <div class="flex items-center gap-1">
                    <lucide-icon [name]="StarIcon" [size]="16" class="fill-yellow-400 text-yellow-400"></lucide-icon>
                    <span class="font-semibold text-sm">{{ member.rating.toFixed(1) }}</span>
                  </div>
                  <span *ngIf="member.skillLevel !== undefined && member.skillLevel !== null" class="text-xs text-muted-foreground">
                    Niveau: {{ member.skillLevel }}/10
                  </span>
                </div>

                <!-- Contact Actions -->
                <div class="flex flex-wrap gap-2">
                  <a *ngIf="member.email" 
                     [href]="'mailto:' + member.email"
                     class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/70 transition-colors">
                    <span>📧</span>
                  </a>
                  <a *ngIf="member.phone" 
                     [href]="'tel:' + member.phone"
                     class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/70 transition-colors">
                    <span>📞</span>
                  </a>
                  <button (click)="messageMember(member)"
                          class="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 transition-colors">
                    <lucide-icon [name]="MessageSquareIcon" [size]="14"></lucide-icon>
                    Envoyer
                  </button>
                  <button *ngIf="isAdmin" (click)="removeMember(member)"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30 transition-colors">
                    <lucide-icon [name]="Trash2Icon" [size]="14"></lucide-icon>
                  </button>
                </div>
              </div>
            </div>

            <ng-template #noMembers>
              <div class="p-8 text-center text-muted-foreground">
                <lucide-icon [name]="UsersIcon" [size]="32" class="mx-auto mb-3 opacity-50"></lucide-icon>
                <p>Aucun membre dans cette équipe.</p>
              </div>
            </ng-template>

            <!-- Add New Member Button -->
            <div class="border-t border-border p-6 md:p-8">
              <button *ngIf="isAdmin" class="w-full px-4 py-2.5 rounded-xl border border-dashed border-primary/50 text-primary font-semibold hover:bg-primary/10 transition-colors">
                + Ajouter un nouveau membre
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="toast" class="fixed bottom-6 right-6 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-xl">
        {{ toast }}
      </div>
    </div>
  `
})
export class TeamDetailComponent implements OnInit {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly Loader2Icon = Loader2;
  readonly ShieldIcon = Shield;
  readonly RefreshCcwIcon = RefreshCcw;
  readonly MessageSquareIcon = MessageSquare;
  readonly Trash2Icon = Trash2;
  readonly UsersIcon = Users;
  readonly StarIcon = Star;

  loading = true;
  errorBanner: string | null = null;
  warningBanner: string | null = null;
  joinFeedback: string | null = null;
  toast: string | null = null;
  joinMessage = '';
  team: Team | null = null;
  teamId: number | null = null;
  currentRole = (localStorage.getItem('user_type') || '').toUpperCase();
  joinState: 'default' | 'sending' | 'sent' | 'pending' | 'joined' = 'default';
  private readonly forbiddenDetailsStorageKey = 'forbidden_team_details_ids';
  private readonly joinStateStorageKey = 'team_join_request_state';

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private teamService: TeamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.teamId = Number.isFinite(id) ? id : null;
    if (!this.teamId) {
      this.loading = false;
      this.errorBanner = 'Identifiant équipe invalide.';
      return;
    }

    this.restoreJoinState();
    this.loadTeam();
  }

  get isAdmin(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ADMIN';
  }

  get isPlayer(): boolean {
    return [
      'ROLE_PLAYER',
      'PLAYER',
      'ROLE_JOUEUR',
      'JOUEUR',
      'ROLE_USER',
      'USER'
    ].includes(this.currentRole);
  }

  get joinButtonLabel(): string {
    if (this.joinState === 'sending') return 'Sending...';
    if (this.joinState === 'pending') return 'Pending Approval';
    if (this.joinState === 'joined') return 'Already joined';
    return 'Join Team';
  }

  get isJoinDisabled(): boolean {
    return this.joinState === 'sending' || this.joinState === 'pending' || this.joinState === 'joined';
  }

  get canOpenTeamChat(): boolean {
    return this.isCurrentUserMember();
  }

  get joinButtonClasses(): string {
    const base = 'px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed';
    if (this.joinState === 'sending') return `${base} bg-muted text-muted-foreground`;
    if (this.joinState === 'pending') return `${base} bg-amber-500/15 text-amber-700 dark:text-amber-300`;
    if (this.joinState === 'joined') return `${base} bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`;
    return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
  }

  loadTeam(): void {
    if (!this.teamId) return;
    this.loading = true;
    this.errorBanner = null;
    this.warningBanner = null;

    if (this.isDetailsForbidden(this.teamId)) {
      this.loadBasicTeamFallback();
      return;
    }

    this.teamService.getTeamDetails(this.teamId).subscribe({
      next: (team) => {
        this.team = team;
        this.syncJoinStateFromTeam();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const status = (err as HttpErrorResponse)?.status;
        if (status === 403) {
          this.markDetailsForbidden(this.teamId!);
          this.loadBasicTeamFallback();
          return;
        }

        this.loading = false;
        this.errorBanner = this.toReadableError(err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadBasicTeamFallback(): void {
    if (!this.teamId) return;

    this.teamService.getTeamById(this.teamId).subscribe({
      next: (team) => {
        this.team = { ...team, members: team.members || [] };
        this.warningBanner = 'Les détails des membres sont protégés pour cette équipe. Affichage des informations générales uniquement.';
        this.syncJoinStateFromTeam();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (fallbackErr) => {
        this.loading = false;
        this.errorBanner = this.toReadableError(fallbackErr);
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/team']);
  }

  joinTeam(): void {
    if (!this.teamId) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.showToast('Veuillez vous connecter pour envoyer une demande.');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.isPlayer) {
      this.showToast('Seuls les joueurs peuvent envoyer une demande d\'adhésion.');
      return;
    }

    if (this.joinState === 'joined' || this.joinState === 'pending' || this.joinState === 'sending') {
      return;
    }

    const userIdRaw = localStorage.getItem('user_id');
    const playerId = Number(userIdRaw);
    if (!Number.isFinite(playerId) || playerId <= 0) {
      this.showToast('Utilisateur non identifié. Reconnectez-vous puis réessayez.');
      return;
    }

    this.joinFeedback = null;
    this.joinState = 'sending';
    this.cdr.detectChanges();

    this.teamService.requestJoinTeam(this.teamId, this.joinMessage).subscribe({
      next: () => {
        this.joinState = 'pending';
        this.joinMessage = '';
        this.joinFeedback = 'Pending Approval';
        this.persistJoinState('pending');
        this.showToast('Demande d\'adhésion envoyée avec succès.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        const status = (err as HttpErrorResponse)?.status;
        const readable = this.toReadableError(err);
        if (status === 409) {
          this.joinState = 'pending';
          this.joinFeedback = 'Request already pending.';
          this.persistJoinState('pending');
          this.showToast('Request already pending.');
        } else if (status === 403) {
          this.joinState = 'default';
          this.joinFeedback = 'You are not allowed to join this team or your session role is invalid.';
          this.showToast(readable);
        } else if (status === 400) {
          this.joinState = 'default';
          this.joinFeedback = readable;
          this.showToast(readable);
        } else {
          this.joinState = 'default';
          this.joinFeedback = status ? `[${status}] ${readable}` : readable;
          this.showToast(this.joinFeedback);
        }
        this.cdr.detectChanges();
      }
    });
  }

  openTeamChat(): void {
    if (!this.teamId || !this.isCurrentUserMember()) {
      this.showToast('Only approved team members can access the team chat.');
      return;
    }

    this.router.navigate(['/app/team', this.teamId, 'chat']);
  }

  messageMember(member: TeamMember): void {
    console.log('Message member:', member);
    // TODO: Implement messaging functionality
    alert(`Message to ${member.firstName} ${member.lastName} - Coming soon`);
  }

  removeMember(member: TeamMember): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${member.firstName} ${member.lastName} de l'équipe?`)) {
      this.teamService.removeMember(member.userId).subscribe({
        next: () => {
          // Remove from local array
          if (this.team?.members) {
            this.team.members = this.team.members.filter(m => m.userId !== member.userId);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          const message = this.toReadableError(err);
          alert(`Erreur lors de la suppression: ${message}`);
        }
      });
    }
  }

  private toReadableError(error: unknown): string {
    return this.teamService.extractErrorMessage(error);
  }

  private getJoinStateStorageIdentity(): string | null {
    if (!this.teamId) return null;
    const userId = localStorage.getItem('user_id');
    if (!userId) return null;
    return `${userId}:${this.teamId}`;
  }

  private restoreJoinState(): void {
    const identity = this.getJoinStateStorageIdentity();
    if (!identity) return;

    try {
      const raw = localStorage.getItem(this.joinStateStorageKey);
      if (!raw) return;
      const stateMap = JSON.parse(raw);
      const saved = stateMap?.[identity];
      if (saved === 'sent' || saved === 'pending') {
        this.joinState = 'pending';
      }
    } catch {
      // Ignore malformed local cache.
    }
  }

  private persistJoinState(state: 'sent' | 'pending'): void {
    const identity = this.getJoinStateStorageIdentity();
    if (!identity) return;

    try {
      const raw = localStorage.getItem(this.joinStateStorageKey);
      const stateMap = raw ? JSON.parse(raw) : {};
      stateMap[identity] = state;
      localStorage.setItem(this.joinStateStorageKey, JSON.stringify(stateMap));
    } catch {
      const fallback: Record<string, string> = {};
      fallback[identity] = state;
      localStorage.setItem(this.joinStateStorageKey, JSON.stringify(fallback));
    }
  }

  private isDetailsForbidden(teamId: number): boolean {
    try {
      const raw = localStorage.getItem(this.forbiddenDetailsStorageKey);
      if (!raw) return false;
      const ids = JSON.parse(raw);
      return Array.isArray(ids) && ids.includes(teamId);
    } catch {
      return false;
    }
  }

  private markDetailsForbidden(teamId: number): void {
    try {
      const raw = localStorage.getItem(this.forbiddenDetailsStorageKey);
      const ids = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw as string) : [];
      if (!ids.includes(teamId)) {
        ids.push(teamId);
        localStorage.setItem(this.forbiddenDetailsStorageKey, JSON.stringify(ids));
      }
    } catch {
      localStorage.setItem(this.forbiddenDetailsStorageKey, JSON.stringify([teamId]));
    }
  }

  private syncJoinStateFromTeam(): void {
    if (!this.team) {
      return;
    }

    if (this.isCurrentUserMember()) {
        this.joinState = 'joined';
        this.joinFeedback = 'Already joined.';
        return;
    }

    const persistedState = this.restorePersistedJoinState();
    if (persistedState === 'sent' || persistedState === 'pending') {
      this.joinState = 'pending';
      this.joinFeedback = persistedState === 'pending' ? 'Request already pending.' : 'Pending Approval';
      return;
    }

    this.joinState = 'default';
  }

  private getCurrentUserId(): number | null {
    const userIdRaw = localStorage.getItem('user_id');
    const userId = Number(userIdRaw);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  }

  private isCurrentUserMember(): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId || !Array.isArray(this.team?.members)) {
      return false;
    }

    return this.team!.members!.some((member) => member.userId === currentUserId);
  }

  private restorePersistedJoinState(): 'sent' | 'pending' | null {
    const identity = this.getJoinStateStorageIdentity();
    if (!identity) return null;

    try {
      const raw = localStorage.getItem(this.joinStateStorageKey);
      if (!raw) return null;
      const stateMap = JSON.parse(raw) as Record<string, 'sent' | 'pending' | undefined>;
      return stateMap?.[identity] ?? null;
    } catch {
      return null;
    }
  }

  private showToast(message: string): void {
    this.toast = message;
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}
