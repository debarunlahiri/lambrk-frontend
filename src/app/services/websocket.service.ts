import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  WebSocketConnectionState,
  WebSocketConnectionEvent,
  WebSocketNotification,
  WebSocketPostUpdate,
  WebSocketCommentUpdate,
  WebSocketKarmaUpdate,
  WebSocketVoteUpdate,
  WebSocketSystemAnnouncement,
  WebSocketSubredditUpdate,
  WebSocketUserStatus,
  USER_TOPICS,
  PUBLIC_TOPICS,
} from '../models/websocket.model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private readonly authService = inject(AuthService);

  // STOMP client
  private client: Client | null = null;

  // Connection state
  connectionState = signal<WebSocketConnectionState>('DISCONNECTED');
  connectionEvents = signal<WebSocketConnectionEvent[]>([]);

  // Reconnection settings
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Message subjects for different topics
  private notificationSubject = new Subject<WebSocketNotification>();
  private postUpdateSubject = new Subject<WebSocketPostUpdate>();
  private commentUpdateSubject = new Subject<WebSocketCommentUpdate>();
  private karmaUpdateSubject = new Subject<WebSocketKarmaUpdate>();
  private voteUpdateSubject = new Subject<WebSocketVoteUpdate>();
  private announcementSubject = new Subject<WebSocketSystemAnnouncement>();
  private subredditUpdateSubject = new Subject<WebSocketSubredditUpdate>();
  private userStatusSubject = new Subject<WebSocketUserStatus>();

  // Active subscriptions for cleanup
  private activeSubscriptions: string[] = [];

  constructor() {
    // Auto-connect when user is authenticated
    this.authService.isAuthenticated();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  // ── Connection Management ──

  connect(): void {
    if (this.client?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = localStorage.getItem('reddit_access_token');
    if (!token) {
      console.log('No auth token available, skipping WebSocket connection');
      return;
    }

    this.setConnectionState('CONNECTING');

    // Create STOMP client with SockJS fallback
    const wsUrl = `${environment.apiBaseUrl}/ws`.replace('http://', 'ws://').replace('https://', 'wss://');

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (msg) => {
        if (environment.production) return;
        console.log('[STOMP]', msg);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Handle connection
    this.client.onConnect = (frame) => {
      console.log('WebSocket connected:', frame);
      this.reconnectAttempts = 0;
      this.setConnectionState('CONNECTED');

      // Subscribe to user-specific topics
      this.subscribeToUserTopics();
    };

    // Handle disconnection
    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.setConnectionState('DISCONNECTED');
    };

    // Handle errors
    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message'], frame.body);
      this.setConnectionState('ERROR', frame.headers['message']);
    };

    // Handle WebSocket errors
    this.client.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
      this.setConnectionState('ERROR', 'WebSocket connection failed');
      this.scheduleReconnect();
    };

    // Activate the connection
    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.activeSubscriptions = [];
    this.setConnectionState('DISCONNECTED');
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.setConnectionState('ERROR', 'Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('RECONNECTING', undefined, this.reconnectAttempts);

    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private setConnectionState(
    state: WebSocketConnectionState,
    error?: string,
    reconnectAttempt?: number
  ): void {
    this.connectionState.set(state);

    const event: WebSocketConnectionEvent = {
      state,
      timestamp: Date.now(),
      error,
      reconnectAttempt,
    };

    this.connectionEvents.update((events) => [...events, event]);
  }

  // ── User Topic Subscriptions ──

  private subscribeToUserTopics(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const username = user.username;

    // Subscribe to notifications
    this.subscribe(USER_TOPICS.notifications(username), (message) => {
      const notification: WebSocketNotification = JSON.parse(message.body);
      this.notificationSubject.next(notification);
    });

    // Subscribe to karma updates
    this.subscribe(USER_TOPICS.karma(username), (message) => {
      const karma: WebSocketKarmaUpdate = JSON.parse(message.body);
      this.karmaUpdateSubject.next(karma);
    });

    // Subscribe to vote updates
    this.subscribe(USER_TOPICS.votes(username), (message) => {
      const vote: WebSocketVoteUpdate = JSON.parse(message.body);
      this.voteUpdateSubject.next(vote);
    });

    // Subscribe to user post updates
    this.subscribe(USER_TOPICS.posts(username), (message) => {
      const post: WebSocketPostUpdate = JSON.parse(message.body);
      this.postUpdateSubject.next(post);
    });

    // Subscribe to user comment updates
    this.subscribe(USER_TOPICS.comments(username), (message) => {
      const comment: WebSocketCommentUpdate = JSON.parse(message.body);
      this.commentUpdateSubject.next(comment);
    });
  }

  // ── Public Topic Subscriptions ──

  subscribeToPost(postId: number): void {
    this.subscribe(PUBLIC_TOPICS.post(postId), (message) => {
      const post: WebSocketPostUpdate = JSON.parse(message.body);
      this.postUpdateSubject.next(post);
    });

    this.subscribe(PUBLIC_TOPICS.postComments(postId), (message) => {
      const comment: WebSocketCommentUpdate = JSON.parse(message.body);
      this.commentUpdateSubject.next(comment);
    });
  }

  unsubscribeFromPost(postId: number): void {
    this.unsubscribe(PUBLIC_TOPICS.post(postId));
    this.unsubscribe(PUBLIC_TOPICS.postComments(postId));
  }

  subscribeToSubreddit(subredditId: number): void {
    this.subscribe(PUBLIC_TOPICS.subreddit(subredditId), (message) => {
      const update: WebSocketSubredditUpdate = JSON.parse(message.body);
      this.subredditUpdateSubject.next(update);
    });
  }

  unsubscribeFromSubreddit(subredditId: number): void {
    this.unsubscribe(PUBLIC_TOPICS.subreddit(subredditId));
  }

  subscribeToAnnouncements(): void {
    this.subscribe(PUBLIC_TOPICS.announcements, (message) => {
      const announcement: WebSocketSystemAnnouncement = JSON.parse(message.body);
      this.announcementSubject.next(announcement);
    });
  }

  subscribeToUserStatus(username: string): void {
    this.subscribe(PUBLIC_TOPICS.userStatus(username), (message) => {
      const status: WebSocketUserStatus = JSON.parse(message.body);
      this.userStatusSubject.next(status);
    });
  }

  // ── Generic Subscribe/Unsubscribe ──

  private subscribe(destination: string, callback: (message: IMessage) => void): void {
    if (!this.client?.connected) {
      console.warn('Cannot subscribe, WebSocket not connected:', destination);
      return;
    }

    const subscription = this.client.subscribe(destination, callback);
    this.activeSubscriptions.push(destination);
    console.log('Subscribed to:', destination);
  }

  private unsubscribe(destination: string): void {
    if (!this.client?.connected) return;

    // STOMP.js handles subscription cleanup automatically
    this.activeSubscriptions = this.activeSubscriptions.filter((d) => d !== destination);
    console.log('Unsubscribed from:', destination);
  }

  // ── Observables for Components ──

  get notifications$(): Observable<WebSocketNotification> {
    return this.notificationSubject.asObservable();
  }

  get postUpdates$(): Observable<WebSocketPostUpdate> {
    return this.postUpdateSubject.asObservable();
  }

  get commentUpdates$(): Observable<WebSocketCommentUpdate> {
    return this.commentUpdateSubject.asObservable();
  }

  get karmaUpdates$(): Observable<WebSocketKarmaUpdate> {
    return this.karmaUpdateSubject.asObservable();
  }

  get voteUpdates$(): Observable<WebSocketVoteUpdate> {
    return this.voteUpdateSubject.asObservable();
  }

  get announcements$(): Observable<WebSocketSystemAnnouncement> {
    return this.announcementSubject.asObservable();
  }

  get subredditUpdates$(): Observable<WebSocketSubredditUpdate> {
    return this.subredditUpdateSubject.asObservable();
  }

  get userStatus$(): Observable<WebSocketUserStatus> {
    return this.userStatusSubject.asObservable();
  }

  // ── Filtered Observables ──

  getPostUpdates(postId: number): Observable<WebSocketPostUpdate> {
    return this.postUpdates$.pipe(filter((update) => update.id === postId));
  }

  getCommentUpdatesForPost(postId: number): Observable<WebSocketCommentUpdate> {
    return this.commentUpdates$;
  }

  getVoteUpdatesForTarget(targetId: number, targetType: 'POST' | 'COMMENT'): Observable<WebSocketVoteUpdate> {
    return this.voteUpdates$.pipe(
      filter((update) => update.targetId === targetId && update.targetType === targetType)
    );
  }
}
