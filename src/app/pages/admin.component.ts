import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Settings, Users, MapPin, Trophy, TrendingUp, CheckCircle, XCircle, Package } from 'lucide-angular';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="mb-2">Administration</h1>
          <p class="text-muted-foreground">Gérez les utilisateurs, terrains et activités</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-card rounded-2xl p-6 border border-border">
            <lucide-icon [name]="UsersIcon" [size]="32" class="text-primary mb-2"></lucide-icon>
            <div class="text-3xl font-bold text-primary">10,482</div>
            <div class="text-sm text-muted-foreground">Utilisateurs</div>
          </div>
          <div class="bg-card rounded-2xl p-6 border border-border">
            <lucide-icon [name]="MapPinIcon" [size]="32" class="text-accent mb-2"></lucide-icon>
            <div class="text-3xl font-bold text-accent">512</div>
            <div class="text-sm text-muted-foreground">Terrains</div>
          </div>
          <div class="bg-card rounded-2xl p-6 border border-border">
            <lucide-icon [name]="TrophyIcon" [size]="32" class="text-green-500 mb-2"></lucide-icon>
            <div class="text-3xl font-bold text-green-500">52,341</div>
            <div class="text-sm text-muted-foreground">Matchs</div>
          </div>
          <div class="bg-card rounded-2xl p-6 border border-border">
            <lucide-icon [name]="TrendingUpIcon" [size]="32" class="text-primary mb-2"></lucide-icon>
            <div class="text-3xl font-bold">€128k</div>
            <div class="text-sm text-muted-foreground">Revenus</div>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Pending Actions -->
          <div class="lg:col-span-2">
            <div class="bg-card rounded-2xl p-6 border border-border mb-6">
              <h3 class="mb-6">Demandes en attente</h3>
              <div class="space-y-4">
                <div *ngFor="let request of pendingRequests" class="flex items-center gap-4 p-4 bg-muted/30 rounded-xl"
                  [ngClass]="request.approved === true ? 'opacity-50' : request.approved === false ? 'opacity-50 line-through' : ''">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {{ request.name.substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-sm">{{ request.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ request.type }} • {{ request.time }}</div>
                  </div>
                  <div class="flex gap-2" *ngIf="request.approved === null">
                    <button (click)="approveRequest(request)" class="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all">
                      <lucide-icon [name]="CheckCircleIcon" [size]="16"></lucide-icon>
                    </button>
                    <button (click)="rejectRequest(request)" class="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all">
                      <lucide-icon [name]="XCircleIcon" [size]="16"></lucide-icon>
                    </button>
                  </div>
                  <span *ngIf="request.approved === true" class="text-xs text-green-500 font-semibold">✓ Approuvé</span>
                  <span *ngIf="request.approved === false" class="text-xs text-destructive font-semibold">✗ Rejeté</span>
                </div>
              </div>
            </div>

            <!-- Recent Bookings -->
            <div class="bg-card rounded-2xl p-6 border border-border">
              <h3 class="mb-6">Réservations récentes</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-border">
                      <th class="py-2 text-left font-semibold text-muted-foreground">Utilisateur</th>
                      <th class="py-2 text-left font-semibold text-muted-foreground">Terrain</th>
                      <th class="py-2 text-left font-semibold text-muted-foreground">Date</th>
                      <th class="py-2 text-left font-semibold text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let booking of recentBookings" class="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td class="py-3 font-semibold">{{ booking.user }}</td>
                      <td class="py-3 text-muted-foreground">{{ booking.field }}</td>
                      <td class="py-3 text-muted-foreground">{{ booking.date }}</td>
                      <td class="py-3">
                        <span class="text-xs px-2 py-1 rounded-full font-semibold"
                          [ngClass]="booking.status === 'Confirmée' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'">
                          {{ booking.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-6">
            <div class="bg-card rounded-2xl p-6 border border-border">
              <h3 class="mb-4">Actions rapides</h3>
              <div class="space-y-3">
                <button (click)="router.navigate(['/app/admin/users'])" class="w-full py-3 text-sm bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all font-semibold">Gestion des Utilisateurs</button>
                <button (click)="router.navigate(['/app/admin/products'])" class="w-full py-3 text-sm bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-all font-semibold shadow-sm text-center">Gestion de la Boutique (Inventaire)</button>
                <button (click)="router.navigate(['/app/admin/badges/dashboard'])" class="w-full py-3 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-semibold">🎖️ Gestion des Badges</button>
                <button (click)="router.navigate(['/app/admin/performances/dashboard'])" class="w-full py-3 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold">📊 Performance Tracking</button>
                <button (click)="router.navigate(['/app/fields/add'])" class="w-full py-3 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold">Ajouter un terrain</button>
                <button (click)="router.navigate(['/app/matches'])" class="w-full py-3 text-sm bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-all">Créer un tournoi</button>
                <button (click)="exportReport()" class="w-full py-3 text-sm border border-border rounded-xl hover:bg-muted transition-all font-semibold">Exporter les rapports</button>
              </div>
            </div>
            <div class="bg-card rounded-2xl p-6 border border-border">
              <h3 class="mb-4">Alertes système</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <div class="w-2 h-2 bg-primary rounded-full"></div>
                  <div class="text-sm">12 nouveaux utilisateurs</div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                  <div class="w-2 h-2 bg-accent rounded-full"></div>
                  <div class="text-sm">3 terrains en attente</div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                  <div class="w-2 h-2 bg-destructive rounded-full"></div>
                  <div class="text-sm">1 paiement en litige</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div *ngIf="toast" class="fixed bottom-6 right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm font-medium text-foreground z-50">
        {{ toast }}
      </div>
    </div>
  `,
})
export class AdminComponent {
    readonly UsersIcon = Users;
    readonly MapPinIcon = MapPin;
    readonly TrophyIcon = Trophy;
    readonly TrendingUpIcon = TrendingUp;
    readonly CheckCircleIcon = CheckCircle;
    readonly XCircleIcon = XCircle;

    toast: string | null = null;
    constructor(public router: Router) { }

    pendingRequests: any[] = [
        { name: 'Marc Dupont', type: 'Nouveau terrain', time: 'Il y a 2h', approved: null },
        { name: 'Sophie Martin', type: 'Vérification joueur', time: 'Il y a 3h', approved: null },
        { name: 'Ahmed Benali', type: 'Nouveau terrain', time: 'Il y a 5h', approved: null },
        { name: 'Julie Bernard', type: 'Reclamation', time: 'Il y a 6h', approved: null },
    ];

    recentBookings = [
        { user: 'Alex R.', field: 'Parc Central', date: '10/02/2026', status: 'Confirmée' },
        { user: 'Morgan L.', field: 'Court Premium', date: '12/02/2026', status: 'Confirmée' },
        { user: 'Jordan C.', field: 'Tennis Elite', date: '15/02/2026', status: 'En attente' },
        { user: 'Taylor B.', field: 'Multisport City', date: '18/02/2026', status: 'Confirmée' },
    ];

    approveRequest(req: any) {
        req.approved = true;
        this.showToast(`✅ Demande de ${req.name} approuvée`);
    }

    rejectRequest(req: any) {
        req.approved = false;
        this.showToast(`❌ Demande de ${req.name} rejetée`);
    }

    exportReport() {
        this.showToast('📊 Export CSV en cours de préparation...');
    }

    showToast(msg: string) {
        this.toast = msg;
        setTimeout(() => this.toast = null, 3000);
    }
}
