import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Comment, CreateCommentDto } from '../../models/post.model';
import { CommentService } from '../../services/comment.service';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    CommentItemComponent,
  ],
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.scss',
})
export class CommentListComponent implements OnInit {
  @Input({ required: true }) postId!: number;
  @Input() currentUserId?: number;

  comments = signal<Comment[]>([]);
  newCommentContent = signal('');
  isSubmitting = signal(false);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(20);
  totalElements = signal(0);
  totalPages = signal(0);

  constructor(public commentService: CommentService) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.commentService
      .getPostComments(this.postId, this.currentPage(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.comments.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
        },
        error: (error) => {
          console.error('Error loading comments:', error);
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadComments();
    // Scroll to top of comments
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitComment(): void {
    const content = this.newCommentContent().trim();
    if (!content) return;

    this.isSubmitting.set(true);
    const commentData: CreateCommentDto = {
      content,
      postId: this.postId,
      parentCommentId: null,
    };

    this.commentService.createComment(commentData).subscribe({
      next: (newComment) => {
        // Add new comment to the top of the list
        const currentComments = this.comments();
        this.comments.set([newComment, ...currentComments]);
        this.newCommentContent.set('');
        this.isSubmitting.set(false);
        this.totalElements.set(this.totalElements() + 1);
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        this.isSubmitting.set(false);
      },
    });
  }

  onVote(event: { commentId: number; voteType: 'UPVOTE' | 'DOWNVOTE' | null }): void {
    this.commentService.voteComment(event.commentId, event.voteType).subscribe({
      next: (updatedComment) => {
        this.updateCommentInList(updatedComment);
      },
      error: (error) => {
        console.error('Error voting on comment:', error);
      },
    });
  }

  onReply(event: { commentId: number; content: string }): void {
    const commentData: CreateCommentDto = {
      content: event.content,
      postId: this.postId,
      parentCommentId: event.commentId,
    };

    this.commentService.createComment(commentData).subscribe({
      next: (newReply) => {
        // Add reply to the parent comment's replies
        this.addReplyToComment(event.commentId, newReply);
      },
      error: (error) => {
        console.error('Error creating reply:', error);
      },
    });
  }

  onEdit(event: { commentId: number; content: string }): void {
    this.commentService.updateComment(event.commentId, event.content).subscribe({
      next: (updatedComment) => {
        this.updateCommentInList(updatedComment);
      },
      error: (error) => {
        console.error('Error updating comment:', error);
      },
    });
  }

  onDelete(commentId: number): void {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        // Mark comment as deleted in the list
        this.markCommentAsDeleted(commentId);
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
      },
    });
  }

  onLoadReplies(commentId: number): void {
    this.commentService.getCommentReplies(commentId).subscribe({
      next: (replies) => {
        this.addRepliesToComment(commentId, replies);
      },
      error: (error) => {
        console.error('Error loading replies:', error);
      },
    });
  }

  // Helper methods
  private updateCommentInList(updatedComment: Comment): void {
    const updateRecursive = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === updatedComment.id) {
          return { ...updatedComment, replies: comment.replies };
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: updateRecursive(comment.replies) };
        }
        return comment;
      });
    };

    this.comments.set(updateRecursive(this.comments()));
  }

  private addReplyToComment(parentId: number, reply: Comment): void {
    const addReplyRecursive = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [reply, ...comment.replies],
            replyCount: comment.replyCount + 1,
          };
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: addReplyRecursive(comment.replies) };
        }
        return comment;
      });
    };

    this.comments.set(addReplyRecursive(this.comments()));
  }

  private addRepliesToComment(parentId: number, replies: Comment[]): void {
    const addRepliesRecursive = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === parentId) {
          return { ...comment, replies };
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: addRepliesRecursive(comment.replies) };
        }
        return comment;
      });
    };

    this.comments.set(addRepliesRecursive(this.comments()));
  }

  private markCommentAsDeleted(commentId: number): void {
    const markDeletedRecursive = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, isDeleted: true, content: '[deleted]' };
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: markDeletedRecursive(comment.replies) };
        }
        return comment;
      });
    };

    this.comments.set(markDeletedRecursive(this.comments()));
  }
}
