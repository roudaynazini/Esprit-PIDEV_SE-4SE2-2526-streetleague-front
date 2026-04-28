import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule, Users, UserPlus, Loader2, RefreshCcw, Shield, UserX, X, CircleAlert } from 'lucide-angular';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

type UserRole = 'ROLE_PLAYER' | 'ROLE_FIELD_OWNER' | 'ROLE_ADMIN';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="max-w-6xl mx-auto">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 class="mb-2">Users</h1>
            <p class="text-muted-foreground">Manage users, roles, and account activation.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="loadUsers()"
              class="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 hover:bg-muted/70"
            >
              <lucide-icon [name]="RefreshCcwIcon" [size]="16"></lucide-icon>
              Refresh
            </button>
            <button
              *ngIf="isAdmin"
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              <lucide-icon [name]="UserPlusIcon" [size]="16"></lucide-icon>
              Add User
            </button>
          </div>
        </div>

        <div *ngIf="!isAdmin" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Access denied. Admin role is required.
        </div>

        <div *ngIf="errorBanner" class="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <span>{{ errorBanner }}</span>
          <button (click)="loadUsers()" class="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 hover:bg-red-500/30">
            <lucide-icon [name]="RefreshCcwIcon" [size]="14"></lucide-icon>
            Retry
          </button>
        </div>

        <div *ngIf="loading" class="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
          Loading users...
        </div>

        <div *ngIf="!loading && users.length === 0 && !errorBanner" class="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          <lucide-icon [name]="UsersIcon" [size]="40" class="mx-auto mb-3 opacity-50"></lucide-icon>
          <p class="mb-1 text-lg font-semibold">No users found</p>
          <p>Add your first user account.</p>
        </div>

        <div *ngIf="!loading && users.length > 0" class="overflow-x-auto rounded-2xl border border-border bg-card">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/40">
                <th class="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th class="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th class="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                <th class="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th class="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users" class="border-b border-border/70 hover:bg-muted/20">
                <td class="px-4 py-3 font-medium">
                  {{ user.firstName || '' }} {{ user.lastName || '' }}
                </td>
                <td class="px-4 py-3 text-muted-foreground">{{ user.email || '-' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        [ngClass]="roleClass(user.role)">
                    <lucide-icon [name]="ShieldIcon" [size]="12"></lucide-icon>
                    {{ toRoleLabel(user.role) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                        [ngClass]="isUserActive(user) ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'">
                    {{ isUserActive(user) ? 'Active' : 'Disabled' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    (click)="deactivateUser(user)"
                    [disabled]="isProcessing(user.id) || !isUserActive(user)"
                    class="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <lucide-icon [name]="UserXIcon" [size]="13"></lucide-icon>
                    Disable
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-xl font-bold text-foreground">Add User</h3>
            <button (click)="closeModal()" class="rounded-lg p-2 hover:bg-muted">
              <lucide-icon [name]="XIcon" [size]="20" class="text-muted-foreground"></lucide-icon>
            </button>
          </div>

          <form class="space-y-4" (ngSubmit)="createUser()">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium">First Name *</label>
                <input
                  [(ngModel)]="form.firstName"
                  name="firstName"
                  required
                  class="w-full rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium">Last Name *</label>
                <input
                  [(ngModel)]="form.lastName"
                  name="lastName"
                  required
                  class="w-full rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Email *</label>
              <input
                [(ngModel)]="form.email"
                name="email"
                type="email"
                required
                class="w-full rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Password *</label>
              <input
                [(ngModel)]="form.password"
                name="password"
                type="password"
                minlength="8"
                required
                class="w-full rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="mt-1 text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Role *</label>
              <select
                [(ngModel)]="form.role"
                name="role"
                class="w-full rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ROLE_PLAYER">Player</option>
                <option value="ROLE_FIELD_OWNER">Field Owner</option>
                <option value="ROLE_ADMIN">Admin</option>
              </select>
            </div>

            <div *ngIf="modalError" class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {{ modalError }}
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button" (click)="closeModal()" class="rounded-xl bg-muted px-4 py-2 text-foreground hover:bg-muted/70">Cancel</button>
              <button
                type="submit"
                [disabled]="saving || !isFormValid"
                class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <lucide-icon *ngIf="saving" [name]="Loader2Icon" [size]="16" class="animate-spin"></lucide-icon>
                {{ saving ? 'Saving...' : 'Create User' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div *ngIf="toast" class="fixed bottom-6 right-6 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-xl">
        {{ toast }}
      </div>

      <div *ngIf="toastError" class="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300 shadow-xl">
        <lucide-icon [name]="CircleAlertIcon" [size]="16"></lucide-icon>
        {{ toastError }}
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  readonly UsersIcon = Users;
  readonly UserPlusIcon = UserPlus;
  readonly Loader2Icon = Loader2;
  readonly RefreshCcwIcon = RefreshCcw;
  readonly ShieldIcon = Shield;
  readonly UserXIcon = UserX;
  readonly XIcon = X;
  readonly CircleAlertIcon = CircleAlert;

  users: any[] = [];
  loading = true;
  saving = false;
  showModal = false;
  processingIds = new Set<number>();

  toast: string | null = null;
  toastError: string | null = null;
  errorBanner: string | null = null;
  modalError: string | null = null;

  form: { firstName: string; lastName: string; email: string; password: string; role: UserRole } = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'ROLE_PLAYER'
  };

  private currentRole = (localStorage.getItem('user_type') || '').toUpperCase();

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get isAdmin(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ADMIN';
  }

  get isFormValid(): boolean {
    return (
      this.form.firstName.trim().length > 0 &&
      this.form.lastName.trim().length > 0 &&
      this.form.email.trim().length > 0 &&
      this.form.password.trim().length >= 8
    );
  }

  ngOnInit(): void {
    if (!this.isAdmin) {
      this.loading = false;
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    if (!this.isAdmin) {
      return;
    }

    this.loading = true;
    this.errorBanner = null;

    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorBanner = this.toReadableError(err);
        this.showErrorToast(this.errorBanner);
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal(): void {
    this.modalError = null;
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'ROLE_PLAYER'
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
    this.modalError = null;
  }

  createUser(): void {
    if (!this.isFormValid) {
      return;
    }

    this.saving = true;
    this.modalError = null;

    const payload = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      role: this.form.role
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.showToast('User created successfully.');
        this.loadUsers();
      },
      error: (err) => {
        this.saving = false;
        this.modalError = this.toReadableError(err);
        this.cdr.detectChanges();
      }
    });
  }

  deactivateUser(user: any): void {
    const userId = Number(user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return;
    }

    const label = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || `#${userId}`;
    const confirmed = window.confirm(`Disable user "${label}"?`);
    if (!confirmed) {
      return;
    }

    this.processingIds.add(userId);
    this.userService.deactivate(userId).subscribe({
      next: () => {
        this.processingIds.delete(userId);
        this.showToast('User disabled successfully.');
        this.loadUsers();
      },
      error: (err) => {
        this.processingIds.delete(userId);
        this.showErrorToast(this.toReadableError(err));
        this.cdr.detectChanges();
      }
    });
  }

  isProcessing(userId: number | undefined): boolean {
    if (!userId) {
      return false;
    }
    return this.processingIds.has(userId);
  }

  isUserActive(user: any): boolean {
    if (typeof user?.active === 'boolean') {
      return user.active;
    }

    if (typeof user?.enabled === 'boolean') {
      return user.enabled;
    }

    if (typeof user?.disabled === 'boolean') {
      return !user.disabled;
    }

    return true;
  }

  toRoleLabel(role: string | null | undefined): string {
    const normalized = (role || '').toUpperCase();
    if (normalized === 'ROLE_ADMIN' || normalized === 'ADMIN') {
      return 'Admin';
    }

    if (normalized === 'ROLE_FIELD_OWNER' || normalized === 'ROLE_MANAGER' || normalized === 'MANAGER') {
      return 'Field Owner';
    }

    return 'Player';
  }

  roleClass(role: string | null | undefined): string {
    const normalized = (role || '').toUpperCase();
    if (normalized === 'ROLE_ADMIN' || normalized === 'ADMIN') {
      return 'bg-violet-500/15 text-violet-700';
    }

    if (normalized === 'ROLE_FIELD_OWNER' || normalized === 'ROLE_MANAGER' || normalized === 'MANAGER') {
      return 'bg-amber-500/15 text-amber-700';
    }

    return 'bg-primary/10 text-primary';
  }

  private toReadableError(error: unknown): string {
    const httpError = error as HttpErrorResponse;
    const rawServerError = httpError?.error;
    const serverMessage = (
      typeof rawServerError === 'string'
        ? rawServerError
        : rawServerError?.message || rawServerError?.error || httpError?.message || ''
    ).toString().trim();

    if (httpError?.status === 401) {
      return 'Session expired. Please login again.';
    }

    if (httpError?.status === 403) {
      return 'Access denied. Admin role is required.';
    }

    if (httpError?.status === 409) {
      return 'A user with this email already exists.';
    }

    if (httpError?.status === 400) {
      return serverMessage || 'Invalid data. Please check required fields.';
    }

    if (httpError?.status === 0) {
      return 'Cannot reach server. Check your connection.';
    }

    return serverMessage || 'Unexpected error while managing users.';
  }

  private showToast(message: string): void {
    this.toast = message;
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 2800);
  }

  private showErrorToast(message: string): void {
    this.toastError = message;
    setTimeout(() => {
      this.toastError = null;
      this.cdr.detectChanges();
    }, 3200);
  }
}
