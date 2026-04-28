import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Building2, Loader2, RefreshCcw, Shield, Users, Eye, AlertTriangle, Heart, MessageCircle, Plus, X } from 'lucide-angular';
import { CommunityDetail, CommunityService, CommunitySummary } from '../services/community.service';
import { Category, ProductService } from '../services/product.service';
import { Team, TeamService } from '../services/team.service';
import { BadWordsFilterService } from '../services/bad-words-filter-service';


@Component({
  selector: 'app-communities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.06),transparent_45%)] p-4 md:p-6">
      <div class="max-w-[1400px] mx-auto">
        <div class="mb-8 rounded-3xl border border-border bg-card/80 backdrop-blur-sm px-5 py-6 md:px-7 md:py-7 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="mb-2 text-3xl md:text-4xl font-black tracking-tight">Communautés</h1>
            <p class="text-muted-foreground text-sm md:text-base">
              {{ isAdmin ? 'Vue globale des communautés' : 'Vous voyez uniquement les communautés auxquelles vous avez accès' }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button (click)="reload()" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 hover:bg-muted/70 transition-colors shadow-sm">
              <lucide-icon [name]="RefreshCcwIcon" [size]="16" [class.animate-spin]="loadingList"></lucide-icon>
              Actualiser
            </button>
            <button (click)="goBackToList()" *ngIf="selectedCommunityId" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 hover:bg-muted transition-colors shadow-sm">
              <lucide-icon [name]="ArrowLeftIcon" [size]="16"></lucide-icon>
              Retour à la liste
            </button>
          </div>
        </div>

        <div *ngIf="errorBanner" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{{ errorBanner }}</span>
          <button (click)="reload()" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <lucide-icon [name]="RefreshCcwIcon" [size]="14"></lucide-icon>
            Réessayer
          </button>
        </div>

        <div *ngIf="detailError" class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <lucide-icon [name]="AlertTriangleIcon" [size]="16"></lucide-icon>
          {{ detailError }}
        </div>

        <div class="grid gap-6 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <div class="bg-card rounded-3xl border border-border p-5 md:p-6 shadow-sm">
              <div class="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 class="mb-1 text-xl font-extrabold">Liste des communautés</h3>
                  <p class="text-sm text-muted-foreground">GET /api/communities</p>
                </div>
                <div class="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <lucide-icon [name]="EyeIcon" [size]="13"></lucide-icon>
                  {{ visibleCommunities.length }} visibles
                </div>
              </div>

              <div *ngIf="loadingList" class="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
                Chargement des communautés...
              </div>

              <div *ngIf="!loadingList && visibleCommunities.length === 0" class="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <div class="text-4xl mb-3">🏟️</div>
                <p class="font-semibold mb-1">Aucune communauté disponible</p>
                <p class="text-sm">Les communautés visibles apparaîtront ici selon votre accès.</p>
              </div>

              <div *ngIf="!loadingList && visibleCommunities.length > 0" class="grid gap-4 md:grid-cols-2">
                <button
                  *ngFor="let community of visibleCommunities"
                  (click)="openCommunity(community.id)"
                  class="text-left rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  [ngClass]="selectedCommunityId === community.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-card hover:bg-muted/30'"
                >
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 class="font-bold text-foreground mb-1">{{ community.name }}</h4>
                      <p class="text-xs text-muted-foreground line-clamp-2">{{ community.description || 'Aucune description disponible.' }}</p>
                    </div>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          [ngClass]="isAdmin ? 'bg-emerald-500/15 text-emerald-700' : 'bg-blue-500/15 text-blue-700'">
                      {{ isAdmin ? 'ADMIN' : 'ACCESSIBLE' }}
                    </span>
                  </div>

                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="inline-flex items-center gap-1"><lucide-icon [name]="Building2Icon" [size]="12"></lucide-icon>{{ community.categoryName || 'Catégorie' }}</span>
                    <span class="inline-flex items-center gap-1"><lucide-icon [name]="UsersIcon" [size]="12"></lucide-icon>{{ community.memberCount || 0 }} membres</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 bg-card rounded-3xl border border-border p-5 md:p-6 shadow-sm lg:sticky lg:top-6 h-fit">
            <div *ngIf="loadingDetail" class="flex flex-col items-center py-12 gap-3 text-muted-foreground">
              <lucide-icon [name]="Loader2Icon" [size]="28" class="animate-spin"></lucide-icon>
              Chargement du détail...
            </div>

            <ng-container *ngIf="!loadingDetail">
              <div *ngIf="selectedCommunity; else emptyDetail">
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 class="mb-1">{{ selectedCommunity.name }}</h3>
                    <p class="text-xs text-muted-foreground">GET /api/communities/{{ selectedCommunity.id }}</p>
                  </div>
                  <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg">
                    <lucide-icon [name]="ShieldIcon" [size]="24"></lucide-icon>
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 mb-4">
                  <div>
                    <div class="font-semibold text-sm">Partager avec la communauté</div>
                    <div class="text-xs text-muted-foreground">Les joueurs peuvent publier dans cette communauté.</div>
                  </div>
                  <button
                    (click)="toggleComposer()"
                    class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <lucide-icon [name]="PlusIcon" [size]="15"></lucide-icon>
                    {{ showPostComposer ? 'Masquer le formulaire' : 'Ajouter un post' }}
                  </button>
                </div>

                <div class="space-y-4 text-sm">

                  <div *ngIf="canCreatePosts && showPostComposer" class="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-accent/5 p-5 mt-5 space-y-4 shadow-sm">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                          <lucide-icon [name]="MessageCircleIcon" [size]="12"></lucide-icon>
                          Nouveau post
                        </div>
                        <div class="font-semibold text-foreground">Publier dans {{ selectedCommunity.name }}</div>
                        <div class="text-xs text-muted-foreground">Les membres peuvent publier directement dans cette communauté.</div>
                      </div>
                      <button
                        (click)="submitPost()"
                        [disabled]="posting || !newPostContent.trim() || !canSubmitPost"
                        class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <lucide-icon *ngIf="!posting" [name]="RefreshCcwIcon" [size]="15"></lucide-icon>
                        <lucide-icon *ngIf="posting" [name]="Loader2Icon" [size]="15" class="animate-spin"></lucide-icon>
                        Publier
                      </button>
                    </div>

                    <textarea
                      [(ngModel)]="newPostContent"
                      rows="3"
                      placeholder="Partagez quelque chose avec cette communauté..."
                      class="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    ></textarea>

                    <div class="rounded-xl bg-muted/20 border border-border p-3 text-xs text-muted-foreground">
                      Les nouveaux posts sont enregistrés dans la communauté sélectionnée et visibles après publication.
                    </div>
                  </div>

                  <div *ngIf="!canCreatePosts" class="rounded-xl border border-dashed border-border bg-muted/20 p-4 mt-5 text-sm text-muted-foreground">
                    {{ postComposerHint }}
                  </div>

                  <div class="rounded-2xl border border-border bg-card p-4 mt-5">
                    <div class="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div class="font-semibold text-base">Posts récents</div>
                        <div class="text-xs text-muted-foreground">Filtrés sur la communauté sélectionnée</div>
                      </div>
                      <button (click)="reloadPosts()" class="text-xs font-semibold text-primary hover:underline" [disabled]="loadingPosts">
                        Actualiser
                      </button>
                    </div>

                    <div *ngIf="loadingPosts" class="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <lucide-icon [name]="Loader2Icon" [size]="16" class="animate-spin"></lucide-icon>
                      Chargement des posts...
                    </div>

                    <div *ngIf="postsAccessDenied" class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
                      {{ usingFallbackCommunities
                        ? 'Posts indisponibles: ces cartes viennent du fallback local et ne pointent pas vers une communauté backend autorisée.'
                        : 'Access denied for this community. You are not allowed to view posts in this community.' }}
                    </div>

                    <div *ngIf="!loadingPosts && communityPosts.length === 0" class="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                      Aucun post pour cette communauté pour le moment.
                    </div>

                    <div *ngIf="!loadingPosts && communityPosts.length > 0" class="space-y-3 max-h-72 overflow-auto pr-1">
                      <div *ngFor="let post of communityPosts" class="rounded-2xl border border-border bg-muted/20 p-3">
                        <div class="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div class="font-semibold text-sm">{{ post.authorName || post.author || 'Utilisateur' }}</div>
                            <div class="text-[11px] text-muted-foreground">{{ formatDate(post.createdAt || post.time) }}</div>
                          </div>
                          <div class="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">Post</div>
                        </div>
                        <p class="text-sm whitespace-pre-line text-foreground">{{ post.content }}</p>
                        <div class="mt-3 flex items-center gap-2 border-t border-border pt-3">

                          <!-- Bouton réaction avec popup -->
                          <div style="position: relative; display: inline-block;"
                              (mouseenter)="post.showReactions = true"
                              (mouseleave)="scheduleHideReactions(post)">

                            <!-- Popup réactions -->
                            <div *ngIf="post.showReactions"
                                (mouseenter)="cancelHideReactions(post)"
                                (mouseleave)="scheduleHideReactions(post)"
                                style="position: absolute; bottom: 110%; left: -8px; z-index: 50;"
                                class="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-lg">
                              <button *ngFor="let r of reactions"
                                      (click)="selectReaction(post, r)"
                                      [title]="r.label"
                                      class="text-2xl transition-transform duration-150 hover:scale-125 hover:-translate-y-1 border-none bg-transparent cursor-pointer p-1 rounded-full">
                                {{ r.emoji }}
                              </button>
                            </div>

                            <!-- Bouton principal -->
<button (click)="selectReaction(post, post.myReaction ? null : reactions[0])"
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border-none bg-transparent cursor-pointer"
        [style.color]="post.myReaction ? getReactionColor(post.myReaction) : 'var(--color-text-secondary)'">
  <span class="transition-transform duration-150"
        [class.scale-125]="post.reactionAnimating">
    {{ post.myReaction ? getReactionEmoji(post.myReaction) : '👍' }}
  </span>
  <span>{{ post.myReaction ? getReactionLabel(post.myReaction) : "J'aime" }}</span>
</button>

<!-- ✅ Compteur cliquable EN DEHORS du bouton -->
<span *ngIf="post.totalReactions > 0"
      class="ml-1 text-xs opacity-70 cursor-pointer hover:underline"
      [style.color]="post.myReaction ? getReactionColor(post.myReaction) : 'var(--color-text-secondary)'"
      (click)="openReactionsModal(post)">
  {{ post.totalReactions }}
</span>
                          </div>

                          <!-- Bouton commenter -->
                          <button (click)="toggleComments(post)"
                                  class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                            <lucide-icon [name]="MessageCircleIcon" [size]="14"></lucide-icon>
                            {{ post.commentsCount ?? post.comments ?? 0 }} Commenter
                          </button>

                        </div>

                        <div *ngIf="post.showComment" class="mt-4 pt-4 border-t border-border space-y-3">
                          <div *ngIf="post.loadingComments" class="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <lucide-icon [name]="Loader2Icon" [size]="16" class="animate-spin"></lucide-icon>
                            Chargement des commentaires...
                          </div>

                          <div *ngIf="!post.loadingComments" class="space-y-2 max-h-64 overflow-y-auto pr-1">
                            <div *ngFor="let comment of post.commentList" class="rounded-xl bg-card border border-border px-3 py-2">
                              <div class="flex items-start justify-between gap-3 mb-1">
                                <div class="text-xs font-semibold text-foreground">
                                  {{ comment.authorName || comment.authorFirstName || 'Utilisateur' }}
                                </div>
                                <div class="text-[11px] text-muted-foreground">{{ formatDate(comment.createdAt) }}</div>
                              </div>
                              <p class="text-sm text-foreground whitespace-pre-line">{{ comment.content }}</p>
                            </div>

                            <div *ngIf="!post.commentList || post.commentList.length === 0" class="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                              Soyez le premier à commenter.
                            </div>
                          </div>

                          <div class="flex gap-2 items-start">
                            <input
                              [(ngModel)]="post.commentInput"
                              placeholder="Écrire un commentaire..."
                              (keyup.enter)="addComment(post)"
                              class="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                              (click)="addComment(post)"
                              [disabled]="post.addingComment || !post.commentInput?.trim()"
                              class="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {{ post.addingComment ? '...' : 'Envoyer' }}
                            </button>
                            <button
                              (click)="toggleComments(post)"
                              class="inline-flex items-center justify-center rounded-full border border-border bg-card px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="Fermer les commentaires"
                            >
                              <lucide-icon [name]="XIcon" [size]="14"></lucide-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #emptyDetail>
                <div class="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                  <div class="text-4xl mb-3">🔎</div>
                  <p class="font-semibold mb-1">Sélectionnez une communauté</p>
                  <p class="text-sm">Le détail s’affiche ici.</p>
                </div>
              </ng-template>
            </ng-container>
          </div>
        </div>
      </div>

      <div *ngIf="toast" class="fixed bottom-6 right-6 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-xl">
        {{ toast }}
      </div>


<div *ngIf="showReactionsModal"
     style="position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem;"
     (click)="closeReactionsModal()">

  <div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; width: 100%; max-width: 400px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; color: #111;"
       (click)="$event.stopPropagation()">

    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f0f0f0;">
      <span style="font-size: 15px; font-weight: 600; color: #111;">Réactions</span>
      <button (click)="closeReactionsModal()"
              style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e5e7eb; background: #f5f5f5; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px;">✕</button>
    </div>

    <!-- Filtres -->
    <div style="display: flex; gap: 6px; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; overflow-x: auto;">
      <button (click)="filterReactionModal(null)"
              style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s;"
              [style.border]="activeReactionFilter === null ? '1.5px solid #378ADD' : '1px solid #e5e7eb'"
              [style.background]="activeReactionFilter === null ? '#E6F1FB' : 'white'"
              [style.color]="activeReactionFilter === null ? '#0C447C' : '#666'">
        Tous
        <span style="border-radius: 10px; padding: 1px 7px; font-size: 11px;"
              [style.background]="activeReactionFilter === null ? '#378ADD' : '#f0f0f0'"
              [style.color]="activeReactionFilter === null ? 'white' : '#666'">
          {{ modalReactionUsers.length }}
        </span>
      </button>

      <button *ngFor="let r of getModalReactionTypes()"
              (click)="filterReactionModal(r.type)"
              style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s;"
              [style.border]="activeReactionFilter === r.type ? '1.5px solid #378ADD' : '1px solid #e5e7eb'"
              [style.background]="activeReactionFilter === r.type ? '#E6F1FB' : 'white'"
              [style.color]="activeReactionFilter === r.type ? '#0C447C' : '#666'">
        <span style="font-size: 15px;">{{ r.emoji }}</span>
        {{ r.count }}
      </button>
    </div>

    <!-- Liste users -->
    <div style="overflow-y: auto; flex: 1; padding: 8px 0;">
      <div *ngIf="loadingModalReactions"
           style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 2rem; color: #888; font-size: 13px;">
        <lucide-icon [name]="Loader2Icon" [size]="16" class="animate-spin"></lucide-icon>
        Chargement...
      </div>

      <div *ngIf="!loadingModalReactions && filteredModalUsers.length === 0"
           style="text-align: center; padding: 2rem; color: #888; font-size: 13px;">
        Aucune réaction pour le moment.
      </div>

      <div *ngFor="let user of filteredModalUsers"
           style="display: flex; align-items: center; gap: 12px; padding: 10px 20px; transition: background 0.1s; cursor: default;"
           onmouseenter="this.style.background='#f9f9f9'"
           onmouseleave="this.style.background='white'">

        <!-- Avatar + badge -->
        <div style="position: relative; flex-shrink: 0;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: #E6F1FB; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #0C447C;">
            {{ getInitials(user.firstName + ' ' + user.lastName) }}
          </div>
          <div style="position: absolute; bottom: -3px; right: -3px; width: 20px; height: 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 1.5px solid white;">
            {{ getReactionEmoji(user.reactionType) }}
          </div>
        </div>

        <!-- Nom + label -->
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13px; font-weight: 500; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ user.firstName }} {{ user.lastName }}
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 1px;">
            {{ getReactionLabel(user.reactionType) }}
          </div>
        </div>

        <span style="font-size: 20px; flex-shrink: 0;">{{ getReactionEmoji(user.reactionType) }}</span>
      </div>
    </div>
  </div>
</div>

    </div>
  `
})
export class CommunitiesComponent implements OnInit, OnDestroy {
  readonly ArrowLeftIcon = ArrowLeft;
  readonly Building2Icon = Building2;
  readonly Loader2Icon = Loader2;
  readonly HeartIcon = Heart;
  readonly MessageCircleIcon = MessageCircle;
  readonly PlusIcon = Plus;
  readonly XIcon = X;
  readonly RefreshCcwIcon = RefreshCcw;
  readonly ShieldIcon = Shield;
  readonly UsersIcon = Users;
  readonly EyeIcon = Eye;
  readonly AlertTriangleIcon = AlertTriangle;

  loadingList = true;
  loadingDetail = false;
  errorBanner: string | null = null;
  detailError: string | null = null;
  toast: string | null = null;
  loadingPosts = false;
  postsAccessDenied = false;
  canPostInSelectedCommunity = false;
  posting = false;
  newPostContent = '';
  showPostComposer = true;
  posts: any[] = [];

  currentRole = (localStorage.getItem('user_type') || '').toUpperCase();
  selectedCommunityId: number | null = null;
  selectedCommunity: CommunityDetail | null = null;
  communities: CommunitySummary[] = [];
  visibleCommunities: CommunitySummary[] = [];
  loadingFallback = false;
  usingFallbackCommunities = false;
  private readonly forbiddenPostCommunityIds = new Set<number>();
  private readonly missingDetailCommunityIds = new Set<number>();
  private lastLoadedPostsCommunityId: number | null = null;

  private readonly subscriptions = new Subscription();
  // Propriétés à ajouter
  showReactionsModal = false;
  loadingModalReactions = false;
  modalReactionUsers: any[] = [];
  activeReactionFilter: string | null = null;
  private currentModalPostId: number | null = null;
  constructor(
    private communityService: CommunityService,
    private productService: ProductService,
    private teamService: TeamService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private badWordsFilter: BadWordsFilterService  // ✅ ajout

  ) { }

  get isAdmin(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ADMIN';
  }

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  get canCreatePosts(): boolean {
    return this.isAuthenticated;
  }

  get canSubmitPost(): boolean {
    if (!this.isAuthenticated) return false;
    if (!this.selectedCommunityId) return false;
    if (this.loadingPosts) return false;
    if (this.postsAccessDenied) return false;
    return !this.forbiddenPostCommunityIds.has(this.selectedCommunityId);
  }

  get postComposerHint(): string {
    if (!this.isAuthenticated) {
      return 'Connectez-vous pour publier dans cette communauté.';
    }
    if (this.postsAccessDenied) {
      return 'Vous n\'êtes pas autorisé à publier dans cette communauté.';
    }
    if (this.usingFallbackCommunities) {
      return 'Communauté affichée en mode fallback. La publication peut dépendre de la disponibilité de la communauté backend.';
    }
    return 'La publication est indisponible pour le moment.';
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.communityService.communityRefresh$.subscribe(() => {
        this.loadCommunities(false);
        if (this.selectedCommunityId) {
          this.loadPosts();
        }
      })
    );

    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const routeId = Number(params.get('id') || 0);
        this.selectedCommunityId = Number.isFinite(routeId) && routeId > 0 ? routeId : null;
        this.loadCommunities(true);
      })
    );

    this.loadCommunities(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  reload(): void {
    this.loadCommunities(true);
    if (this.selectedCommunityId) {
      this.loadPosts();
    }
  }

loadCommunities(loadDetail = true): void {
    this.loadingList = true;
    this.errorBanner = null;
    this.communityService.getCommunities().subscribe({
        next: (communities) => {
            this.communities = (communities || []).map((community) => this.normalizeCommunity(community));
            this.visibleCommunities = this.communities;
            this.usingFallbackCommunities = false;
            this.loadingList = false;
            this.loadingFallback = false;

            const selectedFromRoute = this.selectedCommunityId
                ? this.visibleCommunities.find((c) => c.id === this.selectedCommunityId) || null
                : null;

            if (selectedFromRoute) {
                this.selectedCommunity = selectedFromRoute as CommunityDetail;
                if (loadDetail) this.loadCommunityDetail(selectedFromRoute.id);
                this.loadPosts();
            } else if (this.visibleCommunities.length > 0) {
                const first = this.visibleCommunities[0];
                this.selectedCommunityId = first.id;
                this.selectedCommunity = first as CommunityDetail;
                if (loadDetail) this.loadCommunityDetail(first.id);
                this.loadPosts();
            } else {
                this.selectedCommunity = null;
                this.detailError = null;
            }

            this.cdr.detectChanges();
        },
        error: (err) => {
            this.loadingList = false;
            this.errorBanner = this.toReadableError(err);
            this.cdr.detectChanges();
        }
    });
}






  openCommunity(id: number, navigate = true): void {
    this.selectedCommunityId = id;
    this.detailError = null;
    this.postsAccessDenied = false;
    this.canPostInSelectedCommunity = false;
    const selectedSummary = this.visibleCommunities.find((community) => community.id === id) || this.communities.find((community) => community.id === id) || null;
    if (selectedSummary) {
      this.selectedCommunity = selectedSummary as CommunityDetail;
    }
    if (navigate && !this.usingFallbackCommunities) {
      this.router.navigate(['/app/communities', id]);
      this.loadPosts();
    } else if (navigate && this.usingFallbackCommunities) {
      this.router.navigate(['/app/communities']);
      this.loadPosts();
    } else {
      if (!this.usingFallbackCommunities) {
        this.loadCommunityDetail(id);
      }
      this.loadPosts();
    }
  }

  goBackToList(): void {
    this.selectedCommunityId = null;
    this.selectedCommunity = null;
    this.detailError = null;
    this.router.navigate(['/app/communities']);
    this.posts = [];
    this.postsAccessDenied = false;
    this.canPostInSelectedCommunity = false;
    this.lastLoadedPostsCommunityId = null;
  }

  toggleComposer(): void {
    this.showPostComposer = !this.showPostComposer;
  }

  get communityPosts(): any[] {
    if (this.selectedCommunityId === null) {
      return [];
    }

    return this.posts;
  }

  private matchesSelectedCommunity(post: any): boolean {
    const selectedId = Number(this.selectedCommunityId || 0);
    const postCommunityId = Number(post?.communityId || post?.community?.id || post?.community?.communityId || post?.community?.communityId || 0);

    if (selectedId > 0 && postCommunityId === selectedId) {
      return true;
    }

    const selectedCommunity = this.selectedCommunity;
    const postCategoryId = Number(post?.categoryId || post?.community?.categoryId || post?.community?.category?.id || 0);
    if (selectedCommunity?.categoryId && postCategoryId === Number(selectedCommunity.categoryId)) {
      return true;
    }

    const selectedName = this.normalizeCommunityName(selectedCommunity?.name || selectedCommunity?.categoryName || '');
    const postCommunityName = this.normalizeCommunityName(
      post?.community?.name || post?.communityName || post?.categoryName || post?.community?.categoryName || ''
    );

    if (selectedName && postCommunityName && selectedName === postCommunityName) {
      return true;
    }

    return false;
  }

  private loadCommunityDetail(id: number): void {
    if (this.usingFallbackCommunities || this.missingDetailCommunityIds.has(id)) {
      return;
    }

    this.loadingDetail = true;
    this.detailError = null;
    this.communityService.getCommunityById(id).subscribe({
      next: (detail) => {
        const normalizedDetail = this.normalizeCommunity(detail) as CommunityDetail;
        this.selectedCommunity = {
          ...(this.selectedCommunity || {}),
          ...normalizedDetail
        };
        this.loadingDetail = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingDetail = false;
        const status = (err as HttpErrorResponse)?.status;
        if (status === 404) {
          this.missingDetailCommunityIds.add(id);
        }
        if (status === 401) {
          this.detailError = 'Session expirée. Reconnectez-vous pour voir cette communauté.';
        } else if (status === 403) {
          this.detailError = 'You are not authorized to view this community.';
        } else if (status === 404) {
          this.detailError = 'Community details are not available for this card.';
        } else {
          this.detailError = this.toReadableError(err);
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadPosts(): void {
    if (!this.selectedCommunityId) {
      this.posts = [];
      this.loadingPosts = false;
      this.canPostInSelectedCommunity = false;
      this.lastLoadedPostsCommunityId = null;
      return;
    }

    if (this.loadingPosts && this.lastLoadedPostsCommunityId === this.selectedCommunityId) {
      return;
    }

    if (this.forbiddenPostCommunityIds.has(this.selectedCommunityId)) {
      this.posts = [];
      this.postsAccessDenied = true;
      this.canPostInSelectedCommunity = false;
      return;
    }

    this.loadingPosts = true;
    this.postsAccessDenied = false;
    this.lastLoadedPostsCommunityId = this.selectedCommunityId;
    this.communityService.getCommunityPosts(this.selectedCommunityId).subscribe({
      next: (data: any) => {
        const items = data?.content ?? data ?? [];
        this.posts = Array.isArray(items)
          ? items.map((post: any) => this.normalizePost(post))
          : [];
        this.canPostInSelectedCommunity = true;
        this.loadingPosts = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.posts = [];
        this.loadingPosts = false;
        this.canPostInSelectedCommunity = false;
        const status = (error as HttpErrorResponse)?.status;
        this.postsAccessDenied = status === 403;
        if (status === 403) {
          this.forbiddenPostCommunityIds.add(this.selectedCommunityId!);
          this.showToast('You are not allowed to view posts in this community.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  reloadPosts(): void {
    this.loadPosts();
  }

  submitPost(): void {
    const rawContent = this.newPostContent.trim();
    if (!rawContent || !this.selectedCommunityId || this.posting || !this.isAuthenticated) {
      if (!this.isAuthenticated) {
        this.showToast('Connectez-vous pour publier dans cette communauté.');
      }
      return;
    }

    if (this.loadingPosts) {
      this.showToast('Vérification des permissions en cours...');
      return;
    }

    if (this.postsAccessDenied) {
      this.showToast('You are not allowed to post in this community.');
      return;
    }

    if (this.forbiddenPostCommunityIds.has(this.selectedCommunityId)) {
      this.postsAccessDenied = true;
      this.detailError = 'You are not allowed to post in this community.';
      this.showToast('You are not allowed to post in this community.');
      this.cdr.detectChanges();
      return;
    }

    if (this.isMembershipDeniedForSelectedCommunity()) {
      this.postsAccessDenied = true;
      this.detailError = 'You are not allowed to post in this community.';
      this.showToast('You are not allowed to post in this community.');
      this.cdr.detectChanges();
      return;
    }

    // ✅ Filtrer les bad words avant envoi
    const content = this.badWordsFilter.filter(rawContent);
    const title = this.derivePostTitle(content);

    this.posting = true;
    this.communityService.createCommunityPost(this.selectedCommunityId, { title, content }).subscribe({
      next: (post: any) => {
        const createdPost = this.normalizePost({
          ...post,
          communityId: post?.communityId || this.selectedCommunityId,
          community: post?.community || this.selectedCommunity || { id: this.selectedCommunityId }
        });
        this.posts.unshift(createdPost);
        this.newPostContent = '';
        this.posting = false;
        this.showToast('Post publié dans la communauté.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.posting = false;
        if ((err as HttpErrorResponse)?.status === 403) {
          this.postsAccessDenied = true;
          if (this.selectedCommunityId) {
            this.forbiddenPostCommunityIds.add(this.selectedCommunityId);
          }
          this.detailError = 'You are not allowed to post in this community.';
          this.showToast('You are not allowed to post in this community.');
          this.cdr.detectChanges();
          return;
        }
        this.showToast(this.toReadableError(err));
        this.cdr.detectChanges();
      }
    });
  }
  private derivePostTitle(content: string): string {
    const firstLine = content.split('\n').map((line) => line.trim()).find((line) => line.length > 0) || '';
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
  }

  private isMembershipDeniedForSelectedCommunity(): boolean {
    if (this.isAdmin) {
      return false;
    }

    const userId = Number(localStorage.getItem('user_id') || 0);
    if (!userId || !this.selectedCommunity) {
      return false;
    }

    const communityMembers = Array.isArray(this.selectedCommunity.members) ? this.selectedCommunity.members : [];
    if (communityMembers.length > 0) {
      const isMember = communityMembers.some((member: any) => Number(member?.userId || member?.id) === userId);
      return !isMember;
    }

    const teams = Array.isArray(this.selectedCommunity.teams) ? this.selectedCommunity.teams : [];
    const teamMembers = teams.flatMap((team: any) => Array.isArray(team?.members) ? team.members : []);
    if (teamMembers.length > 0) {
      const isMember = teamMembers.some((member: any) => Number(member?.userId || member?.id) === userId);
      return !isMember;
    }

    return false;
  }

  toggleLike(post: any): void {
    const previousLiked = !!post.liked;
    const previousLikesCount = Number(post.likesCount ?? post.likes ?? 0);

    post.liked = !previousLiked;
    post.likesCount = previousLikesCount + (post.liked ? 1 : -1);

    this.communityService.toggleLike(post.id).subscribe({
      error: () => {
        post.liked = previousLiked;
        post.likesCount = previousLikesCount;
        this.showToast('Erreur lors de l\'ajout du like');
        this.cdr.detectChanges();
      }
    });
  }

  toggleComments(post: any): void {
    post.showComment = !post.showComment;

    if (!post.showComment) {
      return;
    }

    if (Array.isArray(post.commentList) && post.commentList.length > 0) {
      return;
    }

    post.loadingComments = true;
    this.communityService.getComments(post.id).subscribe({
      next: (comments) => {
        post.commentList = Array.isArray(comments) ? comments : [];
        post.loadingComments = false;
        this.cdr.detectChanges();
      },
      error: () => {
        post.loadingComments = false;
        this.showToast('Impossible de charger les commentaires');
        this.cdr.detectChanges();
      }
    });
  }

  addComment(post: any): void {
    const rawContent = (post.commentInput || '').trim();
    if (!rawContent || post.addingComment) {
      return;
    }

    // ✅ Filtrer les bad words avant envoi
    const content = this.badWordsFilter.filter(rawContent);

    post.addingComment = true;
    this.communityService.addComment(post.id, { content }).subscribe({
      next: (comment) => {
        post.commentsCount = Number(post.commentsCount ?? post.comments ?? 0) + 1;
        post.commentInput = '';
        if (!Array.isArray(post.commentList)) {
          post.commentList = [];
        }
        post.commentList.push(comment);
        post.addingComment = false;
        this.cdr.detectChanges();
      },
      error: () => {
        post.addingComment = false;
        this.showToast('Erreur lors de l\'envoi du commentaire');
        this.cdr.detectChanges();
      }
    });
  }

  private normalizeCommunity(raw: any): CommunitySummary {
    const id = Number(raw?.id || raw?.communityId || 0);
    const category = raw?.category || raw?.sportCategory || raw?.sport || null;
    const categoryName = raw?.categoryName || raw?.category?.nom || raw?.category?.name || raw?.name || raw?.title || '';
    const teams = Array.isArray(raw?.teams) ? raw.teams : Array.isArray(raw?.teamList) ? raw.teamList : [];
    const members = Array.isArray(raw?.members) ? raw.members : Array.isArray(raw?.memberList) ? raw.memberList : [];

    return {
      ...raw,
      id,
      name: raw?.name || raw?.title || categoryName || `Communauté #${id}`,
      description: raw?.description || raw?.summary || '',
      categoryId: Number(raw?.categoryId || category?.id || 0) || undefined,
      categoryName,
      memberCount: Number(raw?.memberCount || members.length || 0),
      teamCount: Number(raw?.teamCount || teams.length || 0),
      teams,
      members,
      access: raw?.access || raw?.visibility || (this.isAdmin ? 'ALL' : 'MEMBER'),
      visible: raw?.visible !== false || this.isAdmin
    };
  }

