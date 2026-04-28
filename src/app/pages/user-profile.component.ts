import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Mail, Phone, MapPin, Camera, Edit, Shield, Bell, LogOut, X, Activity } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';
import { PlayerService } from '../services/player.service';
import { PendingChangesService } from '../services/pending-changes.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    template: `
    <div class="p-6 max-w-3xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold text-foreground">Mon Profil</h1>

      <!-- Loading state -->
      <div *ngIf="isLoading" class="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center">
        <div class="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
        <p class="text-muted-foreground">Chargement de votre profil...</p>
      </div>

      <!-- Profile content (only show when loaded) -->
      <ng-container *ngIf="!isLoading">
      <!-- Avatar and basic info -->
      <div class="bg-card rounded-xl border border-border p-6">
        <div class="flex items-start gap-6">
          <div class="relative">
            <div class="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
              <img *ngIf="profileImageUrl" [src]="profileImageUrl" alt="Profile" class="w-full h-full object-cover">
              <lucide-icon *ngIf="!profileImageUrl" [img]="userIcon" [size]="40" class="text-primary"></lucide-icon>
            </div>
            <label class="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors cursor-pointer">
              <input type="file" (change)="onProfileImageSelected($event)" accept="image/*" class="hidden">
              <lucide-icon [img]="cameraIcon" [size]="12"></lucide-icon>
            </label>
            <!-- Progress indicator for upload -->
            <div *ngIf="uploadingImage" class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div class="flex-1">
            <div *ngIf="!editing" class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-3">
                  <h2 class="text-xl font-semibold text-foreground">{{profile.firstName}} {{profile.lastName}}</h2>
                  <span *ngIf="hasUnsavedChanges" class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                    💾 Changements en attente
                  </span>
                </div>
                <p class="text-muted-foreground">{{profile.role}}</p>
                <div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1"><lucide-icon [img]="mailIcon" [size]="14"></lucide-icon>{{profile.email}}</span>
                  <span class="flex items-center gap-1"><lucide-icon [img]="phoneIcon" [size]="14"></lucide-icon>{{profile.phone}}</span>
                </div>
              </div>
              <button (click)="startEditing()" class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                <lucide-icon [img]="editIcon" [size]="14"></lucide-icon>
                Modifier
              </button>
            </div>

            <!-- Player Info Display -->
            <div *ngIf="!editing && isPlayer" class="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Niveau</p>
                <p class="text-sm font-medium text-foreground">
                  <span class="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary">
                    <lucide-icon [img]="ActivityIcon" [size]="14" class="mr-1"></lucide-icon>
                    Level {{profile.skillLevel}}
                  </span>
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Position</p>
                <p class="text-sm font-medium text-foreground">
                  <span class="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary">
                    <lucide-icon [img]="locationIcon" [size]="14" class="mr-1"></lucide-icon>
                    {{profile.position || 'ANY'}}
                  </span>
                </p>
              </div>
            </div>

            <div *ngIf="editing" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-foreground mb-2">Prénom</label>
                  <input type="text" [(ngModel)]="editedProfile.firstName" (ngModelChange)="onProfileFieldChange()" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                </div>
                <div>
                  <label class="block text-xs font-medium text-foreground mb-2">Nom</label>
                  <input type="text" [(ngModel)]="editedProfile.lastName" (ngModelChange)="onProfileFieldChange()" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-2">Email</label>
                <input type="email" [(ngModel)]="editedProfile.email" (ngModelChange)="onProfileFieldChange()" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-2">Téléphone</label>
                <input type="tel" [(ngModel)]="editedProfile.phone" (ngModelChange)="onProfileFieldChange()" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              </div>
              <div>
                <label class="block text-xs font-medium text-foreground mb-2">Mot de passe (pour confirmer)</label>
                <input type="password" [(ngModel)]="editedProfile.password" (ngModelChange)="onProfileFieldChange()" placeholder="Votre mot de passe" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                <p class="text-xs text-muted-foreground mt-1">Le mot de passe est requis pour protéger votre compte</p>
              </div>

              <!-- Player specific fields form -->
              <div *ngIf="isPlayer" class="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 mt-2">
                <div>
                  <label class="block text-xs font-medium text-foreground mb-2">Niveau (1-5)</label>
                  <select [(ngModel)]="editedProfile.skillLevel" (ngModelChange)="onProfileFieldChange()" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option [value]="1">1 - Débutant</option>
                    <option [value]="2">2 - Amateur</option>
                    <option [value]="3">3 - Intermédiaire</option>
                    <option [value]="4">4 - Avancé</option>
                    <option [value]="5">5 - Pro</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-foreground mb-2">Position</label>
                  <select [(ngModel)]="editedProfile.position" (ngModelChange)="onProfileFieldChange()" class="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option value="DEFENDER">Défenseur</option>
                    <option value="MIDFIELDER">Milieu</option>
                    <option value="STRIKER">Attaquant</option>
                    <option value="GOALKEEPER">Gardien</option>
                    <option value="ANY">Peu importe</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button (click)="saveProfile()" [disabled]="savingProfile || !editedProfile.password" class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <span *ngIf="!savingProfile">✓ Enregistrer</span>
                  <span *ngIf="savingProfile">Enregistrement...</span>
                </button>
                <button (click)="cancelEditing()" class="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div *ngFor="let stat of stats" class="bg-card rounded-xl border border-border p-4 text-center">
          <p class="text-2xl font-bold text-primary">{{stat.value}}</p>
          <p class="text-sm text-muted-foreground">{{stat.label}}</p>
        </div>
      </div>

      <!-- Settings sections -->
      <div class="space-y-3">
        <div *ngFor="let section of sections" class="bg-card rounded-xl border border-border p-5">
          <div class="flex items-center gap-3 mb-3">
            <lucide-icon [img]="section.iconComponent" [size]="18" class="text-primary"></lucide-icon>
            <h3 class="font-semibold text-foreground">{{section.title}}</h3>
          </div>
          <div class="space-y-2 pl-7">
            <div *ngFor="let item of section.items; let i = index" class="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span class="text-sm text-foreground">{{item.label}}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="item.value" (ngModelChange)="updateNotificationPreference(section.title, i, $event)" class="sr-only peer">
                <div class="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification message -->
      <div *ngIf="notificationMessage" class="fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white text-sm"
           [ngClass]="notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'">
        {{notificationMessage}}
      </div>
      </ng-container>
    </div>
  `
})
export class UserProfileComponent implements OnInit, OnDestroy {
    readonly userIcon = User;
    readonly mailIcon = Mail;
    readonly phoneIcon = Phone;
    readonly locationIcon = MapPin;
    readonly cameraIcon = Camera;
    readonly editIcon = Edit;
    readonly shieldIcon = Shield;
    readonly bellIcon = Bell;
    readonly ActivityIcon = Activity;

    editing = false;
    isPlayer = false;
    savingProfile = false;
    uploadingImage = false;
    notificationMessage = '';
    notificationType: 'success' | 'error' = 'success';
    hasUnsavedChanges = false;
    isLoading = true;

    profileImageUrl: string | null = null;
    private profileImageObjectUrl: string | null = null;

    profile: any = {
        firstName: '',
        lastName: '',
        role: '',
        email: '',
        phone: '',
        skillLevel: 1,
        position: 'ANY',
        rating: 0,
        gamesPlayed: 0
    };

    editedProfile: any = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        skillLevel: 1,
        position: 'ANY',
        rating: 0,
        gamesPlayed: 0
    };

    stats = [
        { label: 'Matchs Joués', value: '47' },
        { label: 'Buts Marqués', value: '23' },
        { label: 'Équipes', value: '3' },
    ];

    sections = [
        {
            title: 'Notifications',
            iconComponent: Bell,
            items: [
                { label: 'Nouveaux matchs', value: true },
                { label: 'Messages équipe', value: true },
                { label: 'Rappels réservation', value: true },
                { label: 'Newsletters', value: false },
            ]
        },
        {
            title: 'Confidentialité',
            iconComponent: Shield,
            items: [
                { label: 'Profil visible publiquement', value: true },
                { label: 'Partager les statistiques', value: false },
            ]
        }
    ];

    constructor(private userService: UserService, private playerService: PlayerService, private router: Router, private activatedRoute: ActivatedRoute, private pendingChangesService: PendingChangesService) { }

    ngOnInit() {
        // Register this component with the pending changes service for auto-save on logout
        this.pendingChangesService.registerProfileComponent(this);

        // ÉTAPE 1: Récupérer le profil depuis le resolver (données déjà chargées AVANT le composant)
        const resolvedProfile = this.activatedRoute.snapshot.data['profile'];

        // ÉTAPE 2: Vérifier les changements sauvegardés dans localStorage
        const savedChangesStr = localStorage.getItem('userProfilePendingChanges');
        const currentUserId = localStorage.getItem('user_id');

        let hasSavedChanges = false;

        if (savedChangesStr && currentUserId) {
            try {
                const saved = JSON.parse(savedChangesStr);

                // Vérifier que les changements sont pour l'utilisateur actuel
                if (saved.userId === currentUserId) {
                    console.log('📝 Changements sauvegardés trouvés pour cet utilisateur:', saved);

                    // Restaurer les données sauvegardées
                    this.editedProfile = saved.profile;
                    this.profile = {
                        firstName: saved.profile.firstName,
                        lastName: saved.profile.lastName,
                        email: saved.profile.email,
                        phone: saved.profile.phone,
                        role: resolvedProfile?.role || 'Utilisateur'
                    };
                    this.hasUnsavedChanges = true;
                    this.editing = true;
                    hasSavedChanges = true;

                    console.log('✅ Changements restaurés - Mode édition activé');
                    this.showNotification('📝 Vos modifications précédentes ont été restaurées', 'success');
                }
            } catch (e) {
                console.error('Erreur lors de la lecture des changements sauvegardés:', e);
            }
        }

        // ÉTAPE 3: Utiliser les données du resolver si pas de changements sauvegardés
        if (!hasSavedChanges && resolvedProfile) {
            this.profile = resolvedProfile;
            this.editedProfile = {
                firstName: resolvedProfile.firstName || '',
                lastName: resolvedProfile.lastName || '',
                email: resolvedProfile.email || '',
                phone: resolvedProfile.phone || '',
                password: ''
            };
            console.log('📥 Profil du resolver chargé et affichage immédiat');
        }

        // ÉTAPE 4: Les données sont maintenant prêtes, arrêter le chargement
        this.isLoading = false;

        // Setup Player specific data
        const type = localStorage.getItem('user_type');
        this.isPlayer = type === 'ROLE_PLAYER' || type === 'player' || resolvedProfile?.role === 'ROLE_PLAYER';

        if (this.isPlayer && currentUserId && !hasSavedChanges) {
            this.playerService.getById(parseInt(currentUserId, 10)).subscribe({
                next: (p) => {
                    this.profile.skillLevel = p.skillLevel || 1;
                    this.profile.position = p.position || 'ANY';
                    this.profile.rating = p.rating || 0;
                    this.profile.gamesPlayed = p.gamesPlayed || 0;

                    this.editedProfile.skillLevel = this.profile.skillLevel;
                    this.editedProfile.position = this.profile.position;
                    this.editedProfile.rating = this.profile.rating;
                    this.editedProfile.gamesPlayed = this.profile.gamesPlayed;

                    this.stats[0].value = this.profile.gamesPlayed.toString();
                },
                error: (e) => console.log('Could not fetch player details', e)
            });
        }

        // ÉTAPE 5: Charger la photo de profil via HttpClient pour inclure le token d'authentification
        this.loadProfileImage();
    }

    ngOnDestroy() {
        this.pendingChangesService.unregisterProfileComponent();
        this.revokeProfileImageObjectUrl();
    }

    startEditing() {
        this.editing = true;

        // Si on a déjà des changements en attente, ne pas les perdre
        if (this.hasUnsavedChanges) {
            console.log('ℹ️ Changements en attente conservés');
            return;
        }

        // Sinon, initialiser avec les données actuelles du profil
        this.editedProfile = {
            firstName: this.profile.firstName || '',
            lastName: this.profile.lastName || '',
            email: this.profile.email || '',
            phone: this.profile.phone || '',
            password: ''
        };
    }

    cancelEditing() {
        this.editing = false;
        this.hasUnsavedChanges = false;
        this.editedProfile = {
            firstName: this.profile.firstName,
            lastName: this.profile.lastName,
            email: this.profile.email,
            phone: this.profile.phone,
            password: ''
        };
        // Supprimer les changements en attente
        localStorage.removeItem('userProfilePendingChanges');
        localStorage.removeItem('pendingProfileChanges');
        sessionStorage.removeItem('pendingProfileSave');
        this.showNotification('❌ Modifications annulées', 'error');
    }

    /**
     * Track changes to profile fields and save PERMANENTLY in localStorage
     */
    onProfileFieldChange() {
        // Detect if there are actual changes (ignore whitespace)
        const hasChanges =
            (this.editedProfile.firstName || '').trim() !== (this.profile.firstName || '').trim() ||
            (this.editedProfile.lastName || '').trim() !== (this.profile.lastName || '').trim() ||
            (this.editedProfile.email || '').trim() !== (this.profile.email || '').trim() ||
            (this.editedProfile.phone || '').trim() !== (this.profile.phone || '').trim() ||
            (this.editedProfile.skillLevel !== this.profile.skillLevel) ||
            (this.editedProfile.position !== this.profile.position);

        if (hasChanges) {
            this.hasUnsavedChanges = true;

            // Get current user ID
            const userId = localStorage.getItem('user_id');

            // Save with userId so changes are tied to the user
            const dataToSave = {
                userId: userId,
                profile: {
                    firstName: this.editedProfile.firstName || '',
                    lastName: this.editedProfile.lastName || '',
                    email: this.editedProfile.email || '',
                    phone: this.editedProfile.phone || '',
                    password: this.editedProfile.password || ''
                },
                lastModified: Date.now()
            };

            // Use permanent key that survives navigation and logout
            localStorage.setItem('userProfilePendingChanges', JSON.stringify(dataToSave));
            console.log('💾 Changements SAUVEGARDÉS DÉFINITIVEMENT (persisteront après reconnexion):', dataToSave.profile);
        } else {
            this.hasUnsavedChanges = false;
            localStorage.removeItem('userProfilePendingChanges');
            console.log('ℹ️ Aucun changement - données nettoyées');
        }
    }

    saveProfile() {
        // Valider que le password est fourni
        if (!this.editedProfile.password || this.editedProfile.password.trim() === '') {
            this.showNotification('❌ Veuillez entrer votre mot de passe pour confirmer', 'error');
            this.savingProfile = false;
            return;
        }

        this.savingProfile = true;

        const saveReq = this.isPlayer
            ? this.playerService.update(parseInt(localStorage.getItem('user_id')!, 10), this.editedProfile)
            : this.userService.updateUserProfile(this.editedProfile);

        saveReq.subscribe({
            next: () => {
                // ✅ SUCCÈS: Synchroniser l'état
                this.profile = {
                    ...this.editedProfile,
                    role: this.profile.role
                };

                // Réinitialiser pour la prochaine édition
                this.editedProfile = { ...this.profile, password: '' };

                this.editing = false;
                this.hasUnsavedChanges = false;
                this.savingProfile = false;

                // 🗑️ Nettoyer TOUTES les clés de changements sauvegardés (définitif et temporaire)
                localStorage.removeItem('userProfilePendingChanges');
                localStorage.removeItem('pendingProfileChanges');
                sessionStorage.removeItem('pendingProfileSave');

                console.log('✅ Profil SAUVEGARDÉ avec succès - Changements nettoyés');
                this.showNotification('✅ Profil mise à jour avec succès!', 'success');
            },
            error: (err) => {
                this.savingProfile = false;

                let errorMsg = '❌ Erreur lors de la mise à jour du profil';

                if (err?.error?.password) {
                    errorMsg = `❌ ${err.error.password}`;
                } else if (err?.error?.email) {
                    errorMsg = `❌ ${err.error.email}`;
                } else if (err?.error?.message) {
                    errorMsg = `❌ ${err.error.message}`;
                } else if (err?.status === 400) {
                    errorMsg = '❌ Mot de passe incorrect ou données invalides';
                } else if (err?.status === 401) {
                    errorMsg = '❌ Non authentifié. Veuillez vous reconnecter';
                } else if (err?.status === 403) {
                    errorMsg = '❌ Accès refusé (403) - Le backend a refusé votre demande';
                }

                // ⚠️ ERREUR: Garder leschangements sauvegardés pour nouvelle tentative
                console.error('Erreur lors de la sauvegarde:', err);
                this.showNotification(errorMsg, 'error');
            }
        });
    }

    onProfileImageSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Vérifier la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('❌ Image trop grande (max 5MB)', 'error');
                return;
            }

            // Aperçu local
            const reader = new FileReader();
            reader.onload = (e) => {
                this.profileImageUrl = e.target?.result as string;
            };
            reader.readAsDataURL(file);

            // Upload vers le backend
            this.uploadingImage = true;
            this.userService.uploadProfileImage(file).subscribe({
                next: () => {
                    this.uploadingImage = false;
                    this.loadProfileImage();
                    this.showNotification('✅ Photo de profil téléchargée!', 'success');
                },
                error: (err) => {
                    this.uploadingImage = false;
                    let errorMsg = '❌ Erreur lors du téléchargement';

                    console.error('Upload error details:', {
                        status: err.status,
                        statusText: err.statusText,
                        message: err.message,
                        error: err.error
                    });

                    if (err.status === 403) {
                        errorMsg = '❌ Accès refusé (403) - Permissions insuffisantes';
                        console.error('🔐 403 Forbidden: Le backend refuse l\'accès à POST /api/users/{userId}/profile-image');
                        console.error('   ➜ Vérifiez les permissions sur le serveur');
                        console.error('   ➜ L\'endpoint doit autoriser les uploads d\'image');
                    } else if (err.status === 401) {
                        errorMsg = '❌ Non authentifié (401) - Reconnectez-vous';
                        console.error('🔑 401 Unauthorized: Le token d\'authentification est invalide');
                    } else if (err.status === 400) {
                        errorMsg = `❌ Requête invalide: ${err.error?.message || 'Format d\'image non supporté'}`;
                    } else if (err.status === 413) {
                        errorMsg = '❌ Image trop grande pour le serveur';
                    } else if (err.status === 500) {
                        errorMsg = '❌ Erreur serveur (500) - Réessayez plus tard';
                    } else if (!err.status) {
                        errorMsg = '❌ Erreur réseau - Vérifiez votre connexion';
                    } else {
                        errorMsg = `❌ Erreur ${err.status}: ${err.statusText || 'Inconnue'}`;
                    }

                    this.showNotification(errorMsg, 'error');
                    console.error('Error uploading image:', err);
                }
            });
        }
    }

    updateNotificationPreference(sectionTitle: string, itemIndex: number, value: boolean) {
        // À implémenter: sauvegarder les préférences au backend
        console.log(`Updated ${sectionTitle} - item ${itemIndex} to ${value}`);
    }

    /**
     * Auto-save profile changes when user navigates away or logs out
     * This is called before logout to ensure data is persisted
     */
    autoSaveIfNeeded(): void {
        // Only attempt auto-save if there are actual unsaved changes and we're in edit mode
        if (!this.hasUnsavedChanges || !this.editing || this.savingProfile) {
            console.log('ℹ️ Pas de changements à sauvegarder automatiquement');
            return;
        }

        // Detect if there are actual changes (compare without password field)
        const hasChanges =
            (this.editedProfile.firstName || '').trim() !== (this.profile.firstName || '').trim() ||
            (this.editedProfile.lastName || '').trim() !== (this.profile.lastName || '').trim() ||
            (this.editedProfile.email || '').trim() !== (this.profile.email || '').trim() ||
            (this.editedProfile.phone || '').trim() !== (this.profile.phone || '').trim() ||
            (this.editedProfile.skillLevel !== this.profile.skillLevel) ||
            (this.editedProfile.position !== this.profile.position);

        if (!hasChanges) {
            console.log('ℹ️ Aucun changement réel détecté');
            return;
        }

        console.log('🔄 Tentative de sauvegarde automatique avant déconnexion...');

        // If password not provided, just keep the local changes
        if (!this.editedProfile.password || this.editedProfile.password.trim() === '') {
            console.log('⚠️ Mot de passe manquant - changements gardés localement');
            return;
        }

        this.savingProfile = true;
        const autoSaveReq = this.isPlayer
            ? this.playerService.update(parseInt(localStorage.getItem('user_id')!, 10), this.editedProfile)
            : this.userService.updateUserProfile(this.editedProfile);

        autoSaveReq.subscribe({
            next: () => {
                this.profile = { ...this.editedProfile, role: this.profile.role };
                this.editing = false;
                this.hasUnsavedChanges = false;
                this.savingProfile = false;
                localStorage.removeItem('userProfilePendingChanges');
                localStorage.removeItem('pendingProfileChanges');
                sessionStorage.removeItem('pendingProfileSave');
                console.log('✅ Profil auto-sauvegardé avec succès avant déconnexion');
            },
            error: (err) => {
                this.savingProfile = false;
                console.error('❌ Erreur lors de l\'auto-sauvegarde:', err);
                // Keep the pending save flag so user is aware
            }
        });
    }

    private showNotification(message: string, type: 'success' | 'error') {
        this.notificationMessage = message;
        this.notificationType = type;
        setTimeout(() => {
            this.notificationMessage = '';
        }, 3000);
    }

    private loadProfileImage(): void {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            this.revokeProfileImageObjectUrl();
            this.profileImageUrl = null;
            return;
        }

        this.userService.getProfileImageBlob(parseInt(userId, 10)).subscribe({
            next: (blob) => {
                this.revokeProfileImageObjectUrl();
                this.profileImageObjectUrl = URL.createObjectURL(blob);
                this.profileImageUrl = this.profileImageObjectUrl;
                console.log('✅ URL locale de photo de profil définie');
            },
            error: (err) => {
                this.revokeProfileImageObjectUrl();
                this.profileImageUrl = null;

                if (err.status === 404) {
                    // Pas de photo → normal, pas d'erreur
                    console.log('ℹ️ Aucune photo de profil - icône par défaut');
                } else if (err.status === 403) {
                    console.warn('⚠️ Accès refusé (403) lors du chargement de la photo');
                } else {
                    // Seulement logger en erreur pour les vrais problèmes
                    console.error('❌ Erreur chargement photo:', err);
                }
            }
        });
    }

    private revokeProfileImageObjectUrl(): void {
        if (this.profileImageObjectUrl) {
            URL.revokeObjectURL(this.profileImageObjectUrl);
            this.profileImageObjectUrl = null;
        }
    }
}
