import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule, RefreshCcw, Loader2, Inbox, User, CalendarClock, MessageSquare, CheckCircle2, XCircle } from 'lucide-angular';
import { TeamJoinRequest, TeamService } from '../services/team.service';
import { CommunityService } from '../services/community.service';

@Component({
  selector: 'app-admin-team-requests',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="mb-2">Manage Request</h1>
            <p class="text-muted-foreground">Toutes les demandes d'adhésion en attente ou traitées</p>
          </div>

          <button (click)="loadRequests()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border hover:bg-muted/70 transition-colors">
            <lucide-icon [name]="RefreshCcwIcon" [size]="16"></lucide-icon>
            Rafraîchir
          </button>
        </div>

        <div *ngIf="errorBanner" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{{ errorBanner }}</span>
          <button (click)="loadRequests()" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <lucide-icon [name]="RefreshCcwIcon" [size]="14"></lucide-icon>
            Réessayer
          </button>
        </div>

        <div *ngIf="loading" class="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
          Chargement des demandes...
        </div>

        <div *ngIf="!loading && requests.length === 0 && !errorBanner" class="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
          <lucide-icon [name]="InboxIcon" [size]="40" class="mx-auto mb-3 opacity-50"></lucide-icon>
          <p class="font-semibold mb-1 text-lg">Aucune demande trouvée</p>
          <p>Aucune demande d'adhésion n'a encore été reçue.</p>
        </div>

        <div *ngIf="!loading && requests.length > 0" class="grid gap-4">
          <div *ngFor="let request of requests" class="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div class="space-y-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-lg font-bold">{{ request.teamName || ('Équipe #' + (request.teamId || '-')) }}</h3>
                  <span class="px-2.5 py-1 rounded-full text-xs font-semibold" [class]="statusClasses(request.status)">{{ request.status || 'PENDING' }}</span>
                </div>

                <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span class="inline-flex items-center gap-1"><lucide-icon [name]="UserIcon" [size]="14"></lucide-icon>{{ request.playerName || ('Joueur #' + (request.playerId || '-')) }}</span>
                  <span *ngIf="request.playerEmail" class="inline-flex items-center gap-1">{{ request.playerEmail }}</span>
                  <span class="inline-flex items-center gap-1"><lucide-icon [name]="CalendarClockIcon" [size]="14"></lucide-icon>{{ request.createdAt ? (request.createdAt | date:'short') : '-' }}</span>
                </div>

                <div *ngIf="request.message" class="rounded-xl bg-muted/50 border border-border p-3 text-sm">
                  <div class="flex items-center gap-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <lucide-icon [name]="MessageSquareIcon" [size]="12"></lucide-icon>
                    Message
                  </div>
                  {{ request.message }}
                </div>
              </div>

              <div class="text-sm text-muted-foreground md:text-right space-y-2">
                <div class="font-semibold text-foreground">Request ID: {{ request.id || '-' }}</div>
                <div>Team ID: {{ request.teamId || '-' }}</div>
                <div>Player ID: {{ request.playerId || '-' }}</div>

                <div *ngIf="isAdmin && (request.status || 'PENDING').toUpperCase() === 'PENDING' && request.id" class="flex md:justify-end gap-2 pt-1">
                  <button
                    (click)="acceptRequest(request)"
                    [disabled]="isProcessing(request.id)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors disabled:opacity-60"
                  >
                    <lucide-icon [name]="CheckCircle2Icon" [size]="13"></lucide-icon>
                    {{ isProcessing(request.id) ? 'Processing...' : 'Accept' }}
                  </button>
                  <button
                    (click)="rejectRequest(request)"
                    [disabled]="isProcessing(request.id)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors disabled:opacity-60"
                  >
                    <lucide-icon [name]="XCircleIcon" [size]="13"></lucide-icon>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="toast" class="fixed bottom-6 right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm font-medium text-foreground z-50">
        {{ toast }}
      </div>
    </div>
  `
})
export class AdminTeamRequestsComponent implements OnInit {
  readonly RefreshCcwIcon = RefreshCcw;
  readonly Loader2Icon = Loader2;
  readonly InboxIcon = Inbox;
  readonly UserIcon = User;
  readonly CalendarClockIcon = CalendarClock;
  readonly MessageSquareIcon = MessageSquare;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly XCircleIcon = XCircle;

  loading = true;
  errorBanner: string | null = null;
  toast: string | null = null;
  requests: TeamJoinRequest[] = [];
  processingRequestIds = new Set<number>();
  currentRole = (localStorage.getItem('user_type') || '').toUpperCase();

  constructor(
    private teamService: TeamService,
    private communityService: CommunityService,
    private cdr: ChangeDetectorRef
  ) {}

  get isAdmin(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ADMIN';
  }

  ngOnInit(): void {
    if (!this.isAdmin) {
      this.loading = false;
      this.errorBanner = 'Accès réservé aux administrateurs.';
      this.cdr.detectChanges();
      return;
    }

    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorBanner = null;

    this.teamService.getTeamMemberRequests().subscribe({
      next: (requests) => {
        this.requests = (requests || []).filter((request) => (request.status || 'PENDING').toUpperCase() === 'PENDING');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const status = (err as HttpErrorResponse)?.status;
        if (status === 401) {
          this.errorBanner = 'Session expirée. Reconnectez-vous avec un compte administrateur.';
        } else if (status === 403) {
          this.errorBanner = 'Accès refusé aux demandes d\'adhésion. Vérifiez le rôle ROLE_ADMIN et reconnectez-vous si nécessaire.';
        } else if (status === 400) {
          this.errorBanner = 'Requête invalide lors du chargement des demandes. Réessayez.';
        } else {
          this.errorBanner = this.teamService.extractErrorMessage(err);
        }
        this.cdr.detectChanges();
      }
    });
  }

  statusClasses(status?: string): string {
    const normalized = (status || 'PENDING').toUpperCase();
    if (normalized === 'APPROVED') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    if (normalized === 'REJECTED' || normalized === 'CANCELLED') return 'bg-red-500/15 text-red-700 dark:text-red-300';
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  }

  isProcessing(requestId: number): boolean {
    return this.processingRequestIds.has(requestId);
  }

  acceptRequest(request: TeamJoinRequest): void {
    const requestId = request.id || 0;
    if (!requestId) return;

    this.processingRequestIds.add(requestId);
    this.teamService.approveJoinRequest(requestId).subscribe({
      next: () => {
        this.processingRequestIds.delete(requestId);
        this.showToast('Demande approuvée avec succès.');
        this.communityService.notifyCommunityRefresh();
        this.loadRequests();
      },
      error: (err) => {
        this.processingRequestIds.delete(requestId);
        const status = (err as HttpErrorResponse)?.status;
        const message = status === 401
          ? 'Session expirée. Reconnectez-vous et réessayez.'
          : status === 403
            ? 'Accès refusé à l\'approbation. Vérifiez le rôle ROLE_ADMIN puis rechargez la session.'
            : status === 400
              ? 'Demande invalide. Vérifiez les données puis réessayez.'
              : this.teamService.extractErrorMessage(err);
        this.showToast(`Erreur approbation: ${message}`);
        this.cdr.detectChanges();
      }
    });
  }

  rejectRequest(request: TeamJoinRequest): void {
    const requestId = request.id || 0;
    if (!requestId) return;

    this.processingRequestIds.add(requestId);
    this.teamService.rejectJoinRequest(requestId).subscribe({
      next: () => {
        this.processingRequestIds.delete(requestId);
        this.showToast('Demande rejetée avec succès.');
        this.loadRequests();
      },
      error: (err) => {
        this.processingRequestIds.delete(requestId);
        const status = (err as HttpErrorResponse)?.status;
        const message = status === 401
          ? 'Session expirée. Reconnectez-vous et réessayez.'
          : status === 403
            ? 'Accès refusé au rejet de la demande. Vérifiez le rôle ROLE_ADMIN.'
            : status === 400
              ? 'Demande invalide. Vérifiez les données puis réessayez.'
              : this.teamService.extractErrorMessage(err);
        this.showToast(`Erreur rejet: ${message}`);
        this.cdr.detectChanges();
      }
    });
  }

  private showToast(message: string): void {
    this.toast = message;
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 2500);
  }
}