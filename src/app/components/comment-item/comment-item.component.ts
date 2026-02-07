import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Comment } from '../../models/post.model';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss',
})
export class CommentItemComponent {
  @Input({ required: true }) comment!: Comment;
  @Input() currentUserId?: number;
  @Input() depth: number = 0;
  @Input() maxDepth: number = 10;

  @Output() vote = new EventEmitter<{
    commentId: number;
    voteType: 'UPVOTE' | 'DOWNVOTE' | null;
  }>();
  @Output() reply = new EventEmitter<{ commentId: number; content: string }>();
  @Output() edit = new EventEmitter<{ commentId: number; content: string }>();
  @Output() delete = new EventEmitter<number>();
  @Output() loadReplies = new EventEmitter<number>();

  isReplying = signal(false);
  isEditing = signal(false);
  showReplies = signal(true);
  replyContent = signal('');
  editContent = signal('');

  get isAuthor(): boolean {
    return this.currentUserId === this.comment.author.id;
  }

  get canReply(): boolean {
    return this.depth < this.maxDepth;
  }

  get indentClass(): string {
    return `indent-${Math.min(this.depth, 5)}`;
  }

  toggleReplies(): void {
    this.showReplies.set(!this.showReplies());
    if (this.showReplies() && this.comment.replyCount > 0 && this.comment.replies.length === 0) {
      this.loadReplies.emit(this.comment.id);
    }
  }

  startReply(): void {
    this.isReplying.set(true);
    this.replyContent.set('');
  }

  cancelReply(): void {
    this.isReplying.set(false);
    this.replyContent.set('');
  }

  submitReply(): void {
    const content = this.replyContent().trim();
    if (content) {
      this.reply.emit({ commentId: this.comment.id, content });
      this.cancelReply();
    }
  }

  startEdit(): void {
    this.isEditing.set(true);
    this.editContent.set(this.comment.content);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editContent.set('');
  }

  submitEdit(): void {
    const content = this.editContent().trim();
    if (content && content !== this.comment.content) {
      this.edit.emit({ commentId: this.comment.id, content });
      this.cancelEdit();
    }
  }

  onVote(voteType: 'UPVOTE' | 'DOWNVOTE'): void {
    // If clicking the same vote, remove it (toggle)
    const newVote = this.comment.userVote === voteType ? null : voteType;
    this.vote.emit({ commentId: this.comment.id, voteType: newVote });
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.delete.emit(this.comment.id);
    }
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

  // Handle nested reply events
  onNestedVote(event: { commentId: number; voteType: 'UPVOTE' | 'DOWNVOTE' | null }): void {
    this.vote.emit(event);
  }

  onNestedReply(event: { commentId: number; content: string }): void {
    this.reply.emit(event);
  }

  onNestedEdit(event: { commentId: number; content: string }): void {
    this.edit.emit(event);
  }

  onNestedDelete(commentId: number): void {
    this.delete.emit(commentId);
  }

  onNestedLoadReplies(commentId: number): void {
    this.loadReplies.emit(commentId);
  }
}
