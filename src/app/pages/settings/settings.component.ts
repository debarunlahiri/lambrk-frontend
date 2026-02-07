import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  nsfwEnabled: boolean;
  autoplayEnabled: boolean;
  showThumbnails: boolean;
  compactView: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  commentNotifications: boolean;
  postNotifications: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  currentUser = signal<any>(null);
  isSaving = signal(false);

  settings = signal<UserSettings>({
    theme: 'auto',
    language: 'en',
    nsfwEnabled: false,
    autoplayEnabled: true,
    showThumbnails: true,
    compactView: false,
    emailNotifications: true,
    pushNotifications: false,
    commentNotifications: true,
    postNotifications: true,
  });

  languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
  ];

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadSettings();
  }

  loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.currentUser.set(user);
    }
  }

  loadSettings(): void {
    const stored = localStorage.getItem('userSettings');
    if (stored) {
      this.settings.set(JSON.parse(stored));
    }
  }

  saveSettings(): void {
    this.isSaving.set(true);

    // Save to localStorage (in a real app, this would be an API call)
    localStorage.setItem('userSettings', JSON.stringify(this.settings()));

    // Apply theme
    this.applyTheme(this.settings().theme);

    setTimeout(() => {
      this.isSaving.set(false);
      this.snackBar.open('Settings saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }, 500);
  }

  resetSettings(): void {
    const defaultSettings: UserSettings = {
      theme: 'auto',
      language: 'en',
      nsfwEnabled: false,
      autoplayEnabled: true,
      showThumbnails: true,
      compactView: false,
      emailNotifications: true,
      pushNotifications: false,
      commentNotifications: true,
      postNotifications: true,
    };

    this.settings.set(defaultSettings);
    this.saveSettings();
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }

  onThemeChange(theme: 'light' | 'dark' | 'auto'): void {
    const currentSettings = this.settings();
    this.settings.set({ ...currentSettings, theme });
  }

  onLanguageChange(language: string): void {
    const currentSettings = this.settings();
    this.settings.set({ ...currentSettings, language });
  }

  onToggleChange(key: keyof UserSettings, value: boolean): void {
    const currentSettings = this.settings();
    this.settings.set({ ...currentSettings, [key]: value });
  }
}
