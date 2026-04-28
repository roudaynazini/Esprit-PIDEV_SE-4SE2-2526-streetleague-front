import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule, Users, Shield, Plus, Loader2, X, RefreshCcw, Eye, Sparkles, ChevronLeft, ChevronRight } from 'lucide-angular';
import { TeamService, Team, TeamPayload } from '../services/team.service';
import { MatchResponse, MatchingService, PlayerProfileMatchingRequest } from '../services/matching.service';

type SmartMatchProfileType = 'PLAYER' | 'TEAM';

interface SmartMatchAvailability {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface SmartMatchRequiredPosition {
  position: string;
  neededCount: number;
}

interface SmartMatchPlayerProfile {
  type: 'PLAYER';
  name: string;
  sportType: string;
  skillLevel: string;
  position: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  availability: SmartMatchAvailability[];
  preferredPlayStyle: string;
  rating: number | null;
}

interface SmartMatchTeamProfile {
  type: 'TEAM';
  teamName: string;
  sportType: string;
  teamLevel: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  requiredPositions: SmartMatchRequiredPosition[];
  schedule: SmartMatchAvailability[];
  description: string;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background">
      <div class="relative h-48 overflow-hidden border-b border-border">
        <div class="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-20"></div>
        <div class="absolute inset-0 flex items-center">
          <div class="container mx-auto px-4 max-w-7xl">
            <div class="flex items-center gap-6">
              <div class="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl border-4 border-background">
                <lucide-icon [name]="ShieldIcon" [size]="48" class="text-white"></lucide-icon>
              </div>
              <div>
                <h1 class="mb-2">Équipes</h1>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <lucide-icon [name]="UsersIcon" [size]="16"></lucide-icon>
                    {{ teams.length }} Équipe(s)
                  </span>
                  <span *ngIf="isAdmin">Mode admin: vue globale des équipes</span>
                  <span *ngIf="!isAdmin">Mode utilisateur: la liste peut être filtrée côté backend</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8 max-w-7xl">
        <div class="flex justify-end gap-3 mb-6">
          <button (click)="openSmartMatchModal()" class="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-500/90 transition-all shadow-lg shadow-amber-500/30">
            <lucide-icon [name]="SparklesIcon" [size]="16"></lucide-icon>
            Smart Match
          </button>
          <button *ngIf="isAdmin" (click)="openManageRequests()" class="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-all border border-border">
            <lucide-icon [name]="EyeIcon" [size]="16"></lucide-icon>
            Manage Request
          </button>
          <button *ngIf="isAdmin" (click)="openCreateModal()" class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
            <lucide-icon [name]="PlusIcon" [size]="16"></lucide-icon>
            Créer une équipe
          </button>
        </div>

        <div *ngIf="errorBanner" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{{ errorBanner }}</span>
          <button (click)="loadTeams()" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <lucide-icon [name]="RefreshCcwIcon" [size]="14"></lucide-icon>
            Réessayer
          </button>
        </div>

        <div *ngIf="showSmartMatchModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div class="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-foreground">Smart Match</h3>
              <button (click)="closeSmartMatchModal()" class="p-2 hover:bg-muted rounded-lg transition-colors">
                <lucide-icon [name]="XIcon" [size]="20" class="text-muted-foreground"></lucide-icon>
              </button>
            </div>

            <div *ngIf="!smartMatchType" class="space-y-4">
              <p class="text-sm text-muted-foreground">Choisissez un type de profil. Ensuite, nous poserons les questions une par une.</p>
              <div class="grid sm:grid-cols-2 gap-4">
                <button (click)="selectSmartMatchType('PLAYER')" class="p-4 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 text-left transition-all">
                  <div class="font-semibold">PLAYER</div>
                  <div class="text-sm text-muted-foreground mt-1">Profil joueur pour matching intelligent.</div>
                </button>
                <button (click)="selectSmartMatchType('TEAM')" class="p-4 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 text-left transition-all">
                  <div class="font-semibold">TEAM</div>
                  <div class="text-sm text-muted-foreground mt-1">Profil équipe avec besoins de postes.</div>
                </button>
              </div>
            </div>

            <div *ngIf="smartMatchType" class="space-y-4">
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>Type: {{ smartMatchType }}</span>
                <span>Étape {{ smartMatchStepIndex + 1 }} / {{ smartMatchSteps.length }}</span>
              </div>

              <div class="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-2 bg-primary transition-all" [style.width.%]="smartMatchProgress"></div>
              </div>

              <div *ngIf="smartMatchError" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {{ smartMatchError }}
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium">{{ currentSmartMatchQuestion }}</p>
              </div>

