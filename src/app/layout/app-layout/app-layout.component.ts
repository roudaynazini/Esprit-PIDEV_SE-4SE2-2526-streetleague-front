import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import {
    LucideAngularModule, Home, Users, Trophy, MapPin,
    MessageSquare, Activity, Gift, Settings, Map,
    LogOut, Menu, X, Bell, User, Heart, ShoppingCart, Swords, Tags
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { PendingChangesService } from '../../services/pending-changes.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterModule, LucideAngularModule],
    templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent implements OnInit {
    userName = '';
    userEmail = '';
    userType = '';
    mobileMenuOpen = false;
    unreadNotifications = 3;

    readonly HomeIcon = Home;
    readonly UsersIcon = Users;
    readonly TrophyIcon = Trophy;
    readonly MapPinIcon = MapPin;
    readonly MessageSquareIcon = MessageSquare;
    readonly ActivityIcon = Activity;
    readonly GiftIcon = Gift;
    readonly SettingsIcon = Settings;
    readonly MapIcon = Map;
    readonly LogOutIcon = LogOut;
    readonly MenuIcon = Menu;
    readonly XIcon = X;
    readonly BellIcon = Bell;
    readonly UserIcon = User;
    readonly HeartIcon = Heart;
    readonly ShoppingCartIcon = ShoppingCart;
    readonly SwordsIcon = Swords;
    readonly TagsIcon = Tags;

    navItems = [
        { path: '/app', icon: this.HomeIcon, label: 'Dashboard Admin', roles: ['ROLE_ADMIN'] },
        { path: '/app/admin', icon: this.SettingsIcon, label: 'Admin', roles: ['ROLE_ADMIN'] },
        { path: '/app/admin/users', icon: this.UsersIcon, label: 'Users', roles: ['ROLE_ADMIN'] },
        { path: '/app/admin/categories', icon: this.TagsIcon, label: 'Categories', roles: ['ROLE_ADMIN'] },
        { path: '/app/home', icon: this.HomeIcon, label: 'Accueil' },
        { path: '/app/fields/add', icon: this.MapPinIcon, label: 'Ajouter un Terrain', roles: ['ROLE_FIELD_OWNER', 'ROLE_ADMIN'] },
        { path: '/app/team', icon: this.UsersIcon, label: 'Équipes' },
        { path: '/app/competitions', icon: this.TrophyIcon, label: 'Compétitions' },
        { path: '/app/matches', icon: this.SwordsIcon, label: 'Matchs' },
        { path: '/app/booking', icon: this.MapPinIcon, label: 'Réservation' },
        { path: '/app/fields', icon: this.MapIcon, label: 'Terrains', roles: ['ROLE_FIELD_OWNER', 'ROLE_ADMIN'] },
        { path: '/app/communities', icon: this.MessageSquareIcon, label: 'Communautés' },
        { path: '/app/performance', icon: this.ActivityIcon, label: 'Performance' },
        { path: '/app/healthcare', icon: this.HeartIcon, label: 'Santé' },
        { path: '/app/smart-matching', icon: this.SwordsIcon, label: 'Smart Match' },
        { path: '/app/sponsors', icon: this.GiftIcon, label: 'Sponsors (Boutique)' },
        { path: '/app/favorites', icon: this.HeartIcon, label: 'Mes Favoris' },
        { path: '/app/user-profile', icon: this.UserIcon, label: 'Mon Profil' },
        { path: '/app/notifications', icon: this.BellIcon, label: 'Notifications' },
    ];

    get filteredNavItems() {
        let currentRole = this.userType;
        if (currentRole === 'player') currentRole = 'ROLE_PLAYER';
        if (currentRole === 'manager' || currentRole === 'owner') currentRole = 'ROLE_FIELD_OWNER';
        if (currentRole === 'admin') currentRole = 'ROLE_ADMIN';

        return this.navItems.filter(item => {
            if (!item.roles) return true; // Accessible to everyone
            return item.roles.includes(currentRole);
        });
    }

    constructor(private router: Router, private authService: AuthService, private pendingChangesService: PendingChangesService) { }

    get roleLabel(): string {
        const r = this.userType;
        if (r === 'ROLE_ADMIN') return 'Administrateur';
        if (r === 'ROLE_FIELD_OWNER') return 'Gérant de terrain';
        return 'Joueur';
    }

    ngOnInit() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.router.navigate(['/auth/login']);
            return;
        }
        this.userName = localStorage.getItem('user_name') || 'Utilisateur';
        this.userEmail = localStorage.getItem('user_email') || '';
        this.userType = localStorage.getItem('user_type') || 'ROLE_PLAYER';
    }

    handleLogout() {
        // Notify all services/components that logout is happening - allows them to save pending changes
        this.pendingChangesService.notifyBeforeLogout();
        
        // Give a moment for auto-save to complete
        setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
        }, 100);
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    closeMobileMenu() {
        this.mobileMenuOpen = false;
    }

    getUserInitials(): string {
        return this.userName.substring(0, 2).toUpperCase();
    }

    get isOwner(): boolean {
        return this.userType === 'owner' || this.userType === 'manager' || this.userType === 'ROLE_FIELD_OWNER';
    }
}
