import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Approval } from '../../models/approval.model';
import { ApprovalService } from '../../services/approval.service';

@Component({
  selector: 'app-pending-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-list.html',
  styleUrl: './pending-list.css',
})
export class PendingList implements OnInit {
  items = signal<Approval[]>([]);
  selectedIds = new Set<number>();
  error = signal('');

  showCreateModal = false;
  newTitle = '';

  editingId: number | null = null;
  editingTitle = '';

  showMemoModal = false;
  memoAction: 'approve' | 'reject' | null = null;
  memo = '';

  constructor(private approvalService: ApprovalService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.approvalService.list('pending').subscribe({
      next: (data) => {
        this.items.set(data);
        this.selectedIds.clear();
      },
      error: (err) => this.error.set(err.message),
    });
  }

  toggleSelected(id: number, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreate(): void {
    if (!this.newTitle.trim()) return;
    this.approvalService.create(this.newTitle.trim()).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.refresh();
      },
      error: (err) => this.error.set(err.message),
    });
  }

  startEdit(item: Approval): void {
    this.editingId = item.id;
    this.editingTitle = item.title;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  submitEdit(id: number): void {
    if (!this.editingTitle.trim()) return;
    this.approvalService.update(id, this.editingTitle.trim()).subscribe({
      next: () => {
        this.editingId = null;
        this.refresh();
      },
      error: (err) => this.error.set(err.message),
    });
  }

  deleteItem(id: number): void {
    this.approvalService.delete(id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.error.set(err.message),
    });
  }

  openMemoModal(action: 'approve' | 'reject'): void {
    if (this.selectedIds.size === 0) return;
    this.memoAction = action;
    this.memo = '';
    this.showMemoModal = true;
  }

  closeMemoModal(): void {
    this.showMemoModal = false;
    this.memoAction = null;
  }

  submitMemo(): void {
    const ids = Array.from(this.selectedIds);
    const call =
      this.memoAction === 'approve'
        ? this.approvalService.approve(ids, this.memo)
        : this.approvalService.reject(ids, this.memo);

    call.subscribe({
      next: () => {
        this.showMemoModal = false;
        this.memoAction = null;
        this.refresh();
      },
      error: (err) => this.error.set(err.message),
    });
  }
}
