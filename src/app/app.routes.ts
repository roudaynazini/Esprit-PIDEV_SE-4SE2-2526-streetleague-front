import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { teamChatGuard } from './core/guards/team-chat.guard';
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { ProfileResolver } from './core/guards/profile.resolver';

// Public pages
import { PublicHomePageComponent } from './pages/public/public-home-page.component';
import { AboutPageComponent } from './pages/public/about-page.component';
import { ContactPageComponent } from './pages/public/contact-page.component';
import { BrowsePageComponent } from './pages/public/browse-page.component';

// Auth pages
import { LoginPageComponent } from './pages/auth/login-page.component';
import { SignupPageComponent } from './pages/auth/signup-page.component';
import { PasswordResetPageComponent } from './pages/auth/password-reset-page.component';

// App pages
import { UserDashboardComponent } from './pages/user-dashboard.component';
import { HomeComponent } from './pages/home.component';
import { TeamComponent } from './pages/team.component';
import { TeamDetailComponent } from './pages/team-detail.component';
import { TeamChatComponent } from './pages/team-chat.component';
import { AdminTeamRequestsComponent } from './pages/admin-team-requests.component';
import { MatchesComponent } from './pages/matches.component';
import { MatchDetailComponent } from './pages/match-detail.component';
import { MatchFormComponent } from './pages/match-form.component';
import { BookingComponent } from './pages/booking.component';
import { BookingFormComponent } from './pages/booking-form.component';
import { PerformanceComponent } from './pages/performance.component';
import { SponsorsComponent } from './pages/sponsors.component';
import { ProductDetailComponent } from './pages/product-detail.component';
import { AdminComponent } from './pages/admin.component';
import { AdminProductsComponent } from './pages/admin-products.component';
import { AdminUsersComponent } from './pages/admin-users.component';
import { UserProfileComponent } from './pages/user-profile.component';
import { NotificationsComponent } from './pages/notifications.component';
import { FavoritesComponent } from './pages/favorites.component';

// Competition pages
import { CompetitionListComponent } from './pages/competitions/competition-list.component';
import { CompetitionDetailComponent } from './pages/competitions/competition-detail.component';
import { CompetitionFormComponent } from './pages/competitions/competition-form.component';

// Fields pages
import { FieldsListComponent } from './pages/fields/fields-list.component';
import { AddFieldComponent } from './pages/fields/add-field.component';
import { FieldDetailComponent } from './pages/fields/field-detail.component';

// Healthcare pages
import { HealthDashboardComponent } from './pages/healthcare/health-dashboard.component';
import { HealthProfileComponent } from './pages/healthcare/health-profile.component';
import { MedicalRecordsComponent } from './pages/healthcare/medical-records.component';
import { AppointmentsComponent } from './pages/healthcare/appointments.component';
import { DietPlansComponent } from './pages/healthcare/diet-plans.component';
import { HealthTrendsComponent } from './pages/healthcare/health-trends.component';
import { HealthAlertsComponent } from './pages/healthcare/health-alerts.component';
import { ComplianceTrackingComponent } from './pages/healthcare/compliance-tracking.component';

// Badge pages
import { BadgeDashboardComponent } from './pages/badges/badge-dashboard.component';
import { BadgeCatalogComponent } from './pages/badges/badge-catalog.component';
import { BadgeDetailComponent } from './pages/badges/badge-detail.component';
import { BadgeFormComponent } from './pages/badges/badge-form.component';

// Performance pages
import { PerformanceDashboardComponent } from './pages/performances/performance-dashboard.component';
import { PerformanceListComponent } from './pages/performances/performance-list.component';
import { PerformanceDetailComponent } from './pages/performances/performance-detail.component';
import { PerformanceFormComponent } from './pages/performances/performance-form.component';

// 404
import { NotFoundComponent } from './pages/not-found.component';

