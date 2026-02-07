import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { SearchService } from '../../services/search.service';
import {
  SearchResponse,
  SearchType,
  SearchSort,
  SearchTimeFilter,
  getTimeFilterLabel,
  getSortLabel,
  getTypeLabel,
} from '../../models/search.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
    MatAutocompleteModule,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);

  // Search state
  searchQuery = signal<string>('');
  searchType = signal<SearchType>('ALL');
  sortBy = signal<SearchSort>('RELEVANCE');
  timeFilter = signal<SearchTimeFilter>('ALL');

  // Results
  results = signal<SearchResponse | null>(null);
  isSearching = signal<boolean>(false);

  // Suggestions
  suggestions = signal<string[]>([]);
  showSuggestions = signal<boolean>(false);

  // Recent searches (from localStorage)
  recentSearches = signal<string[]>([]);

  // Popular/Trending
  popularSearches = signal<string[]>([
    'spring boot',
    'java virtual threads',
    'kubernetes',
    'react tutorial',
    'python tips',
  ]);

  // Filters
  selectedSubreddits = signal<string[]>([]);
  selectedFlairs = signal<string[]>([]);
  minScore = signal<number | null>(null);
  minComments = signal<number | null>(null);
  includeNSFW = signal<boolean>(false);
  includeOver18 = signal<boolean>(false);

  // Autocomplete subject
  private searchSubject = new Subject<string>();

  // Computed
  hasResults = computed(() => {
    const res = this.results();
    if (!res) return false;
    return (
      res.posts.length > 0 ||
      res.comments.length > 0 ||
      res.users.length > 0 ||
      res.subreddits.length > 0
    );
  });

  // Helper functions
  getTimeFilterLabel = getTimeFilterLabel;
  getSortLabel = getSortLabel;
  getTypeLabel = getTypeLabel;

  // Options
  searchTypes: SearchType[] = ['ALL', 'POSTS', 'COMMENTS', 'USERS', 'SUBREDDITS'];
  sortOptions: SearchSort[] = ['RELEVANCE', 'NEW', 'HOT', 'TOP', 'CONTROVERSIAL'];
  timeFilters: SearchTimeFilter[] = ['ALL', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'];

  ngOnInit(): void {
    this.loadRecentSearches();
    this.setupAutocomplete();
  }

  setupAutocomplete(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query && query.length >= 2) {
            return this.searchService.getSuggestions(query, this.searchType());
          }
          return of([]);
        }),
      )
      .subscribe((suggestions) => {
        this.suggestions.set(suggestions);
        this.showSuggestions.set(suggestions.length > 0);
      });
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    if (query.length >= 2) {
      this.searchSubject.next(query);
    } else {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
    }
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query || query.length < 2) return;

    this.isSearching.set(true);
    this.showSuggestions.set(false);
    this.saveToRecentSearches(query);

    const type = this.searchType();

    if (type === 'ALL') {
      this.searchService
        .searchAll(query, {
          page: 0,
          size: 20,
          sort: this.sortBy(),
          timeFilter: this.timeFilter(),
        })
        .subscribe({
          next: (results) => {
            this.results.set(results);
            this.isSearching.set(false);
          },
          error: (err) => {
            console.error('Search error:', err);
            this.isSearching.set(false);
          },
        });
    } else if (type === 'POSTS') {
      this.searchService
        .searchPosts(query, {
          page: 0,
          size: 20,
          sort: this.sortBy(),
          timeFilter: this.timeFilter(),
          subreddits: this.selectedSubreddits().length > 0 ? this.selectedSubreddits() : undefined,
          flairs: this.selectedFlairs().length > 0 ? this.selectedFlairs() : undefined,
          minScore: this.minScore() ?? undefined,
          minComments: this.minComments() ?? undefined,
          includeNSFW: this.includeNSFW(),
          includeOver18: this.includeOver18(),
        })
        .subscribe({
          next: (results) => {
            this.results.set(results);
            this.isSearching.set(false);
          },
          error: (err) => {
            console.error('Search error:', err);
            this.isSearching.set(false);
          },
        });
    } else if (type === 'COMMENTS') {
      this.searchService
        .searchComments(query, {
          page: 0,
          size: 20,
          sort: this.sortBy(),
          timeFilter: this.timeFilter(),
          minScore: this.minScore() ?? undefined,
          includeNSFW: this.includeNSFW(),
          includeOver18: this.includeOver18(),
        })
        .subscribe({
          next: (results) => {
            this.results.set(results);
            this.isSearching.set(false);
          },
          error: (err) => {
            console.error('Search error:', err);
            this.isSearching.set(false);
          },
        });
    } else if (type === 'USERS') {
      this.searchService
        .searchUsers(query, {
          page: 0,
          size: 20,
          sort: this.sortBy(),
          minScore: this.minScore() ?? undefined,
        })
        .subscribe({
          next: (results) => {
            this.results.set(results);
            this.isSearching.set(false);
          },
          error: (err) => {
            console.error('Search error:', err);
            this.isSearching.set(false);
          },
        });
    } else if (type === 'SUBREDDITS') {
      this.searchService
        .searchSubreddits(query, {
          page: 0,
          size: 20,
          sort: this.sortBy(),
          includeNSFW: this.includeNSFW(),
          includeOver18: this.includeOver18(),
        })
        .subscribe({
          next: (results) => {
            this.results.set(results);
            this.isSearching.set(false);
          },
          error: (err) => {
            console.error('Search error:', err);
            this.isSearching.set(false);
          },
        });
    }
  }

  onQuickSearch(query: string): void {
    this.searchQuery.set(query);
    this.onSearch();
  }

  onSuggestionClick(suggestion: string): void {
    this.searchQuery.set(suggestion);
    this.showSuggestions.set(false);
    this.onSearch();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.results.set(null);
    this.suggestions.set([]);
    this.showSuggestions.set(false);
  }

  clearFilters(): void {
    this.selectedSubreddits.set([]);
    this.selectedFlairs.set([]);
    this.minScore.set(null);
    this.minComments.set(null);
    this.includeNSFW.set(false);
    this.includeOver18.set(false);
    this.timeFilter.set('ALL');
    this.sortBy.set('RELEVANCE');
  }

  removeRecentSearch(search: string): void {
    const recent = this.recentSearches().filter((s) => s !== search);
    this.recentSearches.set(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  }

  clearRecentSearches(): void {
    this.recentSearches.set([]);
    localStorage.removeItem('recentSearches');
  }

  navigateToPost(postId: number): void {
    this.router.navigate(['/posts', postId]);
  }

  navigateToUser(username: string): void {
    this.router.navigate(['/user', username]);
  }

  navigateToSubreddit(name: string): void {
    this.router.navigate(['/r', name]);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
  }

  private loadRecentSearches(): void {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        const searches = JSON.parse(stored);
        this.recentSearches.set(searches);
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }

  private saveToRecentSearches(query: string): void {
    const recent = this.recentSearches();
    const updated = [query, ...recent.filter((s) => s !== query)].slice(0, 10);
    this.recentSearches.set(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }
}