              <ng-container [ngSwitch]="currentSmartMatchStep">
                <ng-container *ngSwitchCase="'name'">
                  <input [(ngModel)]="smartPlayerProfile.name" placeholder="Ex: Mohamed Ben Ali" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'sportType'">
                  <select [(ngModel)]="smartPlayerProfile.sportType" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un sport</option>
                    <option *ngFor="let sport of smartSportTypeOptions" [value]="sport">{{ sport }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'skillLevel'">
                  <select [(ngModel)]="smartPlayerProfile.skillLevel" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un niveau</option>
                    <option *ngFor="let level of smartLevelOptions" [value]="level">{{ level }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'position'">
                  <select [(ngModel)]="smartPlayerProfile.position" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un poste</option>
                    <option *ngFor="let pos of smartPlayerPositionsForSelectedSport" [value]="pos">{{ pos }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'city'">
                  <input [(ngModel)]="smartPlayerProfile.city" placeholder="Ex: Tunis" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'latitude'">
                  <input [(ngModel)]="smartPlayerProfile.latitude" type="number" step="0.000001" placeholder="Ex: 36.8065" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'longitude'">
                  <input [(ngModel)]="smartPlayerProfile.longitude" type="number" step="0.000001" placeholder="Ex: 10.1815" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'availabilityDay'">
                  <div class="space-y-2">
                    <select [(ngModel)]="smartPlayerAvailabilityDraft.dayOfWeek" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="" disabled>Sélectionner un jour</option>
                      <option *ngFor="let day of smartDayOfWeekOptions" [value]="day">{{ day }}</option>
                    </select>
                    <p *ngIf="smartPlayerProfile.availability.length > 0" class="text-xs text-muted-foreground">Créneaux ajoutés: {{ smartPlayerProfile.availability.length }}</p>
                  </div>
                </ng-container>

                <ng-container *ngSwitchCase="'availabilityStart'">
                  <input [(ngModel)]="smartPlayerAvailabilityDraft.startTime" type="time" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'availabilityEnd'">
                  <input [(ngModel)]="smartPlayerAvailabilityDraft.endTime" type="time" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'availabilityMore'">
                  <select [(ngModel)]="smartPlayerAddMoreAvailability" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'preferredPlayStyle'">
                  <select [(ngModel)]="smartPlayerProfile.preferredPlayStyle" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Aucun</option>
                    <option *ngFor="let style of smartPlayStyleOptions" [value]="style">{{ style }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'rating'">
                  <input [(ngModel)]="smartPlayerProfile.rating" type="number" min="0" max="5" step="0.1" placeholder="0 à 5 (optionnel)" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'review'">
                  <p class="text-sm text-muted-foreground">
                    Profil analysé. Cliquez sur <strong>Envoyer et recommander</strong> pour obtenir les meilleures équipes.
                  </p>

                  <div *ngIf="smartMatchSubmitting" class="mt-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                    <lucide-icon [name]="Loader2Icon" [size]="14" class="animate-spin"></lucide-icon>
                    Analyse en cours et recherche des meilleures équipes...
                  </div>

                  <div *ngIf="smartMatchSubmitted && smartMatchRecommendations.length === 0 && !smartMatchSubmitting" class="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    Aucune équipe recommandée pour ce profil.
                  </div>

                  <div *ngIf="smartMatchRecommendations.length > 0" class="mt-4 space-y-3">
                    <p class="text-sm font-semibold">Meilleures équipes recommandées</p>
                    <div class="grid md:grid-cols-2 gap-4">
                      <div *ngFor="let rec of smartMatchRecommendations; let idx = index" class="bg-card rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl overflow-hidden">
                        <div class="h-16 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                          <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <lucide-icon [name]="ShieldIcon" [size]="24" class="text-white"></lucide-icon>
                          </div>
                        </div>
                        <div class="p-4">
                          <h4 class="mb-1 font-semibold">#{{ idx + 1 }} - {{ rec.name }}</h4>
                          <p class="text-xs text-muted-foreground mb-1">Smart Score: {{ rec.score }}%</p>
                          <p class="text-xs text-muted-foreground mb-1">Distance: {{ rec.distanceKm }} km</p>
                          <p class="text-xs text-muted-foreground mb-3">{{ rec.matchDetails }}</p>

                          <div class="flex gap-2">
                            <button (click)="viewRecommendedTeam(rec)" class="flex-1 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all inline-flex items-center justify-center gap-1">
                              <lucide-icon [name]="EyeIcon" [size]="14"></lucide-icon>
                              Détail
                            </button>
                            <button *ngIf="isPlayer" (click)="joinRecommendedTeam(rec)" [disabled]="isJoining(rec.id)" class="flex-1 py-2 text-sm bg-emerald-500/10 text-emerald-700 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-60">
                              {{ isJoining(rec.id) ? 'Envoi...' : 'Rejoindre' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>

                <ng-container *ngSwitchCase="'teamName'">
                  <input [(ngModel)]="smartTeamProfile.teamName" placeholder="Ex: Les Titans" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'teamSportType'">
                  <select [(ngModel)]="smartTeamProfile.sportType" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un sport</option>
                    <option *ngFor="let sport of smartSportTypeOptions" [value]="sport">{{ sport }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'teamLevel'">
                  <select [(ngModel)]="smartTeamProfile.teamLevel" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un niveau</option>
                    <option *ngFor="let level of smartLevelOptions" [value]="level">{{ level }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'teamCity'">
                  <input [(ngModel)]="smartTeamProfile.city" placeholder="Ex: Sousse" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'teamLatitude'">
                  <input [(ngModel)]="smartTeamProfile.latitude" type="number" step="0.000001" placeholder="Ex: 35.8256" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'teamLongitude'">
                  <input [(ngModel)]="smartTeamProfile.longitude" type="number" step="0.000001" placeholder="Ex: 10.6369" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'requiredPosition'">
                  <select [(ngModel)]="smartTeamRequiredPositionDraft.position" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un poste</option>
                    <option *ngFor="let pos of smartTeamPositionsForSelectedSport" [value]="pos">{{ pos }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'requiredPositionCount'">
                  <input [(ngModel)]="smartTeamRequiredPositionDraft.neededCount" type="number" min="1" step="1" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'requiredPositionMore'">
                  <select [(ngModel)]="smartTeamAddMorePositions" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'scheduleDay'">
                  <select [(ngModel)]="smartTeamScheduleDraft.dayOfWeek" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un jour</option>
                    <option *ngFor="let day of smartDayOfWeekOptions" [value]="day">{{ day }}</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'scheduleStart'">
                  <input [(ngModel)]="smartTeamScheduleDraft.startTime" type="time" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'scheduleEnd'">
                  <input [(ngModel)]="smartTeamScheduleDraft.endTime" type="time" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                </ng-container>

                <ng-container *ngSwitchCase="'scheduleMore'">
                  <select [(ngModel)]="smartTeamAddMoreSchedule" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'description'">
                  <textarea [(ngModel)]="smartTeamProfile.description" rows="4" placeholder="Décrivez votre équipe" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                </ng-container>

                <ng-container *ngSwitchCase="'teamReview'">
                  <p class="text-sm text-muted-foreground">Le profil équipe a été collecté avec succès. Vous pouvez terminer cette étape.</p>
                </ng-container>
              </ng-container>

              <div class="flex justify-between gap-3 pt-2">
                <button (click)="smartMatchBack()" [disabled]="!canGoSmartMatchBack" class="px-4 py-2 rounded-xl bg-muted hover:bg-muted/70 disabled:opacity-50 inline-flex items-center gap-2">
                  <lucide-icon [name]="ChevronLeftIcon" [size]="16"></lucide-icon>
                  Précédent
                </button>
                <button (click)="smartMatchNext()" class="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2">
                  {{ smartMatchPrimaryActionLabel }}
                  <lucide-icon *ngIf="!isSmartMatchOnReviewStep" [name]="ChevronRightIcon" [size]="16"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="showTeamFormModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-foreground">{{ editingTeamId ? 'Modifier une équipe' : 'Créer une équipe' }}</h3>
              <button (click)="closeFormModal()" class="p-2 hover:bg-muted rounded-lg transition-colors">
                <lucide-icon [name]="XIcon" [size]="20" class="text-muted-foreground"></lucide-icon>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Nom de l'équipe *</label>
                <input [(ngModel)]="teamForm.name" placeholder="Ex: Les Aigles"
                  class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Sport *</label>
                  <select [(ngModel)]="teamForm.sport" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled>Sélectionner un sport</option>
                    <option *ngFor="let sport of sportOptions" [value]="sport">{{ sport }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Niveau *</label>
                  <select [(ngModel)]="teamForm.level" class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="AMATEUR">Amateur</option>
                    <option value="INTERMEDIATE">Intermédiaire</option>
                    <option value="ADVANCED">Avancé</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Ville</label>
                <input [(ngModel)]="teamForm.city" placeholder="Ex: Paris"
                  class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Description</label>
                <textarea [(ngModel)]="teamForm.description" rows="3" placeholder="Décrivez brièvement l'équipe"
                  class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Logo (URL optionnelle)</label>
                <input [(ngModel)]="teamForm.logo" placeholder="https://example.com/logo.png"
                  class="w-full px-4 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              </div>
            </div>

            <div class="flex gap-3 justify-end mt-6">
              <button (click)="closeFormModal()" class="px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-colors">Annuler</button>
              <button (click)="submitTeam()" [disabled]="saving || !teamForm.name || !teamForm.sport || !teamForm.level"
                class="px-5 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                <lucide-icon *ngIf="saving" [name]="Loader2Icon" [size]="16" class="animate-spin"></lucide-icon>
                {{ saving ? (editingTeamId ? 'Mise à jour...' : 'Création...') : (editingTeamId ? 'Mettre à jour' : 'Créer') }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="loading" class="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
          Chargement des équipes...
        </div>

        <div *ngIf="!loading && teams.length === 0" class="text-center py-20 text-muted-foreground">
          <div class="text-6xl mb-4">⚽</div>
          <p class="font-semibold mb-2 text-lg">Aucune équipe trouvée</p>
          <p class="text-sm mb-6">Le backend peut retourner une liste vide selon votre rôle.</p>
          <button (click)="loadTeams()" class="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all">
            Actualiser
          </button>
        </div>

        <div *ngIf="!loading && teams.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let team of teams" class="bg-card rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl overflow-hidden">
            <div class="h-20 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
              <div class="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <lucide-icon [name]="ShieldIcon" [size]="32" class="text-white"></lucide-icon>
              </div>
            </div>
            <div class="p-6">
              <h3 class="mb-1">{{ team.name || 'Équipe sans nom' }}</h3>
              <p class="text-sm text-muted-foreground mb-2">{{ team.sport || '-' }} • {{ team.city || '-' }}</p>
              <p class="text-xs text-muted-foreground mb-2">Niveau: {{ team.level || '-' }}</p>
              <p class="text-xs text-muted-foreground mb-2">Statut: {{ team.status || '-' }}</p>
              <p class="text-xs text-muted-foreground mb-4">Créée le: {{ team.createdAt ? (team.createdAt | date:'short') : '-' }}</p>

              <div class="flex gap-2">
                <button (click)="viewTeam(team)" class="flex-1 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all inline-flex items-center justify-center gap-1">
                  <lucide-icon [name]="EyeIcon" [size]="14"></lucide-icon>
                  Détail
                </button>
                <button *ngIf="isPlayer" (click)="joinTeam(team)" [disabled]="isJoining(team.id)" class="flex-1 py-2 text-sm bg-emerald-500/10 text-emerald-700 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-60">
                  {{ isJoining(team.id) ? 'Envoi...' : 'Rejoindre' }}
                </button>
                <button *ngIf="isAdmin" (click)="openEditModal(team)" class="flex-1 py-2 text-sm bg-muted rounded-lg hover:bg-muted/70 transition-all">Modifier</button>
                <button *ngIf="isAdmin" (click)="deleteTeam(team)" [disabled]="isDeleting(team.id)" class="flex-1 py-2 text-sm bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-60">
                  {{ isDeleting(team.id) ? 'Suppression...' : 'Supprimer' }}
                </button>
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
export class TeamComponent implements OnInit {
  readonly ShieldIcon = Shield;
  readonly UsersIcon = Users;
  readonly PlusIcon = Plus;
  readonly Loader2Icon = Loader2;
  readonly XIcon = X;
  readonly RefreshCcwIcon = RefreshCcw;
  readonly EyeIcon = Eye;
  readonly SparklesIcon = Sparkles;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;

  showSmartMatchModal = false;
  smartMatchType: SmartMatchProfileType | null = null;
  smartMatchStepIndex = 0;
  smartMatchError: string | null = null;
  smartMatchOutputJson = '';
  smartMatchSubmitting = false;
  smartMatchRecommendations: MatchResponse[] = [];
  smartMatchSubmitted = false;

  readonly smartSportTypeOptions: string[] = ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'PADEL', 'VOLLEYBALL', 'HANDBALL'];
  readonly smartLevelOptions: string[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  readonly smartPlayStyleOptions: string[] = ['CASUAL', 'COMPETITIVE'];
  readonly smartDayOfWeekOptions: string[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  readonly smartYesNoOptions: string[] = ['YES', 'NO'];
  readonly smartPositionBySport: Record<string, string[]> = {
    FOOTBALL: ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'],
    BASKETBALL: ['POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER'],
    TENNIS: ['SINGLES', 'DOUBLES_SPECIALIST'],
    PADEL: ['LEFT_SIDE', 'RIGHT_SIDE'],
    VOLLEYBALL: ['SETTER', 'OUTSIDE_HITTER', 'OPPOSITE', 'MIDDLE_BLOCKER', 'LIBERO'],
    HANDBALL: ['GOALKEEPER', 'LEFT_WING', 'RIGHT_WING', 'PIVOT', 'BACK']
  };

  smartPlayerProfile: SmartMatchPlayerProfile = this.createEmptyPlayerProfile();
  smartTeamProfile: SmartMatchTeamProfile = this.createEmptyTeamProfile();
  smartPlayerAvailabilityDraft: SmartMatchAvailability = { dayOfWeek: '', startTime: '', endTime: '' };
  smartPlayerAddMoreAvailability: 'YES' | 'NO' = 'NO';
  smartTeamRequiredPositionDraft: SmartMatchRequiredPosition = { position: '', neededCount: 1 };
  smartTeamAddMorePositions: 'YES' | 'NO' = 'NO';
  smartTeamScheduleDraft: SmartMatchAvailability = { dayOfWeek: '', startTime: '', endTime: '' };
  smartTeamAddMoreSchedule: 'YES' | 'NO' = 'NO';

  toast: string | null = null;
  errorBanner: string | null = null;
  loading = true;
  teams: Team[] = [];
  currentRole = (localStorage.getItem('user_type') || '').toUpperCase();

  showTeamFormModal = false;
  saving = false;
  editingTeamId: number | null = null;
  editingTeamMeta: { createdAt?: string; createdById?: number } | null = null;
  deletingTeamIds = new Set<number>();
  joiningTeamIds = new Set<number>();
  categories: any[] = [];
  readonly fallbackSports: string[] = ['Football', 'Basketball', 'Tennis', 'Padel'];
  loadingCategories = false;
  teamForm: TeamPayload = {
    name: '',
    sport: '',
    level: 'AMATEUR',
    city: '',
    description: '',
    logo: null,
    status: 'ACTIVE'
  };

  constructor(
    public router: Router,
    private teamService: TeamService,
    private matchingService: MatchingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTeams();
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

  loadTeams(showLoader = true) {
    if (showLoader) {
      this.loading = true;
    }
    this.errorBanner = null;
    this.teamService.getTeams().subscribe({
      next: (data: Team[]) => {
        this.teams = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const message = this.getReadableErrorMessage(err);
        this.errorBanner = `Impossible de charger les équipes: ${message}`;
        this.showToast(this.errorBanner);
        this.cdr.detectChanges();
      }
    });
  }

  viewTeam(team: Team) {
    this.router.navigate(['/app/team', team.id]);
  }

  openManageRequests(): void {
    this.router.navigate(['/app/admin/team-requests']);
  }

  openCreateModal() {
    this.editingTeamId = null;
    this.editingTeamMeta = null;
    this.teamForm = {
      name: '',
      sport: '',
      level: 'AMATEUR',
      city: '',
      description: '',
      logo: null,
      status: 'ACTIVE'
    };
    this.showTeamFormModal = true;
    if (this.categories.length === 0) {
      this.loadCategories();
    }
  }

  openEditModal(team: Team) {
    this.editingTeamId = team.id;
    this.editingTeamMeta = null;
    this.showTeamFormModal = true;
    this.teamService.getTeamById(team.id).subscribe({
      next: (data) => {
        const rawData = data as any;
        const createdById = Number(rawData?.createdById ?? rawData?.created_by_id ?? rawData?.createdBy?.id ?? 0);
        this.editingTeamMeta = {
          createdAt: rawData?.createdAt || rawData?.created_at,
          createdById: Number.isFinite(createdById) && createdById > 0 ? createdById : undefined
        };

        this.teamForm = {
          name: data.name || '',
          sport: data.sport || data.sportType || '',
          level: data.level || 'AMATEUR',
          city: data.city || data.location || '',
          description: data.description || '',
          logo: data.logo || null,
          status: data.status || 'ACTIVE'
        };
      },
      error: (err) => {
        this.closeFormModal();
        this.showToast(`Erreur chargement édition: ${this.getReadableErrorMessage(err)}`);
      }
    });

    if (this.categories.length === 0) {
      this.loadCategories();
    }
  }

  closeFormModal() {
    this.showTeamFormModal = false;
    this.saving = false;
    if (this.editingTeamId === null) {
      this.editingTeamMeta = null;
    }
  }

  loadCategories() {
    this.loadingCategories = true;
    this.teamService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        if (!this.teamForm.sport && this.sportOptions.length > 0) {
          this.teamForm.sport = this.sportOptions[0];
        }
        this.loadingCategories = false;
      },
      error: () => {
        this.categories = [];
        if (!this.teamForm.sport && this.sportOptions.length > 0) {
          this.teamForm.sport = this.sportOptions[0];
        }
        this.loadingCategories = false;
      }
    });
  }

  submitTeam() {
    if (!this.teamForm.name || !this.teamForm.sport || !this.teamForm.level) return;

    this.saving = true;
    const normalizeOptional = (value?: string | null): string | undefined => {
      const trimmed = (value || '').trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const normalizedSport = (this.teamForm.sport || '').trim();
    const normalizedName = (this.teamForm.name || '').trim();

    const payload: TeamPayload = {
      ...this.teamForm,
      name: normalizedName,
      sport: normalizedSport,
      level: this.teamForm.level,
      description: normalizeOptional(this.teamForm.description),
      city: normalizeOptional(this.teamForm.city),
      logo: normalizeOptional(this.teamForm.logo || null) ?? null,
      status: this.teamForm.status || 'ACTIVE'
    };

    const wasEditing = this.editingTeamId !== null;
    const editingId = this.editingTeamId;
    const localUserId = Number(localStorage.getItem('user_id'));
    const effectiveUserId = Number.isFinite(localUserId) && localUserId > 0 ? localUserId : undefined;

    if (wasEditing) {
      const fallbackCreatorId = Number(localStorage.getItem('user_id'));
      const createdById = this.editingTeamMeta?.createdById
        ?? (Number.isFinite(fallbackCreatorId) && fallbackCreatorId > 0 ? fallbackCreatorId : undefined);

      if (this.editingTeamMeta?.createdAt) {
        payload.createdAt = this.editingTeamMeta.createdAt;
      }
      if (createdById) {
        payload.createdById = createdById;
        payload.created_by_id = createdById;
        payload.createdBy = { id: createdById };
      }
    }

    const previousTeams = [...this.teams];
    const optimisticTeam: Team = {
      id: wasEditing ? (editingId || 0) : -(Date.now()),
      name: payload.name,
      sport: payload.sport,
      level: payload.level,
      description: payload.description || '',
      city: payload.city || '',
      logo: payload.logo || '',
      status: payload.status || 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    // Non-blocking UX: close immediately and reflect change optimistically.
    if (wasEditing && editingId !== null) {
      this.teams = this.teams.map((team) => (team.id === editingId ? optimisticTeam : team));
    } else {
      this.teams = [optimisticTeam, ...this.teams];
    }

    this.showTeamFormModal = false;
    this.saving = false;
    this.editingTeamId = null;
    this.editingTeamMeta = null;
    this.showToast(wasEditing ? 'Mise à jour en cours...' : 'Création en cours...');

    const operation$ = wasEditing && editingId !== null
      ? this.teamService.updateTeam(editingId, payload, effectiveUserId)
      : this.teamService.createTeam(payload, effectiveUserId);

    operation$.subscribe({
      next: (savedTeam: Team) => {
        const effectiveTeam = savedTeam && savedTeam.id ? savedTeam : optimisticTeam;

        if (wasEditing && editingId !== null) {
          this.teams = this.teams.map((team) => (team.id === editingId ? effectiveTeam : team));
        } else {
          const withoutDuplicate = this.teams.filter((team) => team.id !== optimisticTeam.id && team.id !== effectiveTeam.id);
          this.teams = [effectiveTeam, ...withoutDuplicate];
        }
        this.showToast(wasEditing ? 'Équipe mise à jour avec succès.' : 'Équipe créée avec succès.');
        // Keep UI responsive: refresh in background without blocking the list.
        this.loadTeams(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.teams = previousTeams;
        const action = wasEditing ? 'la mise à jour' : 'la création';
        this.showToast(`Erreur pendant ${action}: ${this.getReadableErrorMessage(err)}`);
        this.cdr.detectChanges();
      }
    });
  }

  get sportOptions(): string[] {
    const fromCategories = (this.categories || [])
      .map((cat: any) => String(cat?.nom || cat?.name || '').trim())
      .filter((name: string) => !!name);

    const options = fromCategories.length > 0 ? fromCategories : this.fallbackSports;
    return Array.from(new Set(options));
  }

  deleteTeam(team: Team) {
    const confirmDelete = window.confirm(`Supprimer l'équipe "${team.name || '-' }" ?`);
    if (!confirmDelete) {
      return;
    }

    const previousTeams = [...this.teams];
    this.deletingTeamIds.add(team.id);
    this.teams = this.teams.filter((t) => t.id !== team.id);

    this.teamService.deleteTeam(team.id).subscribe({
      next: () => {
        this.deletingTeamIds.delete(team.id);
        this.showToast('Équipe supprimée avec succès.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingTeamIds.delete(team.id);
        this.teams = previousTeams;
        this.showToast(`Erreur suppression: ${this.getReadableErrorMessage(err)}`);
        this.cdr.detectChanges();
      }
    });
  }

  isDeleting(teamId: number): boolean {
    return this.deletingTeamIds.has(teamId);
  }

  isJoining(teamId: number): boolean {
    return this.joiningTeamIds.has(teamId);
  }

  joinTeam(team: Team): void {
    const userIdRaw = localStorage.getItem('user_id');
    const userId = Number(userIdRaw);

    if (!Number.isFinite(userId) || userId <= 0) {
      this.showToast('Impossible d\'envoyer la demande: utilisateur non identifié.');
      return;
    }

    if (!team?.id) {
      this.showToast('Impossible d\'envoyer la demande: équipe invalide.');
      return;
    }

    this.joiningTeamIds.add(team.id);
    this.teamService.requestJoinTeam(team.id, 'I want to join this team').subscribe({
      next: () => {
        this.joiningTeamIds.delete(team.id);
        this.showToast(`Demande d'adhésion envoyée à l'admin de "${team.name}".`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.joiningTeamIds.delete(team.id);
        const httpError = err as HttpErrorResponse;
        if (httpError?.status === 409) {
          this.showToast('Vous avez déjà une demande en attente pour cette équipe.');
        } else {
          this.showToast(`Échec envoi demande: ${this.getReadableErrorMessage(err)}`);
        }
        this.cdr.detectChanges();
      }
    });
  }

  private getReadableErrorMessage(error: unknown): string {
    const baseMessage = this.teamService.extractErrorMessage(error);
    const httpError = error as HttpErrorResponse;

    if ([400, 401, 403, 404, 500].includes(httpError?.status ?? -1)) {
      return `[${httpError.status}] ${baseMessage}`;
    }

    return baseMessage;
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => (this.toast = null), 3000);
  }

  get smartMatchSteps(): string[] {
    if (this.smartMatchType === 'PLAYER') {
      return [
        'name',
        'sportType',
        'skillLevel',
        'position',
        'city',
        'latitude',
        'longitude',
        'availabilityDay',
        'availabilityStart',
        'availabilityEnd',
        'availabilityMore',
        'preferredPlayStyle',
        'rating',
        'review'
      ];
    }

    if (this.smartMatchType === 'TEAM') {
      return [
        'teamName',
        'teamSportType',
        'teamLevel',
        'teamCity',
        'teamLatitude',
        'teamLongitude',
        'requiredPosition',
        'requiredPositionCount',
        'requiredPositionMore',
        'scheduleDay',
        'scheduleStart',
        'scheduleEnd',
        'scheduleMore',
        'description',
        'teamReview'
      ];
    }

    return [];
  }

  get smartMatchProgress(): number {
    const total = this.smartMatchSteps.length || 1;
    return ((this.smartMatchStepIndex + 1) / total) * 100;
  }

  get currentSmartMatchStep(): string {
    return this.smartMatchSteps[this.smartMatchStepIndex] || '';
  }

  get currentSmartMatchQuestion(): string {
    switch (this.currentSmartMatchStep) {
      case 'name': return 'Nom du joueur';
      case 'sportType': return 'Sport Type (ENUM obligatoire)';
      case 'skillLevel': return 'Skill Level (BEGINNER / INTERMEDIATE / ADVANCED)';
      case 'position': return 'Position (selon sport sélectionné)';
      case 'city': return 'Ville';
      case 'latitude': return 'Latitude';
      case 'longitude': return 'Longitude';
      case 'availabilityDay': return 'Availability - Jour';
      case 'availabilityStart': return 'Availability - Heure de début';
      case 'availabilityEnd': return 'Availability - Heure de fin';
      case 'availabilityMore': return 'Ajouter un autre créneau ?';
      case 'preferredPlayStyle': return 'Preferred Play Style (optionnel)';
      case 'rating': return 'Rating (optionnel, 0 à 5)';
      case 'review': return 'JSON final (PLAYER)';
      case 'teamName': return 'Nom de l\'équipe';
      case 'teamSportType': return 'Sport Type équipe (ENUM obligatoire)';
      case 'teamLevel': return 'Team Level (BEGINNER / INTERMEDIATE / ADVANCED)';
      case 'teamCity': return 'Ville de l\'équipe';
      case 'teamLatitude': return 'Latitude équipe';
      case 'teamLongitude': return 'Longitude équipe';
      case 'requiredPosition': return 'Required Position - Poste';
      case 'requiredPositionCount': return 'Required Position - neededCount';
      case 'requiredPositionMore': return 'Ajouter un autre poste requis ?';
      case 'scheduleDay': return 'Schedule - Jour';
      case 'scheduleStart': return 'Schedule - Heure de début';
      case 'scheduleEnd': return 'Schedule - Heure de fin';
      case 'scheduleMore': return 'Ajouter un autre créneau d\'équipe ?';
      case 'description': return 'Description équipe';
      case 'teamReview': return 'JSON final (TEAM)';
      default: return '';
    }
  }

  get canGoSmartMatchBack(): boolean {
    return this.smartMatchType !== null && this.smartMatchStepIndex > 0;
  }

  get isSmartMatchOnReviewStep(): boolean {
    return ['review', 'teamReview'].includes(this.currentSmartMatchStep);
  }

  get smartMatchPrimaryActionLabel(): string {
    if (this.currentSmartMatchStep === 'review' && this.smartMatchType === 'PLAYER') {
      if (this.smartMatchSubmitting) {
        return 'Analyse...';
      }
      return this.smartMatchSubmitted ? 'Terminer' : 'Envoyer et recommander';
    }
    if (this.currentSmartMatchStep === 'teamReview') {
      return 'Terminer';
    }
    return 'Suivant';
  }

  get smartPlayerPositionsForSelectedSport(): string[] {
    return this.smartPositionBySport[this.smartPlayerProfile.sportType] || [];
  }

  get smartTeamPositionsForSelectedSport(): string[] {
    return this.smartPositionBySport[this.smartTeamProfile.sportType] || [];
  }

  openSmartMatchModal(): void {
    this.showSmartMatchModal = true;
    this.resetSmartMatchState();
  }

  closeSmartMatchModal(): void {
    this.showSmartMatchModal = false;
    this.resetSmartMatchState();
  }

  selectSmartMatchType(type: SmartMatchProfileType): void {
    this.smartMatchType = type;
    this.smartMatchStepIndex = 0;
    this.smartMatchError = null;
    this.smartMatchOutputJson = '';
  }

  smartMatchBack(): void {
    if (!this.canGoSmartMatchBack) {
      return;
    }
    this.smartMatchError = null;
    this.smartMatchStepIndex = Math.max(0, this.smartMatchStepIndex - 1);
  }

  smartMatchNext(): void {
    this.smartMatchError = null;
    const step = this.currentSmartMatchStep;

    if (!this.validateSmartMatchStep(step)) {
      return;
    }

    if (step === 'availabilityEnd') {
      this.smartPlayerProfile.availability.push({ ...this.smartPlayerAvailabilityDraft });
      this.smartPlayerAvailabilityDraft = { dayOfWeek: '', startTime: '', endTime: '' };
    }

    if (step === 'requiredPositionCount') {
      this.smartTeamProfile.requiredPositions.push({ ...this.smartTeamRequiredPositionDraft });
      this.smartTeamRequiredPositionDraft = { position: '', neededCount: 1 };
    }

    if (step === 'scheduleEnd') {
      this.smartTeamProfile.schedule.push({ ...this.smartTeamScheduleDraft });
      this.smartTeamScheduleDraft = { dayOfWeek: '', startTime: '', endTime: '' };
    }

    if (step === 'availabilityMore') {
      if (this.smartPlayerAddMoreAvailability === 'YES') {
        this.smartMatchStepIndex = this.smartMatchSteps.indexOf('availabilityDay');
        return;
      }
    }

    if (step === 'requiredPositionMore') {
      if (this.smartTeamAddMorePositions === 'YES') {
        this.smartMatchStepIndex = this.smartMatchSteps.indexOf('requiredPosition');
        return;
      }
    }

    if (step === 'scheduleMore') {
      if (this.smartTeamAddMoreSchedule === 'YES') {
        this.smartMatchStepIndex = this.smartMatchSteps.indexOf('scheduleDay');
        return;
      }
    }

    if (step === 'review') {
      if (this.smartMatchType === 'PLAYER' && !this.smartMatchSubmitted) {
        this.submitPlayerSmartMatchAndRecommend();
        return;
      }
      this.closeSmartMatchModal();
      return;
    }

    if (step === 'teamReview') {
      this.closeSmartMatchModal();
      return;
    }

    if (this.smartMatchStepIndex < this.smartMatchSteps.length - 1) {
      this.smartMatchStepIndex += 1;
      const newStep = this.currentSmartMatchStep;
      if (newStep === 'review' || newStep === 'teamReview') {
        this.smartMatchOutputJson = this.smartMatchType === 'PLAYER'
          ? JSON.stringify(this.buildPlayerJsonOutput(), null, 2)
          : JSON.stringify(this.buildTeamJsonOutput(), null, 2);
      }
    }
  }

  private validateSmartMatchStep(step: string): boolean {
    const fail = (message: string): boolean => {
      this.smartMatchError = message;
      return false;
    };

    switch (step) {
      case 'name':
        return (this.smartPlayerProfile.name || '').trim().length > 0 || fail('Le nom du joueur est obligatoire.');
      case 'sportType': {
        if (!this.smartSportTypeOptions.includes(this.smartPlayerProfile.sportType)) {
          return fail('Sport Type invalide. Veuillez sélectionner une valeur de la liste.');
        }
        if (!this.smartPlayerPositionsForSelectedSport.includes(this.smartPlayerProfile.position)) {
          this.smartPlayerProfile.position = '';
        }
        return true;
      }
      case 'skillLevel':
        return this.smartLevelOptions.includes(this.smartPlayerProfile.skillLevel) || fail('Skill Level invalide.');
      case 'position':
        return this.smartPlayerPositionsForSelectedSport.includes(this.smartPlayerProfile.position) || fail('Position invalide pour le sport sélectionné.');
      case 'city':
        return (this.smartPlayerProfile.city || '').trim().length > 0 || fail('La ville est obligatoire.');
      case 'latitude':
        return this.isValidLatitude(this.smartPlayerProfile.latitude) || fail('Latitude invalide (-90 à 90).');
      case 'longitude':
        return this.isValidLongitude(this.smartPlayerProfile.longitude) || fail('Longitude invalide (-180 à 180).');
      case 'availabilityDay':
        return this.smartDayOfWeekOptions.includes(this.smartPlayerAvailabilityDraft.dayOfWeek) || fail('Jour invalide.');
      case 'availabilityStart':
        return this.isValidTime(this.smartPlayerAvailabilityDraft.startTime) || fail('Heure de début invalide.');
      case 'availabilityEnd':
        if (!this.isValidTime(this.smartPlayerAvailabilityDraft.endTime)) {
          return fail('Heure de fin invalide.');
        }
        return this.isStartBeforeEnd(this.smartPlayerAvailabilityDraft.startTime, this.smartPlayerAvailabilityDraft.endTime)
          || fail('La règle de temps est invalide: startTime doit être avant endTime.');
      case 'availabilityMore':
        return this.smartYesNoOptions.includes(this.smartPlayerAddMoreAvailability) || fail('Veuillez choisir YES ou NO.');
      case 'preferredPlayStyle':
        return this.smartPlayerProfile.preferredPlayStyle === '' || this.smartPlayStyleOptions.includes(this.smartPlayerProfile.preferredPlayStyle)
          || fail('Preferred Play Style invalide.');
      case 'rating': {
        if (this.smartPlayerProfile.rating === null || this.smartPlayerProfile.rating === undefined || this.smartPlayerProfile.rating === ('' as any)) {
          this.smartPlayerProfile.rating = null;
          return true;
        }
        const rating = Number(this.smartPlayerProfile.rating);
        return (Number.isFinite(rating) && rating >= 0 && rating <= 5) || fail('Rating doit être entre 0 et 5.');
      }
      case 'teamName':
        return (this.smartTeamProfile.teamName || '').trim().length > 0 || fail('Le nom de l\'équipe est obligatoire.');
      case 'teamSportType': {
        if (!this.smartSportTypeOptions.includes(this.smartTeamProfile.sportType)) {
          return fail('Sport Type équipe invalide.');
        }
        if (!this.smartTeamPositionsForSelectedSport.includes(this.smartTeamRequiredPositionDraft.position)) {
          this.smartTeamRequiredPositionDraft.position = '';
        }
        return true;
      }
      case 'teamLevel':
        return this.smartLevelOptions.includes(this.smartTeamProfile.teamLevel) || fail('Team Level invalide.');
      case 'teamCity':
        return (this.smartTeamProfile.city || '').trim().length > 0 || fail('La ville équipe est obligatoire.');
      case 'teamLatitude':
        return this.isValidLatitude(this.smartTeamProfile.latitude) || fail('Latitude équipe invalide (-90 à 90).');
      case 'teamLongitude':
        return this.isValidLongitude(this.smartTeamProfile.longitude) || fail('Longitude équipe invalide (-180 à 180).');
      case 'requiredPosition':
        return this.smartTeamPositionsForSelectedSport.includes(this.smartTeamRequiredPositionDraft.position) || fail('Poste requis invalide pour ce sport.');
      case 'requiredPositionCount': {
        const count = Number(this.smartTeamRequiredPositionDraft.neededCount);
        return Number.isInteger(count) && count > 0 || fail('neededCount doit être un entier > 0.');
      }
      case 'requiredPositionMore':
        return this.smartYesNoOptions.includes(this.smartTeamAddMorePositions) || fail('Veuillez choisir YES ou NO.');
      case 'scheduleDay':
        return this.smartDayOfWeekOptions.includes(this.smartTeamScheduleDraft.dayOfWeek) || fail('Jour de schedule invalide.');
      case 'scheduleStart':
        return this.isValidTime(this.smartTeamScheduleDraft.startTime) || fail('Heure de début schedule invalide.');
      case 'scheduleEnd':
        if (!this.isValidTime(this.smartTeamScheduleDraft.endTime)) {
          return fail('Heure de fin schedule invalide.');
        }
        return this.isStartBeforeEnd(this.smartTeamScheduleDraft.startTime, this.smartTeamScheduleDraft.endTime)
          || fail('La règle de temps est invalide: startTime doit être avant endTime.');
      case 'scheduleMore':
        return this.smartYesNoOptions.includes(this.smartTeamAddMoreSchedule) || fail('Veuillez choisir YES ou NO.');
      case 'description':
        return (this.smartTeamProfile.description || '').trim().length > 0 || fail('La description est obligatoire.');
      default:
        return true;
    }
  }

  private buildPlayerJsonOutput(): SmartMatchPlayerProfile {
    return {
      type: 'PLAYER',
      name: this.smartPlayerProfile.name.trim(),
      sportType: this.smartPlayerProfile.sportType,
      skillLevel: this.smartPlayerProfile.skillLevel,
      position: this.smartPlayerProfile.position,
      city: this.smartPlayerProfile.city.trim(),
      latitude: Number(this.smartPlayerProfile.latitude),
      longitude: Number(this.smartPlayerProfile.longitude),
      availability: [...this.smartPlayerProfile.availability],
      preferredPlayStyle: this.smartPlayerProfile.preferredPlayStyle || '',
      rating: this.smartPlayerProfile.rating === null ? null : Number(this.smartPlayerProfile.rating)
    };
  }

  private buildPlayerMatchingRequest(): PlayerProfileMatchingRequest {
    const payload = this.buildPlayerJsonOutput();
    return {
      type: 'PLAYER',
      name: payload.name,
      sportType: payload.sportType,
      skillLevel: payload.skillLevel,
      position: payload.position,
      city: payload.city,
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      availability: payload.availability,
      preferredPlayStyle: payload.preferredPlayStyle || '',
      rating: payload.rating
    };
  }

  private buildTeamJsonOutput(): SmartMatchTeamProfile {
    return {
      type: 'TEAM',
      teamName: this.smartTeamProfile.teamName.trim(),
      sportType: this.smartTeamProfile.sportType,
      teamLevel: this.smartTeamProfile.teamLevel,
      city: this.smartTeamProfile.city.trim(),
      latitude: Number(this.smartTeamProfile.latitude),
      longitude: Number(this.smartTeamProfile.longitude),
      requiredPositions: [...this.smartTeamProfile.requiredPositions],
      schedule: [...this.smartTeamProfile.schedule],
      description: this.smartTeamProfile.description.trim()
    };
  }

  private createEmptyPlayerProfile(): SmartMatchPlayerProfile {
    return {
      type: 'PLAYER',
      name: '',
      sportType: '',
      skillLevel: '',
      position: '',
      city: '',
      latitude: null,
      longitude: null,
      availability: [],
      preferredPlayStyle: '',
      rating: null
    };
  }

  private createEmptyTeamProfile(): SmartMatchTeamProfile {
    return {
      type: 'TEAM',
      teamName: '',
      sportType: '',
      teamLevel: '',
      city: '',
      latitude: null,
      longitude: null,
      requiredPositions: [],
      schedule: [],
      description: ''
    };
  }

  private resetSmartMatchState(): void {
    this.smartMatchType = null;
    this.smartMatchStepIndex = 0;
    this.smartMatchError = null;
    this.smartMatchOutputJson = '';
    this.smartMatchSubmitting = false;
    this.smartMatchRecommendations = [];
    this.smartMatchSubmitted = false;
    this.smartPlayerProfile = this.createEmptyPlayerProfile();
    this.smartTeamProfile = this.createEmptyTeamProfile();
    this.smartPlayerAvailabilityDraft = { dayOfWeek: '', startTime: '', endTime: '' };
    this.smartPlayerAddMoreAvailability = 'NO';
    this.smartTeamRequiredPositionDraft = { position: '', neededCount: 1 };
    this.smartTeamAddMorePositions = 'NO';
    this.smartTeamScheduleDraft = { dayOfWeek: '', startTime: '', endTime: '' };
    this.smartTeamAddMoreSchedule = 'NO';
  }

  private isValidLatitude(value: number | null): boolean {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= -90 && numeric <= 90;
  }

  private isValidLongitude(value: number | null): boolean {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= -180 && numeric <= 180;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value || '');
  }

  private isStartBeforeEnd(startTime: string, endTime: string): boolean {
    return startTime < endTime;
  }

  private submitPlayerSmartMatchAndRecommend(): void {
    this.smartMatchSubmitting = true;
    this.smartMatchError = null;

    const payload = this.buildPlayerMatchingRequest();
    this.matchingService.getBestTeamsForProfile(payload, 5).subscribe({
      next: (recommendations) => {
        this.smartMatchRecommendations = recommendations || [];
        this.smartMatchSubmitted = true;
        this.smartMatchSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.smartMatchSubmitting = false;
        this.smartMatchError = `Envoi vers backend échoué: ${this.teamService.extractErrorMessage(err)}`;
        this.cdr.detectChanges();
      }
    });
  }

  viewRecommendedTeam(rec: MatchResponse): void {
    if (!rec?.id) {
      return;
    }
    this.router.navigate(['/app/team', rec.id]);
  }

  joinRecommendedTeam(rec: MatchResponse): void {
    if (!rec?.id) {
      return;
    }

    const existing = this.teams.find((team) => team.id === rec.id);
    const team: Team = existing || {
      id: rec.id,
      name: rec.name || `Équipe #${rec.id}`,
      sport: '',
      city: ''
    };

    this.joinTeam(team);
  }
}
