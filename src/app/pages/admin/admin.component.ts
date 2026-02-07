import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { AdminService } from '../../services/admin.service';
import {
  AdminActionType,
  AdminActionResponse,
  AdminActionListResponse,
  ADMIN_ACTION_LABELS,
  ADMIN_ACTION_DESCRIPTIONS,
  ACTION_REQUIRES_DURATION,
  ACTION_SUPPORTS_PERMANENT,
} from '../../models/admin.model';
import { formatTimeAgo } from '../../utils/common.utils';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  actionForm: FormGroup;
  selectedAction = signal<AdminActionType>('BAN_USER');

  actionTypes: AdminActionType[] = [
    'BAN_USER',
    'SUSPEND_USER',
    'DELETE_POST',
    'DELETE_COMMENT',
    'LOCK_POST',
    'LOCK_COMMENT',
    'REMOVE_MODERATOR',
    'ADD_MODERATOR',
    'BAN_SUBREDDIT',
    'QUARANTINE_POST',
    'QUARANTINE_COMMENT',
  ];

  actionLabels = ADMIN_ACTION_LABELS;
  actionDescriptions = ADMIN_ACTION_DESCRIPTIONS;
  actionRequiresDuration = ACTION_REQUIRES_DURATION;
  actionSupportsPermanent = ACTION_SUPPORTS_PERMANENT;

  auditLog = signal<AdminActionListResponse | null>(null);
  displayedColumns: string[] = ['actionId', 'action', 'targetType', 'targetId', 'reason', 'performedAt', 'isActive'];

  loading = signal<boolean>(false);
  recentActions = signal<AdminActionResponse[]>([]);

  constructor() {
    this.actionForm = this.createActionForm();
  }

  ngOnInit(): void {
    this.loadAuditLog();

    this.actionForm.get('action')?.valueChanges.subscribe((action: AdminActionType) => {
      this.selectedAction.set(action);
      this.updateFormValidators(action);
    });
  }

  private createActionForm(): FormGroup {
    return this.fb.group({
      action: ['BAN_USER', Validators.required],
      targetId: [null, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.maxLength(1000)]],
      notes: ['', Validators.maxLength(1000)],
      durationDays: [null],
      permanent: [false],
      notifyUser: [true],
    });
  }

  private updateFormValidators(action: AdminActionType): void {
    const durationControl = this.actionForm.get('durationDays');
    const permanentControl = this.actionForm.get('permanent');

    durationControl?.clearValidators();
    permanentControl?.setValue(false);

    if (ACTION_REQUIRES_DURATION.includes(action)) {
      durationControl?.setValidators([Validators.min(1), Validators.max(365)]);
    }

    durationControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.actionForm.invalid) {
      this.markFormGroupTouched(this.actionForm);
      return;
    }

    const formValue = this.actionForm.value;
    this.loading.set(true);

    const request = {
      action: formValue.action,
      targetId: formValue.targetId,
      reason: formValue.reason,
      notes: formValue.notes,
      durationDays: formValue.durationDays,
      permanent: formValue.permanent,
      notifyUser: formValue.notifyUser,
    };

    this.adminService.performAction(request).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.recentActions.update((actions) => [response, ...actions].slice(0, 10));
        this.snackBar.open(`Action performed: ${response.result}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.actionForm.patchValue({
          targetId: null,
          reason: '',
          notes: '',
          durationDays: null,
          permanent: false,
        });
        this.loadAuditLog();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to perform action. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  loadAuditLog(page: number = 0): void {
    this.adminService.getActions(page).subscribe({
      next: (response) => {
        this.auditLog.set(response);
      },
      error: (error) => {
        console.error('Failed to load audit log:', error);
      },
    });
  }

  onPageChange(event: any): void {
    this.loadAuditLog(event.pageIndex);
  }

  getActionLabel(action: AdminActionType): string {
    return this.actionLabels[action] || action;
  }

  getActionDescription(action: AdminActionType): string {
    return this.actionDescriptions[action] || '';
  }

  formatTimeAgo = formatTimeAgo;

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
    });
  }
}
