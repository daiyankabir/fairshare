import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  splitEqual,
  splitByPercent,
  splitByShares,
  splitExact,
  splitItemized,
  validateSplitsEqualTotal,
  toMinorUnits,
  fromMinorUnits,
  getCurrencyDecimals,
  type ExpenseSplit,
  type ExpenseItem,
  type ExpensePayer,
  type SplitType,
} from '@fairshare/shared';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
const SPLIT_TYPES: SplitType[] = ['equal', 'percentage', 'shares', 'exact', 'itemized'];

interface Member {
  id: string;
  displayName: string;
  userId: string | null;
}

interface MemberSplitForm {
  memberId: string;
  displayName: string;
  percentage?: number;
  shares?: number;
  exactAmount?: number;
}

interface ItemForm {
  id: string;
  description: string;
  amount: number;
  currency: string;
  assignedTo: string[];
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <div class="form-page">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ isEditing() ? 'Edit expense' : 'Add expense' }}</mat-card-title>
          <mat-card-subtitle>{{ isEditing() ? 'Update expense details' : 'Create a new expense to split' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
            <!-- Basic Fields -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" autocomplete="off" maxlength="200" />
              <mat-icon matPrefix>description</mat-icon>
              @if (form.get('description')?.hasError('required') && form.get('description')?.touched) {
                <mat-error>Description is required</mat-error>
              }
              @if (form.get('description')?.hasError('maxlength') && form.get('description')?.touched) {
                <mat-error>Maximum 200 characters</mat-error>
              }
            </mat-form-field>

            <div class="row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Amount</mat-label>
                <input matInput type="number" formControlName="amount" step="0.01" min="0.01" />
                <mat-icon matPrefix>attach_money</mat-icon>
                @if (form.get('amount')?.hasError('required') && form.get('amount')?.touched) {
                  <mat-error>Amount is required</mat-error>
                }
                @if (form.get('amount')?.hasError('min') && form.get('amount')?.touched) {
                  <mat-error>Must be greater than 0</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency">
                  @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
                </mat-select>
                <mat-icon matPrefix>currency_exchange</mat-icon>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" />
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              @if (form.get('date')?.hasError('required') && form.get('date')?.touched) {
                <mat-error>Date is required</mat-error>
              }
            </mat-form-field>

            <!-- Split Type Selection -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Split type</mat-label>
              <mat-select formControlName="splitType" (selectionChange)="onSplitTypeChange($event.value)">
                @for (type of splitTypes; track type) {
                  <mat-option [value]="type">{{ splitTypeLabels[type] }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>call_split</mat-icon>
              <mat-hint>{{ splitTypeHints[splitType()] }}</mat-hint>
            </mat-form-field>

            <mat-divider class="section-divider"></mat-divider>

            <!-- Dynamic Split Configuration -->
            <div *ngIf="splitType() === 'equal'" class="split-section">
              <h3>Equal split</h3>
              <p class="section-hint">Amount will be divided equally among all {{ members().length }} participants</p>
              <div class="preview">
                <mat-icon>info</mat-icon>
                <span>Each person pays {{ (previewAmount() / members().length / (getCurrencyDecimals(currency()) ? 100 : 1)) | number:'1.2-2' }} {{ currency() }}</span>
              </div>
            </div>

            <div *ngIf="splitType() === 'percentage'" class="split-section">
              <h3>Percentage split</h3>
              <p class="section-hint">Assign percentage to each participant (must total 100%)</p>

              <div *ngFor="let member of members(); trackBy: trackByMemberId">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ member.displayName }}</mat-label>
                  <input matInput type="number" [formControl]="getPercentageControl(member.id)" min="0" max="100" step="0.01" />
                  <span matSuffix>%</span>
                </mat-form-field>
              </div>

              <div class="validation-summary" [class.error]="totalPercent() !== 100">
                <mat-icon>{{ totalPercent() === 100 ? 'check_circle' : 'error' }}</mat-icon>
                <span>Total: {{ totalPercent() }}%</span>
              </div>
            </div>

            <div *ngIf="splitType() === 'shares'" class="split-section">
              <h3>Shares split</h3>
              <p class="section-hint">Assign shares to each participant (e.g., 2 shares = 2× portion)</p>

              <div *ngFor="let member of members(); trackBy: trackByMemberId">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ member.displayName }}</mat-label>
                  <input matInput type="number" [formControl]="getSharesControl(member.id)" min="1" step="1" />
                  <span matSuffix>shares</span>
                </mat-form-field>
              </div>

              <div class="preview">
                <mat-icon>info</mat-icon>
                <span>Total shares: {{ totalShares() }}. Each share = {{ (previewAmount() / totalShares() / (getCurrencyDecimals(currency()) ? 100 : 1)) | number:'1.2-2' }} {{ currency() }}</span>
              </div>
            </div>

            <div *ngIf="splitType() === 'exact'" class="split-section">
              <h3>Exact amounts</h3>
              <p class="section-hint">Enter exact amount each participant owes (must total the expense amount)</p>

              <div *ngFor="let member of members(); trackBy: trackByMemberId">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ member.displayName }}</mat-label>
                  <input matInput type="number" [formControl]="getExactControl(member.id)" min="0" step="0.01" />
                  <span matPrefix>{{ currency() }}&nbsp;</span>
                </mat-form-field>
              </div>

              <div class="validation-summary" [class.error]="totalExactAmount() !== previewAmount()">
                <mat-icon>{{ totalExactAmount() === previewAmount() ? 'check_circle' : 'error' }}</mat-icon>
                <span>Total: {{ fromMinorUnits(totalExactAmount(), currency()) | number:'1.2-2' }} / {{ fromMinorUnits(previewAmount(), currency()) | number:'1.2-2' }} {{ currency() }}</span>
              </div>
            </div>

            <div *ngIf="splitType() === 'itemized'" class="split-section">
              <div class="section-header">
                <h3>Itemized split</h3>
                <button mat-icon-button (click)="addItem()" matTooltip="Add item">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <p class="section-hint">Add individual items and assign them to participants</p>

              <div *ngFor="let item of itemsForm.controls; let i = index; trackBy: trackByIndex" class="item-row" [formGroup]="item">
                <mat-divider></mat-divider>
                <div class="item-header">
                  <h4>Item {{ i + 1 }}</h4>
                  <button mat-icon-button (click)="removeItem(i)" color="warn" matTooltip="Remove item">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Item description</mat-label>
                  <input matInput formControlName="description" />
                  @if (item.get('description')?.hasError('required') && item.get('description')?.touched) {
                    <mat-error>Description is required</mat-error>
                  }
                </mat-form-field>

                <div class="row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Amount</mat-label>
                    <input matInput type="number" formControlName="amount" min="0.01" step="0.01" />
                    @if (item.get('amount')?.hasError('required') && item.get('amount')?.touched) { <mat-error>Required</mat-error> }
                    @if (item.get('amount')?.hasError('min') && item.get('amount')?.touched) { <mat-error>Must be > 0</mat-error> }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Currency</mat-label>
                    <mat-select formControlName="currency">
                      @for (c of currencies; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="section">
                  <h4>Assigned to</h4>
                  <div class="payer-chips">
                    <div *ngFor="let member of members(); trackBy: trackByMemberId">
                      <mat-chip
                        [selected]="isItemAssigned(item, member.id)"
                        (click)="toggleItemAssignment(item, member.id)"
                        [removable]="isItemAssigned(item, member.id)"
                        (removed)="toggleItemAssignment(item, member.id)">
                        {{ member.displayName }}
                        <mat-icon *ngIf="isItemAssigned(item, member.id)" matChipRemove>cancel</mat-icon>
                      </mat-chip>
                    </div>
                  </div>
                  <input type="hidden" formControlName="assignedTo" [value]="getAssignedToValue(item)" />
                </div>
              </div>

              <div class="validation-summary" [class.error]="itemsTotal() > previewAmount()">
                <mat-icon>{{ itemsTotal() <= previewAmount() ? 'check_circle' : 'error' }}</mat-icon>
                <span>
                  Items total: {{ itemsTotal() | number:'1.2-2' }} / {{ fromMinorUnits(previewAmount(), currency()) | number:'1.2-2' }} {{ currency() }}
                  <span *ngIf="itemsTotal() < previewAmount()"> ({{ fromMinorUnits(previewAmount() - itemsTotal(), currency()) | number:'1.2-2' }} remaining)</span>
                </span>
              </div>

              <button mat-stroked-button (click)="addItem()">
                <mat-icon>add</mat-icon>
                Add item
              </button>
            </div>

            <div *ngIf="!isSplitTypeSelected()" class="placeholder">Select a split type</div>

            <mat-divider class="section-divider"></mat-divider>

            <!-- Payer Selection -->
            <div class="section">
              <h3>Who paid?</h3>
              <p class="section-hint">Select who paid for this expense (can be multiple people)</p>
              <div class="payer-chips">
                <div *ngFor="let member of members(); trackBy: trackByMemberId">
                  <mat-chip-set>
                    <mat-chip
                      [selected]="payerControl.value.includes(member.id)"
                      (click)="togglePayer(member.id)"
                      [removable]="payerControl.value.includes(member.id)"
                      (removed)="togglePayer(member.id)">
                      {{ member.displayName }}
                      <mat-icon *ngIf="payerControl.value.includes(member.id)" matChipRemove>cancel</mat-icon>
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>
              <input type="hidden" formControlName="payerIds" [value]="getPayerIdsString()" />
            </div>

            <mat-divider></mat-divider>

            <!-- Optional Fields -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Category (optional)</mat-label>
              <input matInput formControlName="category" autocomplete="off" />
              <mat-icon matPrefix>category</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
              <mat-icon matPrefix>note</mat-icon>
            </mat-form-field>

            <!-- Validation Preview -->
            <div *ngIf="splitValidationMessage() as msg" class="validation-message" [class.error]="!isValidSplit()" [class.success]="isValidSplit()">
              <mat-icon>{{ isValidSplit() ? 'check_circle' : 'error' }}</mat-icon>
              <span>{{ msg }}</span>
            </div>

            <div class="form-actions">
              <button mat-button type="button" routerLink="../">Cancel</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || submitting() || !isValidSplit()">
                @if (submitting()) { <mat-spinner diameter="20"></mat-spinner> } @else { {{ isEditing() ? 'Save changes' : 'Create expense' }} }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-page {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 100vh;
      padding: var(--space-8) var(--space-4);
    }

    .form-card {
      width: 100%;
      max-width: 720px;
      box-shadow: none;
      border: 1px solid var(--border-hairline);
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      margin-top: var(--space-2);
    }

    .full-width { width: 100%; }

    .row { display: flex; gap: var(--space-4); }
    .half-width { flex: 1; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-hairline);
    }

    .section-divider { margin: var(--space-4) 0; }

    .section { display: flex; flex-direction: column; gap: var(--space-3); }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .section-header h3 { margin: 0; font-size: 15px; font-weight: 500; }

    .section-hint {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 var(--space-3);
      line-height: 1.5;
    }

    .payer-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }

    .placeholder { padding: var(--space-8); text-align: center; color: var(--text-muted); }

    .validation-message {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3); border-radius: var(--radius-md);
      font-size: 13px;
    }
    .validation-message.error { background: var(--error); color: var(--text-inverse); }
    .validation-message.success { background: var(--success); color: var(--text-inverse); }

    .split-section { display: flex; flex-direction: column; gap: var(--space-3); }
    .split-section h3 { margin: 0 0 var(--space-1); font-size: 15px; font-weight: 500; }

    .preview {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3); border-radius: var(--radius-md);
      background: var(--accent-container); color: var(--accent-on-container);
      font-size: 13px;
    }

    .validation-summary {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3); border-radius: var(--radius-md);
      font-weight: 500; font-size: 13px;
    }
    .validation-summary.error { background: var(--error); color: var(--text-inverse); }
    .validation-summary:not(.error) { background: var(--success); color: var(--text-inverse); }

    .item-row { padding: var(--space-4) 0; }
    .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .item-header h4 { margin: 0; font-size: 14px; font-weight: 500; }

    .section { margin-top: var(--space-3); }
    .section h4 { margin: 0 0 var(--space-2); font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    .payer-chips .mat-mdc-chip { height: 36px; }

    @media (max-width: 599px) {
      .form-page { padding: var(--space-6) var(--space-3); align-items: stretch; }
      .form-card { max-width: none; }
      .row { flex-direction: column; gap: var(--space-3); }
      .half-width { width: 100%; }
      .form { gap: var(--space-4); }
      .form-actions { flex-direction: column-reverse; }
      .form-actions button { width: 100%; }
    }
  `]
})
export class ExpenseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  readonly currencies = CURRENCIES;
  readonly splitTypes = SPLIT_TYPES;
  readonly splitTypeLabels: Record<SplitType, string> = {
    equal: 'Equal',
    percentage: 'Percentage',
    shares: 'Shares',
    exact: 'Exact amounts',
    itemized: 'Itemized',
  };
  readonly splitTypeHints: Record<SplitType, string> = {
    equal: 'Split equally among all participants',
    percentage: 'Assign a percentage to each participant (must total 100%)',
    shares: 'Assign shares to each participant (e.g., 2 shares = 2× portion)',
    exact: 'Enter exact amount each participant owes',
    itemized: 'Add individual items and assign them to participants',
  };

  submitting = signal(false);
  isEditing = signal(false);
  groupId = signal<string>('');
  expenseId = signal<string | null>(null);
  members = signal<Member[]>([]);

  // Payer selection
  payerControl = this.fb.control<string[]>([]);

  // Split configuration forms
  percentageForm = this.fb.group({});
  sharesForm = this.fb.group({});
  exactForm = this.fb.group({});
  itemsForm = this.fb.array<FormGroup>([]);

  // Main form
  form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(200)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', [Validators.required]],
    date: [new Date(), [Validators.required]],
    splitType: ['equal' as SplitType, [Validators.required]],
    category: [''],
    notes: [''],
    payerIds: [[] as string[]],
  });

  // Computed values
  splitType = computed(() => this.form.get('splitType')?.value as SplitType);
  previewAmount = computed(() => toMinorUnits(this.form.get('amount')?.value || 0, this.form.get('currency')?.value || 'USD'));
  previewCurrency = computed(() => this.form.get('currency')?.value || 'USD');

  isValidSplit = computed(() => {
    const type = this.splitType();
    const amountMinor = this.previewAmount();
    const currency = this.previewCurrency();
    const mems = this.members();

    if (mems.length === 0) return false;

    switch (type) {
      case 'equal': return true;
      case 'percentage': {
        const values = Object.values(this.percentageForm.value) as number[];
        const sum = values.reduce((acc: number, v: number) => acc + (v || 0), 0);
        return Math.abs(sum - 100) < 0.01 && values.length === mems.length && values.every(v => (v || 0) >= 0);
      }
      case 'shares': {
        const values = Object.values(this.sharesForm.value) as number[];
        return values.length === mems.length && values.every(v => (v || 0) > 0);
      }
      case 'exact': {
        const values = Object.values(this.exactForm.value) as number[];
        const sum = values.reduce((acc: number, v: number) => acc + (v || 0), 0);
        return sum === this.form.get('amount')?.value && values.length === mems.length && values.every(v => (v || 0) >= 0);
      }
      case 'itemized': {
        const items = this.itemsForm.value as Array<{ amount: number }>;
        if (items.length === 0) return false;
        const totalItems = items.reduce((acc: number, item: { amount: number }) => acc + (item.amount || 0), 0);
        const formAmount = this.form.get('amount')?.value || 0;
        return Math.abs(totalItems - formAmount) < 0.01;
      }
      default: return false;
    }
  });

  splitValidationMessage = computed(() => {
    const type = this.splitType();
    const mems = this.members();

    if (mems.length === 0) return 'No group members available';

    if (!this.isValidSplit()) {
      switch (type) {
        case 'percentage': return 'Percentages must sum to 100% and all members must have a value';
        case 'shares': return 'All members must have at least 1 share';
        case 'exact': {
          const values = Object.values(this.exactForm.value) as number[];
          const sum = values.reduce((acc: number, v: number) => acc + (v || 0), 0);
          const target = this.form.get('amount')?.value || 0;
          return `Exact amounts must sum to ${target} (currently ${sum})`;
        }
        case 'itemized': return 'Add items that sum to the total amount';
        default: return 'Invalid split configuration';
      }
    }
    return 'Split configuration is valid';
  });

  ngOnInit(): void {
    this.groupId.set(this.route.snapshot.paramMap.get('groupId') || '');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.expenseId.set(id);
      this.loadExpense(id);
    }
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    try {
      const response = await this.http.get<{ groups: any[] }>(`${environment.apiUrl}/groups/${this.groupId()}`).toPromise();
      if (response && response.groups && response.groups[0]?.memberships) {
        const mems: Member[] = response.groups[0].memberships
          .filter((m: any) => !m.isGuest)
          .map((m: any) => ({
            id: m.id,
            displayName: m.displayName,
            userId: m.user?.id || null,
          }));
        this.members.set(mems);
        this.payerControl.setValue(mems.map(m => m.id));
      }
    } catch (err) {
      console.error('Failed to load members', err);
    }
  }

  async loadExpense(id: string): Promise<void> {
    try {
      const expense = await this.http.get<any>(`${environment.apiUrl}/groups/${this.groupId()}/expenses/${id}`).toPromise();
      if (expense) {
        this.form.patchValue({
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          date: new Date(expense.date),
          splitType: expense.splitType,
          category: expense.categoryId || '',
          notes: expense.notes || '',
          payerIds: expense.payerIds,
        });
        this.payerControl.setValue(expense.payerIds || []);

        const members = this.members();
        switch (expense.splitType) {
          case 'percentage': this.patchPercentageForm(expense.splits); break;
          case 'shares': this.patchSharesForm(expense.splits); break;
          case 'exact': this.patchExactForm(expense.splits); break;
          case 'itemized': this.patchItemsForm(expense.items); break;
        }
      }
    } catch (err) {
      console.error('Failed to load expense', err);
      this.snackBar.open('Failed to load expense', 'Dismiss', { duration: 5000 });
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  private patchPercentageForm(splits: any[]): void {
    const group = this.fb.group({});
    for (const member of this.members()) {
      const split = splits.find(s => s.memberId === member.id);
      group.addControl(member.id, this.fb.control(split?.percentage || 0, [Validators.min(0), Validators.max(100)]));
    }
    this.percentageForm = group;
  }

  private patchSharesForm(splits: any[]): void {
    const group = this.fb.group({});
    for (const member of this.members()) {
      const split = splits.find(s => s.memberId === member.id);
      group.addControl(member.id, this.fb.control(split?.shares || 1, [Validators.min(1)]));
    }
    this.sharesForm = group;
  }

  private patchExactForm(splits: any[]): void {
    const group = this.fb.group({});
    for (const member of this.members()) {
      const split = splits.find(s => s.memberId === member.id);
      group.addControl(member.id, this.fb.control(split?.amount || 0, [Validators.min(0)]));
    }
    this.exactForm = group;
  }

  private patchItemsForm(items: any[]): void {
    this.itemsForm.clear();
    for (const item of items) {
      this.itemsForm.push(this.fb.group({
        id: item.id,
        description: [item.description, Validators.required],
        amount: [item.amount, [Validators.required, Validators.min(0.01)]],
        currency: [item.currency, Validators.required],
        assignedTo: [item.assignedTo, Validators.required],
      }));
    }
  }

  onSplitTypeChange(type: SplitType): void {
    const members = this.members();
    if (members.length === 0) return;

    switch (type) {
      case 'percentage': {
        const group = this.fb.group({});
        for (const member of members) {
          group.addControl(member.id, this.fb.control(0, [Validators.min(0), Validators.max(100)]));
        }
        this.percentageForm = group;
        break;
      }
      case 'shares': {
        const group = this.fb.group({});
        for (const member of members) {
          group.addControl(member.id, this.fb.control(1, [Validators.min(1)]));
        }
        this.sharesForm = group;
        break;
      }
      case 'exact': {
        const group = this.fb.group({});
        for (const member of members) {
          group.addControl(member.id, this.fb.control(0, [Validators.min(0)]));
        }
        this.exactForm = group;
        break;
      }
      case 'itemized':
        this.itemsForm.clear();
        this.addItem();
        break;
    }
  }

  getPercentageControl(memberId: string) {
    if (!this.percentageForm.contains(memberId)) {
      this.percentageForm.addControl(memberId, this.fb.control(0, [Validators.min(0), Validators.max(100)]));
    }
    return this.percentageForm.get(memberId)!;
  }

  getSharesControl(memberId: string) {
    if (!this.sharesForm.contains(memberId)) {
      this.sharesForm.addControl(memberId, this.fb.control(1, [Validators.min(1)]));
    }
    return this.sharesForm.get(memberId)!;
  }

  getExactControl(memberId: string) {
    if (!this.exactForm.contains(memberId)) {
      this.exactForm.addControl(memberId, this.fb.control(0, [Validators.min(0)]));
    }
    return this.exactForm.get(memberId)!;
  }

  totalPercent = computed(() => {
    const values = Object.values(this.percentageForm.value) as number[];
    return values.reduce((acc: number, v: number) => acc + (v || 0), 0);
  });

  totalShares = computed(() => {
    const values = Object.values(this.sharesForm.value) as number[];
    return values.reduce((acc: number, v: number) => acc + (v || 0), 0);
  });

  totalExactAmount = computed(() => {
    const values = Object.values(this.exactForm.value) as number[];
    return values.reduce((acc: number, v: number) => acc + (v || 0), 0);
  });

  addItem(): void {
    this.itemsForm.push(this.fb.group({
      id: crypto.randomUUID(),
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      currency: [this.previewCurrency(), Validators.required],
      assignedTo: [[] as string[], Validators.required],
    }));
  }

  removeItem(index: number): void {
    this.itemsForm.removeAt(index);
  }

  isItemAssigned(item: FormGroup, memberId: string): boolean {
    return item.get('assignedTo')?.value?.includes(memberId) || false;
  }

  getAssignedToValue(item: FormGroup): string {
    return item.get('assignedTo')?.value?.join(',') || '';
  }

  toggleItemAssignment(item: FormGroup, memberId: string): void {
    const assigned = item.get('assignedTo')?.value || [];
    const index = assigned.indexOf(memberId);
    if (index >= 0) {
      item.get('assignedTo')?.setValue(assigned.filter((id: string) => id !== memberId));
    } else {
      item.get('assignedTo')?.setValue([...assigned, memberId]);
    }
  }

  itemsTotal = computed((): number => {
    return this.itemsForm.controls.reduce((sum: number, control: FormGroup) => sum + (control.get('amount')?.value || 0), 0);
  });

  togglePayer(memberId: string): void {
    const current = this.payerControl.value || [];
    const index = current.indexOf(memberId);
    if (index >= 0) {
      this.payerControl.setValue(current.filter(id => id !== memberId));
    } else {
      this.payerControl.setValue([...current, memberId]);
    }
  }

  getPayerIdsString(): string {
    return (this.payerControl.value || []).join(',');
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting() || !this.isValidSplit()) return;

    this.submitting.set(true);

    const rawForm = this.form.getRawValue();
    const amountMinor = toMinorUnits(rawForm.amount, rawForm.currency);
    const members = this.members();

    let splits: ExpenseSplit[] = [];

    switch (this.splitType()) {
      case 'equal': {
        const result = splitEqual(amountMinor, members.map(m => m.id), rawForm.currency);
        splits = [...result.splits];
        break;
      }
      case 'percentage': {
        const percentSplits = members.map(m => ({
          memberId: m.id,
          percentage: this.percentageForm.get(m.id)?.value || 0,
        }));
        const result = splitByPercent(amountMinor, percentSplits, rawForm.currency);
        splits = [...result.splits];
        break;
      }
      case 'shares': {
        const shareSplits = members.map(m => ({
          memberId: m.id,
          shares: this.sharesForm.get(m.id)?.value || 1,
        }));
        const result = splitByShares(amountMinor, shareSplits, rawForm.currency);
        splits = [...result.splits];
        break;
      }
      case 'exact': {
        const exactSplits = members.map(m => ({
          memberId: m.id,
          amount: toMinorUnits(this.exactForm.get(m.id)?.value || 0, rawForm.currency),
        }));
        const result = splitExact(amountMinor, exactSplits, rawForm.currency);
        splits = [...result.splits];
        break;
      }
      case 'itemized': {
        const items: ExpenseItem[] = this.itemsForm.controls.map(control => {
          const group = control as FormGroup;
          return {
            id: group.get('id')?.value as string,
            description: group.get('description')?.value as string,
            amount: toMinorUnits(group.get('amount')?.value as number, group.get('currency')?.value as string),
            currency: group.get('currency')?.value as string,
            assignedTo: group.get('assignedTo')?.value as string[],
            splits: (group.get('assignedTo')?.value as string[])?.map((id: string) => ({ memberId: id, amount: 0 })) || [],
          };
        });
        const memberIds = members.map(m => m.id);
        const result = splitItemized(items, memberIds, rawForm.currency);
        splits = [...result.splits];
        break;
      }
    }

    const payerValues = this.payerControl.value || [];
    const payers: ExpensePayer[] = payerValues.map(memberId => ({
      memberId,
      amount: payerValues.length > 0 ? Math.round(amountMinor / payerValues.length) : 0,
    }));

    const payload = {
      description: rawForm.description,
      amount: amountMinor,
      currency: rawForm.currency,
      date: rawForm.date.toISOString(),
      splitType: this.splitType(),
      categoryId: rawForm.category || null,
      notes: rawForm.notes || null,
      payers,
      splits: splits.map(s => ({
        memberId: s.memberId,
        amount: s.amount,
        percentage: s.percentage,
        shares: s.shares,
      })),
      items: this.splitType() === 'itemized' ? this.itemsForm.controls.map(control => {
        const group = control as FormGroup;
        return {
          id: group.get('id')?.value as string,
          description: group.get('description')?.value as string,
          amount: toMinorUnits(group.get('amount')?.value as number, group.get('currency')?.value as string),
          currency: group.get('currency')?.value as string,
          assignedTo: group.get('assignedTo')?.value as string[],
        };
      }) : undefined,
    };

    const url = this.isEditing()
      ? `${environment.apiUrl}/groups/${this.groupId()}/expenses/${this.expenseId()}`
      : `${environment.apiUrl}/groups/${this.groupId()}/expenses`;
    const method = this.isEditing() ? 'patch' : 'post';

    this.http[method](url, payload).subscribe({
      next: () => {
        this.snackBar.open(this.isEditing() ? 'Expense updated' : 'Expense created', 'Dismiss', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to save expense', 'Dismiss', { duration: 5000 });
      },
      complete: () => { this.submitting.set(false); },
    });
  }

  trackByMemberId(index: number, member: Member): string { return member.id; }
  trackByIndex(index: number): number { return index; }

  isSplitTypeSelected(): boolean { return !!this.splitType(); }
}