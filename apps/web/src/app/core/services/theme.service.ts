import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  
  readonly mode = signal<ThemeMode>('system');
  readonly isDark = signal(false);

  private readonly init = (() => {
    this.loadInitialTheme();
    this.applyTheme();
  })();

  private loadInitialTheme(): void {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('theme_mode') as ThemeMode | null;
    if (stored) {
      this.mode.set(stored);
    }
    
    this.updateIsDark();
  }

  private updateIsDark(): void {
    const mode = this.mode();
    if (mode === 'system') {
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      this.isDark.set(mode === 'dark');
    }
  }

  private applyTheme(): void {
    effect(() => {
      const dark = this.isDark();
      const html = this.document.documentElement;
      
      if (dark) {
        html.setAttribute('data-theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
      }
    });
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem('theme_mode', mode);
    this.updateIsDark();
  }

  toggleTheme(): void {
    const current = this.mode();
    if (current === 'system') {
      this.setTheme(this.isDark() ? 'light' : 'dark');
    } else {
      this.setTheme(current === 'light' ? 'dark' : 'light');
    }
  }

  currentTheme(): ThemeMode {
    return this.mode();
  }
}