export const routes: Routes = [
    // Public Routes (no authentication required)
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: '', component: PublicHomePageComponent },
            { path: 'about', component: AboutPageComponent },
            { path: 'contact', component: ContactPageComponent },
            { path: 'browse', component: BrowsePageComponent },
        ],
    },

    // Auth Routes (standalone, no layout)
    { path: 'auth/login', component: LoginPageComponent },
    { path: 'auth/signup', component: SignupPageComponent },
    { path: 'auth/password-reset', component: PasswordResetPageComponent },

    // Authenticated Routes (requires login)
    {
        path: 'app',
        component: AppLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: UserDashboardComponent },
            { path: 'home', component: HomeComponent },
            { path: 'team', component: TeamComponent },
            { path: 'team/:id', component: TeamDetailComponent },
            { path: 'team/:id/chat', component: TeamChatComponent, canActivate: [teamChatGuard] },
            { path: 'admin/team-requests', component: AdminTeamRequestsComponent },
            { path: 'matches', component: MatchesComponent },
            { path: 'matches/new', component: MatchFormComponent },
            { path: 'matches/:id', component: MatchDetailComponent },
            { path: 'booking', component: BookingComponent },
            { path: 'booking-form/:id', component: BookingFormComponent },
            { path: 'community', redirectTo: 'communities', pathMatch: 'full' },
            {
                path: 'communities',
                loadComponent: () => import('./pages/communities.component').then((m) => m.CommunitiesComponent)
            },
            {
                path: 'communities/:id',
                loadComponent: () => import('./pages/communities.component').then((m) => m.CommunitiesComponent)
            },
            { path: 'performance', component: PerformanceComponent },
            { path: 'sponsors', component: SponsorsComponent },
            { path: 'sponsors/:id', component: ProductDetailComponent },
            { path: 'admin', component: AdminComponent },
            { path: 'admin/users', component: AdminUsersComponent },
            { path: 'admin/products', component: AdminProductsComponent },
            {
                path: 'admin/categories',
                loadComponent: () => import('./pages/admin-categories.component').then((m) => m.AdminCategoriesComponent)
            },
            
            // Admin - Badge Management (specific routes before parameter-based routes)
            { path: 'admin/badges/dashboard', component: BadgeDashboardComponent },
            { path: 'admin/badges/create', component: BadgeFormComponent },
            { path: 'admin/badges/:id/edit', component: BadgeFormComponent },
            { path: 'admin/badges/:id', component: BadgeDetailComponent },
            { path: 'admin/badges', component: BadgeCatalogComponent },

            // Admin - Performance Management (specific routes before parameter-based routes)
            { path: 'admin/performances/dashboard', component: PerformanceDashboardComponent },
            { path: 'admin/performances/create', component: PerformanceFormComponent },
            { path: 'admin/performances/:id/edit', component: PerformanceFormComponent },
            { path: 'admin/performances/:id', component: PerformanceDetailComponent },
            { path: 'admin/performances', component: PerformanceListComponent },
            
            { 
                path: 'smart-matching', 
                loadComponent: () => import('./pages/smart-matching.component').then(m => m.SmartMatchingComponent) 
            },
            
            { path: 'user-profile', component: UserProfileComponent, resolve: { profile: ProfileResolver }, canDeactivate: [UnsavedChangesGuard] },
            { path: 'notifications', component: NotificationsComponent },
            { path: 'favorites', component: FavoritesComponent },

            // Competitions Module
            { path: 'competitions', component: CompetitionListComponent },
            { path: 'competitions/new', component: CompetitionFormComponent },
            { path: 'competitions/:id', component: CompetitionDetailComponent },
            { path: 'competitions/:id/edit', component: CompetitionFormComponent },

            // Fields Module
            { path: 'fields', component: FieldsListComponent },
            { path: 'fields/add', component: AddFieldComponent },
            { path: 'fields/:id', component: FieldDetailComponent },

            // Healthcare Module
            { path: 'healthcare', component: HealthDashboardComponent },
            { path: 'healthcare/profile', component: HealthProfileComponent },
            { path: 'healthcare/records', component: MedicalRecordsComponent },
            { path: 'healthcare/appointments', component: AppointmentsComponent },
            { path: 'healthcare/diet', component: DietPlansComponent },
            { path: 'healthcare/trends', component: HealthTrendsComponent },
            { path: 'healthcare/alerts', component: HealthAlertsComponent },
            { path: 'healthcare/compliance', component: ComplianceTrackingComponent },
        ],
    },

    // 404 Not Found
    { path: '**', component: NotFoundComponent }
];
