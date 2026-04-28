import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchingService, MatchResponse } from '../services/matching.service';
import { LucideAngularModule, Trophy, MapPin, Users, Activity, Star, Crosshair } from 'lucide-angular';

@Component({
  selector: 'app-smart-matching',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-6 md:p-12">
      <!-- Header Area -->
      <div class="max-w-7xl mx-auto mb-10 text-center">
        <h1 class="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-4 tracking-tight">
          Smart Matching
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Trouvez l'équipe ou le joueur idéal grâce à notre algorithme intelligent qui analyse vos statistiques, position, et géolocalisation.
        </p>
      </div>

      <!-- Controls Area -->
      <div class="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-center gap-4">
        <div class="bg-card p-4 rounded-3xl border border-border/50 shadow-lg shadow-black/5 flex items-center gap-4">
          <label class="font-semibold text-foreground whitespace-nowrap px-2">Type de Recherche :</label>
          <div class="flex bg-muted rounded-2xl p-1">
            <button
              (click)="setSearchType('teams')"
              [class.bg-background]="searchType === 'teams'"
              [class.shadow-md]="searchType === 'teams'"
              class="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300">
              Chercher des Équipes
            </button>
            <button
              (click)="setSearchType('players')"
              [class.bg-background]="searchType === 'players'"
              [class.shadow-md]="searchType === 'players'"
              class="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300">
              Chercher des Joueurs
            </button>
          </div>
        </div>
        
        <div class="bg-card p-4 rounded-3xl border border-border/50 shadow-lg shadow-black/5 flex items-center gap-3">
          <input 
            type="number" 
            [(ngModel)]="searchId" 
            placeholder="Mon ID..." 
            class="w-32 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
          <button 
            (click)="triggerSearch()" 
            class="bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-md shadow-primary/30">
             <lucide-icon [img]="CrosshairIcon" class="h-4 w-4"></lucide-icon>
             <span>Matcher !</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
        <p class="mt-6 text-xl font-medium animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Calcul des meilleures compatibilités...</p>
      </div>

      <!-- Initial State -->
      <div *ngIf="!loading && !hasSearched" class="max-w-4xl mx-auto text-center py-16 opacity-50">
        <lucide-icon [img]="UsersIcon" class="h-24 w-24 mx-auto mb-6 opacity-30"></lucide-icon>
        <p class="text-xl">Veuillez entrer votre ID actuel pour lancer l'algorithme.</p>
      </div>

      <!-- Results Grid -->
      <div *ngIf="!loading && hasSearched && matches.length > 0" class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let match of matches; let i = index" 
             class="group relative bg-card rounded-3xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300">
          
          <!-- Top Accent Bar -->
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-accent"></div>
          
          <!-- Rank Badge -->
          <div class="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center font-bold text-lg"
               [ngClass]="getRankColor(i)">
            #{{i + 1}}
          </div>
          
          <div class="p-8">
            <div class="flex items-center gap-4 mb-6">
              <div class="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 shadow-inner">
                <lucide-icon [img]="searchType === 'teams' ? UsersIcon : UserIcon" class="h-8 w-8 text-muted-foreground"></lucide-icon>
              </div>
              <div>
                <h3 class="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">{{ match.name }}</h3>
                <div class="flex items-center gap-1.5 text-sm font-medium mt-1" [ngClass]="getScoreColor(match.score)">
                  <lucide-icon [img]="ActivityIcon" class="h-4 w-4"></lucide-icon>
                  Score: {{ match.score }}%
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-start gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50">
                <lucide-icon [img]="TrophyIcon" class="h-5 w-5 text-accent mt-0.5"></lucide-icon>
                <div class="flex-1">
                  <p class="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Détails Du Match</p>
                  <p class="text-sm font-medium leading-relaxed">{{ match.matchDetails }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                <div class="flex items-center gap-2 text-muted-foreground font-medium">
                  <lucide-icon [img]="MapPinIcon" class="h-4 w-4"></lucide-icon>
                  <span class="text-sm">Distance Approximative</span>
                </div>
                <span class="font-bold text-foreground bg-background px-3 py-1 rounded-lg shadow-sm border border-border">{{ match.distanceKm }} km</span>
              </div>
            </div>
            
            <button class="w-full mt-6 bg-background border-2 border-primary/20 text-foreground py-3 rounded-xl font-bold tracking-wide hover:bg-primary/10 hover:border-primary transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground">
              {{ searchType === 'teams' ? 'Rejoindre Équipe' : 'Inviter Joueur' }}
            </button>
          </div>
        </div>
      </div>

      <!-- No Results State -->
      <div *ngIf="!loading && hasSearched && matches.length === 0" class="max-w-2xl mx-auto bg-muted rounded-3xl p-12 text-center border border-border">
        <lucide-icon [img]="StarIcon" class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50"></lucide-icon>
        <h3 class="text-2xl font-bold mb-2">Aucune Correspondance Trouvée</h3>
        <p class="text-muted-foreground">L'algorithme n'a pas pu trouver de correspondances avec vos paramètres actuels. Essayez de mettre à jour votre profil !</p>
      </div>

    </div>
  `
})
export class SmartMatchingComponent implements OnInit {
  searchType: 'teams' | 'players' = 'teams';
  searchId: number | null = null;
  
  loading = false;
  hasSearched = false;
  matches: MatchResponse[] = [];

  readonly TrophyIcon = Trophy;
  readonly MapPinIcon = MapPin;
  readonly UsersIcon = Users;
  readonly UserIcon = Users; // Using Users since Lucide User requires standard import. 
  readonly ActivityIcon = Activity;
  readonly StarIcon = Star;
  readonly CrosshairIcon = Crosshair;

  constructor(private matchingService: MatchingService) { }

  ngOnInit() {
    const id = localStorage.getItem('user_id');
    if (id) {
      this.searchId = parseInt(id, 10);
      // Auto-trigger if we have ID
      this.triggerSearch();
    }
  }

  setSearchType(type: 'teams' | 'players') {
    this.searchType = type;
    this.hasSearched = false;
    this.matches = [];
  }

  triggerSearch() {
    if (!this.searchId) return;
    
    this.loading = true;
    this.hasSearched = true;

    if (this.searchType === 'teams') {
      this.matchingService.getBestTeamsForPlayer(this.searchId).subscribe({
        next: (data) => {
          this.matches = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.matches = [];
        }
      });
    } else {
      this.matchingService.getBestPlayersForTeam(this.searchId).subscribe({
        next: (data) => {
          this.matches = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.matches = [];
        }
      });
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  }

  getRankColor(index: number): string {
    if (index === 0) return 'text-amber-400 border-amber-400/50 shadow-amber-400/20'; // Gold
    if (index === 1) return 'text-slate-400 border-slate-400/50 shadow-slate-400/20'; // Silver
    if (index === 2) return 'text-amber-700 border-amber-700/50 shadow-amber-700/20'; // Bronze
    return 'text-muted-foreground';
  }
}
