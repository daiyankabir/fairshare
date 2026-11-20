import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      class="theme-toggle"
      [class.fixed-theme-toggle]="fixed()"
      (click)="toggle()"
      [attr.aria-label]="ariaLabel()"
      [matTooltip]="tooltip()"
      matTooltipPosition="below"
      type="button"
    >
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
  styles: [`
    /* Styles are in global styles.scss */
  `]
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly fixed = signal(false);
  readonly mode = computed(() => this.themeService.currentTheme());
  readonly isDark = computed(() => this.themeService.isDark());

  readonly icon = computed(() => this.isDark() ? 'light_mode' : 'dark_mode');
  readonly tooltip = computed(() => `Theme: ${this.mode() === 'system' ? 'System' : this.mode()}. Click to change.`);
  readonly ariaLabel = computed(() => `Switch to ${this.isDark() ? 'light' : 'dark'} theme`);

  toggle(): void {
    this.themeService.toggleTheme();
  }
}