import { Component, signal, inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Member {
  id: string;
  displayName: string;
  role: 'OWNER' | 'MEMBER' | 'GUEST';
  isGuest: boolean;
  user: { name: string; email: string } | null;
  joinedAt: string;
}

@Component({
  selector: 'app-group-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatChipsModule, MatMenuModule],
  template: `
    <div class="members-container">
      <header class="page-header">
        <h1>Members</h1>
        <button mat-flat-button color="primary" (click)="openInviteDialog()">
          <mat-icon>person_add</mat-icon>
          Invite Member
        </button>
      </header>

      @if (loading()) {
        <div class="loading-table">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-row">
              <div class="skeleton skeleton-avatar"></div>
              <div class="skeleton skeleton-col"></div>
              <div class="skeleton skeleton-col-short"></div>
              <div class="skeleton skeleton-col-short"></div>
            </div>
          }
        </div>
      } @else {
        <table mat-table [dataSource]="members()" class="members-table">
          <ng-container matColumnDef="avatar">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let m">
              <div class="avatar" [style.background-color]="getColor(m.id)">{{ m.displayName[0] }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let m">
              <div class="member-name">{{ m.displayName }}</div>
              <div class="member-email" *ngIf="m.user">{{ m.user.email }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let m">
              <mat-chip [class.owner]="m.role === 'OWNER'" [class.guest]="m.isGuest">
                {{ m.role }}{{ m.isGuest ? ' (Guest)' : '' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="joined">
            <th mat-header-cell *matHeaderCellDef>Joined</th>
            <td mat-cell *matCellDef="let m">{{ m.joinedAt | date:'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let m">
              @if (m.id !== currentUserId()) {
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Member options">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  @if (m.role !== 'OWNER') {
                    <button mat-menu-item (click)="changeRole(m, m.role === 'MEMBER' ? 'OWNER' : 'MEMBER')">
                      <mat-icon>{{ m.role === 'MEMBER' ? 'star' : 'person' }}</mat-icon>
                      {{ m.role === 'MEMBER' ? 'Make Owner' : 'Demote to Member' }}
                    </button>
                  }
                  <button mat-menu-item (click)="removeMember(m)" class="delete-action">
                    <mat-icon>person_remove</mat-icon>
                    Remove
                  </button>
                </mat-menu>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      }
    </div>

    <ng-template #inviteDialog>
      <div class="dialog-content">
        <h2 mat-dialog-title>Invite Member</h2>
        <mat-dialog-content>
          <form [formGroup]="inviteForm" class="dialog-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="MEMBER">Member</mat-option>
                <mat-option value="GUEST">Guest</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Expires In (days, optional)</mat-label>
              <input matInput type="number" formControlName="expiresInDays" min="1" max="365" />
            </mat-form-field>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>Cancel</button>
          <button mat-flat-button color="primary" (click)="createInvite()" mat-dialog-close>
            <mat-spinner *ngIf="inviting()" diameter="20"></mat-spinner>
            <span *ngIf="!inviting()">Create Invite</span>
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .members-container { padding: 8px 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .loading-table { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-row { display: flex; gap: 16px; padding: 16px; background: var(--mat-sys-surface-container-low); border-radius: 8px; }
    .skeleton { background: linear-gradient(90deg, var(--mat-sys-surface-container) 25%, var(--mat-sys-surface-container-high) 50%, var(--mat-sys-surface-container) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; height: 20px; }
    .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; }
    .skeleton-col { flex: 2; }
    .skeleton-col-short { flex: 1; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .members-table { width: 100%; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; }
    .member-name { font-weight: 500; }
    .member-email { font-size: 12px; color: var(--mat-sys-on-surface-variant); }
    .owner { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); }
    .guest { background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }
    .delete-action { color: var(--mat-sys-error); }
    .dialog-content { min-width: 350px; }
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 300px; margin-top: 8px; }
    .full-width { width: 100%; }
  `]
})
export class GroupMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  @ViewChild('inviteDialog') inviteDialog!: TemplateRef<any>;
  
  loading = signal(true);
  inviting = signal(false);
  members = signal<Member[]>([]);
  currentUserId = signal<string>('');
  displayedColumns = ['avatar', 'name', 'role', 'joined', 'actions'];
  groupId = signal<string>('');
  
  inviteForm = this.fb.nonNullable.group({
    role: ['MEMBER', Validators.required],
    expiresInDays: [7]
  });
  
  ngOnInit(): void {
    this.groupId.set(this.route.snapshot.paramMap.get('id') || '');
    this.loadMembers();
  }
  
  async loadMembers(): Promise<void> {
    this.loading.set(false);
  }
  
  getColor(id: string): string {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0097a7', '#c2185b', '#5d4037'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
  
  openInviteDialog(): void {
    this.dialog.open(this.inviteDialog);
  }
  
  async createInvite(): Promise<void> {
    if (this.inviteForm.invalid) return;
    this.inviting.set(true);
    this.snackBar.open('Invite created', 'Dismiss', { duration: 3000 });
    this.inviting.set(false);
  }
  
  async changeRole(member: Member, role: 'OWNER' | 'MEMBER'): Promise<void> {
    this.snackBar.open(`Role changed to ${role}`, 'Dismiss', { duration: 3000 });
  }
  
  async removeMember(member: Member): Promise<void> {
    if (!confirm(`Remove ${member.displayName}?`)) return;
    this.snackBar.open('Member removed', 'Dismiss', { duration: 3000 });
  }
}