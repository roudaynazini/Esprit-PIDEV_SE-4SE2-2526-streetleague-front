import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Trophy, MapPin, Calendar, Activity, Users, TrendingUp, Clock, Star, ArrowRight, Bell, Target, X, type LucideIconData } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { BookingService, Reservation, Notification } from '../services/booking.service';

/** Internal type that replaces the string icon key with a resolved Lucide icon */
interface ActivityItem extends Omit<Notification, 'icon'> {
  icon: LucideIconData;
}

const ICON_MAP: Record<string, LucideIconData> = {
  bell: Bell,
  calendar: Calendar,
  trophy: Trophy,
  activity: Activity,
  users: Users,
  'map-pin': MapPin,
  clock: Clock,
  star: Star,
  target: Target,
};

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Welcome Header -->
        <div class="mb-8">
          <h1 class="mb-2">Bienvenue, <span class="text-primary">{{ userName }}</span> 👋</h1>
          <p class="text-muted-foreground">Voici un aperçu de votre activité sportive</p>
        </div>

        <!-- Quick Actions -->
        <div class="grid md:grid-cols-4 gap-4 mb-8">
          <a routerLink="/app/booking" class="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <lucide-icon [img]="CalendarIcon" class="w-6 h-6 text-primary"></lucide-icon>
              </div>
              <div><div class="font-semibold mb-1">Réserver</div><div class="text-sm text-muted-foreground">Un terrain</div></div>
            </div>
          </a>
          <a routerLink="/app/matches" class="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <lucide-icon [img]="TrophyIcon" class="w-6 h-6 text-accent"></lucide-icon>
              </div>
              <div><div class="font-semibold mb-1">Matchs</div><div class="text-sm text-muted-foreground">Voir tout</div></div>
            </div>
          </a>
          <a routerLink="/app/team" class="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <lucide-icon [img]="UsersIcon" class="w-6 h-6 text-primary"></lucide-icon>
              </div>
              <div><div class="font-semibold mb-1">Équipe</div><div class="text-sm text-muted-foreground">Gérer</div></div>
            </div>
          </a>
          <a routerLink="/app/performance" class="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <lucide-icon [img]="ActivityIcon" class="w-6 h-6 text-accent"></lucide-icon>
              </div>
              <div><div class="font-semibold mb-1">Stats</div><div class="text-sm text-muted-foreground">Voir mes performances</div></div>
            </div>
          </a>
        </div>

        <!-- Stats Grid -->
        <div class="grid md:grid-cols-4 gap-4 mb-8">
          <div *ngFor="let stat of stats" class="bg-card rounded-2xl p-6 border border-border">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <lucide-icon [img]="stat.icon" class="w-6 h-6 text-primary"></lucide-icon>
              </div>
              <span class="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-lg">{{ stat.trend }}</span>
            </div>
            <div class="text-3xl font-bold mb-1">{{ stat.value }}</div>
            <div class="text-sm text-muted-foreground">{{ stat.label }}</div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Upcoming Matches -->
          <div class="lg:col-span-2">
            <div class="bg-card rounded-2xl p-6 border border-border">
              <div class="flex items-center justify-between mb-6">
                <h3 class="flex items-center gap-2">
                  <lucide-icon [img]="CalendarIcon" class="w-5 h-5 text-primary"></lucide-icon>
                  Prochains matchs {{ upcomingMatches.length > 0 ? '(' + upcomingMatches.length + ')' : '' }}
                </h3>
                <a routerLink="/app/matches" class="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  Voir tout <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4"></lucide-icon>
                </a>
              </div>
              <div class="space-y-4">
                <div *ngIf="upcomingMatches.length === 0" class="text-center py-6 text-muted-foreground">
                  Aucun match prévu pour le moment.
                </div>
                <div *ngFor="let match of upcomingMatches" class="bg-muted/50 rounded-xl p-4 hover:bg-muted transition-all group" [ngClass]="{'opacity-60': match.status === 'cancelled'}">
                  <div class="flex items-start justify-between gap-4">
                    <a [routerLink]="match.status === 'confirmed' ? ['/app/matches', match.id] : null" class="flex-1 block" [class.pointer-events-none]="match.status === 'cancelled'">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full" [ngClass]="match.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'">
                          {{ match.status === 'cancelled' ? 'Annulée' : match.type }}
                        </span>
                        <h4 class="font-semibold" [ngClass]="{'group-hover:text-primary transition-colors': match.status === 'confirmed', 'text-muted-foreground': match.status === 'cancelled'}">{{ match.title }}</h4>
                      </div>
                      <div class="flex items-center gap-4 text-sm text-muted-foreground">
                        <div class="flex items-center gap-1"><lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon><span>{{ match.fieldName }}</span></div>
                        <div class="flex items-center gap-1"><lucide-icon [img]="ClockIcon" class="w-4 h-4"></lucide-icon><span>{{ match.time }} ({{match.duration}}h)</span></div>
                      </div>
                    </a>
                    <div class="flex items-center gap-2">
                      <div class="text-right">
                        <div class="text-sm font-semibold">{{ formatDate(match.date) }}</div>
                      </div>
                      <button 
                        *ngIf="match.status === 'confirmed'" 
                        (click)="cancelReservation(match)" 
                        [disabled]="cancelingReservationId === match.id"
                        class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        title="Annuler la réservation">
                        <lucide-icon [img]="XIcon" class="w-5 h-5"></lucide-icon>
                      </button>
                    </div>
                  </div>
                </div>
                <a routerLink="/app/booking" class="block bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 text-center border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all mt-4">
                  <lucide-icon [img]="TargetIcon" class="w-8 h-8 text-primary mx-auto mb-2"></lucide-icon>
                  <div class="font-semibold mb-1">Organiser un nouveau match</div>
                  <div class="text-sm text-muted-foreground">Réservez un terrain et invitez votre équipe</div>
                </a>
              </div>
            </div>
          </div>

          <!-- Recent Activity & Performance -->
          <div class="space-y-6">
            <div class="bg-card rounded-2xl p-6 border border-border">
              <div class="flex items-center justify-between mb-6">
                <h3 class="flex items-center gap-2"><lucide-icon [img]="BellIcon" class="w-5 h-5 text-accent"></lucide-icon>Activité récente</h3>
                <a routerLink="/app/notifications" class="text-sm text-primary font-semibold hover:underline">Tout voir</a>
              </div>
              <div class="space-y-4">
                <div *ngFor="let activity of recentActivities | slice:0:3" class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" [ngClass]="activity.bgColor || 'bg-muted'">
                    <lucide-icon [img]="activity.icon" class="w-5 h-5" [ngClass]="activity.iconColor || 'text-muted-foreground'"></lucide-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm mb-1">{{ activity.title }}</div>
                    <div class="text-sm text-muted-foreground mb-1 truncate">{{ activity.message }}</div>
                    <div class="text-xs text-muted-foreground">{{ activity.time }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-card rounded-2xl p-6 border border-border">
              <div class="flex items-center gap-2 mb-4">
                <lucide-icon [img]="TrendingUpIcon" class="w-5 h-5 text-primary"></lucide-icon>
                <h3>Progression ce mois-ci</h3>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between"><span class="text-sm text-muted-foreground">Matchs gagnés</span><span class="font-semibold">75%</span></div>
                <div class="w-full h-2 bg-muted rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:75%"></div></div>
                <div class="flex items-center justify-between"><span class="text-sm text-muted-foreground">Objectif mensuel</span><span class="font-semibold">8/10</span></div>
                <div class="w-full h-2 bg-muted rounded-full overflow-hidden"><div class="h-full bg-accent rounded-full" style="width:80%"></div></div>
              </div>
              <a routerLink="/app/performance" class="mt-6 flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-all">
                Voir mes stats complètes <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4"></lucide-icon>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  readonly CalendarIcon = Calendar;
  readonly TrophyIcon = Trophy;
  readonly UsersIcon = Users;
  readonly ActivityIcon = Activity;
  readonly MapPinIcon = MapPin;
  readonly ClockIcon = Clock;
  readonly ArrowRightIcon = ArrowRight;
  readonly BellIcon = Bell;
  readonly TargetIcon = Target;
  readonly TrendingUpIcon = TrendingUp;
  readonly XIcon = X;

  userName = '';
  cancelingReservationId: number | null = null;

  stats = [
    { label: 'Matchs joués', value: '24', icon: Trophy, trend: '+12%' },
    { label: 'Heures de jeu', value: '48h', icon: Clock, trend: '+8%' },
    { label: 'Terrains visités', value: '12', icon: MapPin, trend: '+3' },
    { label: 'Note moyenne', value: '4.8', icon: Star, trend: '+0.2' },
  ];

  upcomingMatches: Reservation[] = [];
  recentActivities: ActivityItem[] = [];

  private subs: Subscription = new Subscription();

  constructor(private bookingService: BookingService) { }

  ngOnInit() {
    this.userName = localStorage.getItem('user_name') || 'Utilisateur';

    this.bookingService.loadMyReservations();
    this.subs.add(
      this.bookingService.myReservations$.subscribe(reservations => {
        this.upcomingMatches = reservations.filter(r => r.status === 'confirmed');
      })
    );
    this.subs.add(
      this.bookingService.notifications$.subscribe(notifs => {
        // Resolve string icon keys -> actual Lucide icon objects
        this.recentActivities = notifs.map(n => ({
          ...n,
          icon: ICON_MAP[n.icon] ?? Bell,
        }));
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }

  cancelReservation(reservation: Reservation): void {
    const confirmCancel = confirm(`Êtes-vous sûr de vouloir annuler la réservation pour "${reservation.fieldName}" le ${this.formatDate(reservation.date)} à ${reservation.time} ?`);
    
    if (!confirmCancel) {
      return;
    }

    console.log('🗑️ Annulation de la réservation ID:', reservation.id);
    this.cancelingReservationId = reservation.id;

    this.subs.add(
      this.bookingService.cancelReservation(reservation.id).subscribe({
        next: (response) => {
          console.log('✅ Réservation annulée avec succès:', response);
          this.cancelingReservationId = null;
          // Recharger les réservations pour mettre à jour la liste
          const userId = localStorage.getItem('user_id') || '1';
          this.bookingService.getUserReservations(userId).subscribe(res => {
            this.upcomingMatches = res.filter(r => r.status === 'confirmed');
            console.log('📋 Réservations mises à jour:', this.upcomingMatches.length);
          });
        },
        error: (err) => {
          console.error('❌ Erreur lors de l\'annulation:', err);
          console.error('Status:', err.status);
          console.error('Message:', err.message);
          console.error('Full error:', err);
          const errorMsg = err?.error?.message || err?.message || 'Erreur lors de l\'annulation de la réservation';
          alert('Impossible d\'annuler la réservation: ' + errorMsg);
          this.cancelingReservationId = null;
        }
      })
    );
  }
}