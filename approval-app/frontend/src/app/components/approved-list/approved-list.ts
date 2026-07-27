import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Approval } from '../../models/approval.model';
import { ApprovalService } from '../../services/approval.service';

@Component({
  selector: 'app-approved-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approved-list.html',
  styleUrl: './approved-list.css',
})
export class ApprovedList implements OnInit {
  items = signal<Approval[]>([]);
  error = signal('');

  constructor(private approvalService: ApprovalService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.approvalService.list('approved').subscribe({
      next: (data) => this.items.set(data),
      error: (err) => this.error.set(err.message),
    });
  }

  cancelItem(id: number): void {
    this.approvalService.cancel(id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.error.set(err.message),
    });
  }
}
