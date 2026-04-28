import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule, Tags, Plus, Pencil, Trash2, Loader2, RefreshCcw, X, CircleAlert } from 'lucide-angular';
import { Category, CategoryPayload, ProductService } from '../services/product.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-background p-4 md:p-6">
      <div class="max-w-6xl mx-auto">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 class="mb-2">Categories</h1>
            <p class="text-muted-foreground">Manage sports categories: add, edit, and delete.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="loadCategories()"
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
              <lucide-icon [name]="PlusIcon" [size]="16"></lucide-icon>
              Add Category
            </button>
          </div>
        </div>

        <div *ngIf="!isAdmin" class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Access denied. Admin role is required.
        </div>

        <div *ngIf="errorBanner" class="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <span>{{ errorBanner }}</span>
          <button (click)="loadCategories()" class="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 hover:bg-red-500/30">
            <lucide-icon [name]="RefreshCcwIcon" [size]="14"></lucide-icon>
            Retry
          </button>
        </div>

        <div *ngIf="loading" class="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <lucide-icon [name]="Loader2Icon" [size]="32" class="animate-spin"></lucide-icon>
          Loading categories...
        </div>

        <div *ngIf="!loading && categories.length === 0 && !errorBanner" class="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          <lucide-icon [name]="TagsIcon" [size]="40" class="mx-auto mb-3 opacity-50"></lucide-icon>
          <p class="mb-1 text-lg font-semibold">No categories found</p>
          <p>Create your first category to organize sports.</p>
        </div>

        <div *ngIf="!loading && categories.length > 0" class="grid gap-4 md:grid-cols-2">
          <div *ngFor="let category of categories" class="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg">
            <div class="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 class="font-bold text-foreground">{{ category.nom || category.name || 'Unnamed Category' }}</h3>
                <p class="text-xs text-muted-foreground">ID: {{ category.id || '-' }}</p>
              </div>

              <div *ngIf="isAdmin" class="flex gap-2">
                <button
                  (click)="openEditModal(category)"
                  [disabled]="isProcessing(category.id)"
                  class="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/25 disabled:opacity-60"
                >
                  <lucide-icon [name]="PencilIcon" [size]="13"></lucide-icon>
                  Edit
                </button>
                <button
                  (click)="deleteCategory(category)"
                  [disabled]="isProcessing(category.id)"
                  class="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-500/25 disabled:opacity-60"
                >
                  <lucide-icon [name]="Trash2Icon" [size]="13"></lucide-icon>
                  Delete
                </button>
              </div>
            </div>

            <p class="text-sm text-muted-foreground">{{ category.description || 'No description' }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-xl font-bold text-foreground">{{ editingCategoryId ? 'Edit Category' : 'Add Category' }}</h3>
            <button (click)="closeModal()" class="rounded-lg p-2 hover:bg-muted">
              <lucide-icon [name]="XIcon" [size]="20" class="text-muted-foreground"></lucide-icon>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium">Category Name *</label>
              <input
                [(ngModel)]="categoryForm.name"
                placeholder="Ex: Football"
                class="w-full rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Description</label>
              <textarea
                [(ngModel)]="categoryForm.description"
                rows="3"
                placeholder="Optional description"
                class="w-full resize-none rounded-xl border border-border bg-muted px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button (click)="closeModal()" class="rounded-xl bg-muted px-4 py-2 text-foreground hover:bg-muted/70">Cancel</button>
            <button
              (click)="submitCategory()"
              [disabled]="saving || !categoryForm.name.trim()"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <lucide-icon *ngIf="saving" [name]="Loader2Icon" [size]="16" class="animate-spin"></lucide-icon>
              {{ saving ? 'Saving...' : (editingCategoryId ? 'Update' : 'Create') }}
            </button>
          </div>
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
export class AdminCategoriesComponent implements OnInit {
  readonly TagsIcon = Tags;
  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly Loader2Icon = Loader2;
  readonly RefreshCcwIcon = RefreshCcw;
  readonly XIcon = X;
  readonly CircleAlertIcon = CircleAlert;

  categories: Category[] = [];
  loading = true;
  saving = false;
  showModal = false;
  editingCategoryId: number | null = null;
  processingIds = new Set<number>();

  toast: string | null = null;
  toastError: string | null = null;
  errorBanner: string | null = null;

  categoryForm = {
    name: '',
    description: ''
  };

  currentRole = (localStorage.getItem('user_type') || '').toUpperCase();

  constructor(private productService: ProductService, private cdr: ChangeDetectorRef) {}

  get isAdmin(): boolean {
    return this.currentRole === 'ROLE_ADMIN' || this.currentRole === 'ADMIN';
  }

  ngOnInit(): void {
    if (!this.isAdmin) {
      this.loading = false;
      return;
    }

    this.loadCategories();
  }

  loadCategories(): void {
    if (!this.isAdmin) {
      return;
    }

    this.loading = true;
    this.errorBanner = null;

    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
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

  isProcessing(categoryId?: number): boolean {
    if (!categoryId) return false;
    return this.processingIds.has(categoryId);
  }

  openCreateModal(): void {
    this.editingCategoryId = null;
    this.categoryForm = { name: '', description: '' };
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategoryId = category.id || null;
    this.categoryForm = {
      name: (category.nom || category.name || '').trim(),
      description: (category.description || '').trim()
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  submitCategory(): void {
    const trimmedName = this.categoryForm.name.trim();
    if (!trimmedName) {
      return;
    }

    this.saving = true;

    const payload: CategoryPayload = {
      nom: trimmedName,
      name: trimmedName,
      description: this.categoryForm.description.trim() || undefined
    };

    const request$ = this.editingCategoryId
      ? this.productService.updateCategory(this.editingCategoryId, payload)
      : this.productService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.showToast(this.editingCategoryId ? 'Category updated successfully.' : 'Category created successfully.');
        this.loadCategories();
      },
      error: (err) => {
        this.saving = false;
        this.showErrorToast(this.toReadableError(err));
        this.cdr.detectChanges();
      }
    });
  }

  deleteCategory(category: Category): void {
    const categoryId = category.id;
    if (!categoryId) return;

    const label = category.nom || category.name || `#${categoryId}`;
    const confirmed = window.confirm(`Delete category "${label}"?`);
    if (!confirmed) return;

    this.processingIds.add(categoryId);
    this.productService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.processingIds.delete(categoryId);
        this.showToast('Category deleted successfully.');
        this.loadCategories();
      },
      error: (err) => {
        this.processingIds.delete(categoryId);
        this.showErrorToast(this.toReadableError(err));
        this.cdr.detectChanges();
      }
    });
  }

  private toReadableError(error: unknown): string {
    const httpError = error as HttpErrorResponse;
    const rawServerError = httpError?.error;
    const serverMessage = (
      typeof rawServerError === 'string'
        ? rawServerError
        : rawServerError?.message || rawServerError?.error || httpError?.message || ''
    ).toString().trim();
    const lowerMessage = serverMessage.toLowerCase();

    if (httpError?.status === 401) return 'Session expired. Please login again.';
    if (httpError?.status === 403) return 'Access denied. Admin role is required.';
    if (httpError?.status === 400) {
      if (lowerMessage.includes('constraint') || lowerMessage.includes('foreign key') || lowerMessage.includes('used') || lowerMessage.includes('product')) {
        return 'Cannot delete this category because it is still linked to existing products.';
      }
      return serverMessage || 'Category deletion was rejected by backend rules.';
    }
    if (httpError?.status === 409) return 'This category already exists.';
    if (httpError?.status === 404) return 'Category not found.';
    if (httpError?.status === 0) return 'Cannot reach server. Check your connection.';

    return serverMessage || 'Unexpected error while managing categories.';
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
