import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Approval } from '../../models/approval.model';
import { ApprovalService } from '../../services/approval.service';

@Component({
  selector: 'app-rejected-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rejected-list.html',
  styleUrl: './rejected-list.css',
})
export class RejectedList implements OnInit {
  items = signal<Approval[]>([]);
  error = signal('');

  constructor(private approvalService: ApprovalService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.approvalService.list('rejected').subscribe({
      next: (data) => this.items.set(data),
      error: (err) => this.error.set(err.message),
    });
  }

  cancelingItem: Approval | null = null;

  openCancelModal(item: Approval): void {
    this.cancelingItem = item;
  }

  closeCancelModal(): void {
    this.cancelingItem = null;
  }

  confirmCancel(): void {
    if (!this.cancelingItem) return;
    this.approvalService.cancel(this.cancelingItem.id).subscribe({
      next: () => {
        this.cancelingItem = null;
        this.refresh();
      },
      error: (err) => {
        this.cancelingItem = null;
        this.error.set(err.message);
      },
    });
  }
}