private normalizePost(post: any): any {
  const normalized: any = {
    ...post,
    liked: post?.likedByCurrentUser === true || post?.liked === true,
    myReaction: post?.myReaction || null,
    totalReactions: post?.totalReactions || post?.likesCount || 0,
    reactionCounts: post?.reactionCounts || {},
    showReactions: false,
    reactionAnimating: false,
    hideReactionTimer: null,
    showComment: false,
    commentInput: '',
    commentList: [],
    loadingComments: false,
    addingComment: false
  };

  // ✅ Charger la réaction de l'user au refresh
  this.communityService.getReactions(post.id).subscribe({
    next: (res) => {
      normalized.myReaction = res.myReaction || null;
      normalized.totalReactions = res.totalCount || 0;
      normalized.reactionCounts = res.counts || {};
      this.cdr.detectChanges();
    },
    error: () => {}
  });

  return normalized;
}

  private normalizeCommunityName(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  formatDate(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private toReadableError(error: unknown): string {
    const httpError = error as HttpErrorResponse;
    if (httpError?.status === 401) return 'Session expirée. Reconnectez-vous.';
    if (httpError?.status === 403) return 'You are not authorized to view this community.';
    if (httpError?.status === 404) return 'Communauté introuvable.';
    if (httpError?.status === 0) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';

    const serverMessage = (httpError?.error?.message || httpError?.error?.error || httpError?.message || '').toString().trim();
    return serverMessage || 'Erreur inattendue lors du chargement des communautés.';
  }

  private showToast(message: string): void {
    this.toast = message;
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 2800);
  }


  readonly reactions = [
    { type: 'LIKE', emoji: '👍', label: "J'aime", color: '#1877f2' },
    { type: 'LOVE', emoji: '❤️', label: "J'adore", color: '#f33e58' },
    { type: 'HAHA', emoji: '😂', label: 'Haha', color: '#f7b125' },
    { type: 'WOW', emoji: '😮', label: 'Wow', color: '#f7b125' },
    { type: 'SAD', emoji: '😢', label: 'Triste', color: '#f7b125' },
    { type: 'ANGRY', emoji: '😡', label: 'Grrr', color: '#e9710f' },
  ];

  selectReaction(post: any, reaction: any): void {
    post.showReactions = false;

    const previousType = post.myReaction;
    const previousCount = post.totalReactions || 0;

    if (!reaction || reaction.type === previousType) {
      // Toggle off
      post.myReaction = null;
      post.totalReactions = Math.max(0, previousCount - 1);
    } else {
      post.myReaction = reaction.type;
      post.totalReactions = previousType ? previousCount : previousCount + 1;
    }

    // Animation
    post.reactionAnimating = true;
    setTimeout(() => { post.reactionAnimating = false; this.cdr.detectChanges(); }, 300);
    this.cdr.detectChanges();

    const type = post.myReaction || previousType;
    this.communityService.react(post.id, type).subscribe({
      next: (res) => {
        post.totalReactions = res.totalCount;
        post.reactionCounts = res.counts;
        this.cdr.detectChanges();
      },
      error: () => {
        post.myReaction = previousType;
        post.totalReactions = previousCount;
        this.showToast('Erreur lors de la réaction');
        this.cdr.detectChanges();
      }
    });
  }

  scheduleHideReactions(post: any): void {
    post.hideReactionTimer = setTimeout(() => {
      post.showReactions = false;
      this.cdr.detectChanges();
    }, 300);
  }

  cancelHideReactions(post: any): void {
    if (post.hideReactionTimer) {
      clearTimeout(post.hideReactionTimer);
      post.hideReactionTimer = null;
    }
  }

  getReactionEmoji(type: string): string {
    return this.reactions.find(r => r.type === type)?.emoji || '👍';
  }

  getReactionLabel(type: string): string {
    return this.reactions.find(r => r.type === type)?.label || "J'aime";
  }

  getReactionColor(type: string): string {
    return this.reactions.find(r => r.type === type)?.color || 'var(--color-text-secondary)';
  }

  ////////////////////////
  // Getter pour filtrer
  get filteredModalUsers(): any[] {
    if (!this.activeReactionFilter) return this.modalReactionUsers;
    return this.modalReactionUsers.filter(u => u.reactionType === this.activeReactionFilter);
  }

  // Méthodes
  openReactionsModal(post: any): void {
    this.showReactionsModal = true;
    this.activeReactionFilter = null;
    this.loadingModalReactions = true;
    this.currentModalPostId = post.id;
    this.modalReactionUsers = [];

    this.communityService.getReactionUsers(post.id).subscribe({
      next: (users) => {
        this.modalReactionUsers = users || [];
        this.loadingModalReactions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingModalReactions = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeReactionsModal(): void {
    this.showReactionsModal = false;
    this.modalReactionUsers = [];
    this.activeReactionFilter = null;
    this.currentModalPostId = null;
  }

  filterReactionModal(type: string | null): void {
    this.activeReactionFilter = type;
  }

  getModalReactionTypes(): { type: string; emoji: string; count: number }[] {
    const map = new Map<string, number>();
    this.modalReactionUsers.forEach(u => {
      map.set(u.reactionType, (map.get(u.reactionType) || 0) + 1);
    });
    return Array.from(map.entries()).map(([type, count]) => ({
      type,
      emoji: this.getReactionEmoji(type),
      count
    }));
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(' ').filter(n => n.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }



}
