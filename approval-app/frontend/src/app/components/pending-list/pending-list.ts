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
  newTitleError = '';

  showEditModal = false;
  editingId: number | null = null;
  editingTitle = '';
  editingTitleError = '';

  deletingItem: Approval | null = null;

  showMockModal = false;
  mockLoading = false;

  showMemoModal = false;
  memoAction: 'approve' | 'reject' | null = null;
  memo = '';
  memoError = '';

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

  toggleRow(id: number): void {
    this.toggleSelected(id, !this.selectedIds.has(id));
  }

  get allSelected(): boolean {
    const items = this.items();
    return items.length > 0 && this.selectedIds.size === items.length;
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedIds.clear();
    } else {
      this.items().forEach((item) => this.selectedIds.add(item.id));
    }
  }

  private validate(value: string, label: string, maxLength: number): string {
    const trimmed = value.trim();
    if (!trimmed) return `กรุณากรอก${label}`;
    if (trimmed.length > maxLength) return `${label}ต้องไม่เกิน ${maxLength} ตัวอักษร`;
    return '';
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.newTitleError = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreate(): void {
    this.newTitleError = this.validate(this.newTitle, 'ชื่อรายการ', 200);
    if (this.newTitleError) return;

    this.approvalService.create(this.newTitle.trim()).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.refresh();
      },
      error: (err) => this.error.set(err.message),
    });
  }

  openEditModal(item: Approval): void {
    this.editingId = item.id;
    this.editingTitle = item.title;
    this.editingTitleError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingId = null;
  }

  submitEdit(): void {
    if (this.editingId === null) return;
    this.editingTitleError = this.validate(this.editingTitle, 'ชื่อรายการ', 200);
    if (this.editingTitleError) return;

    this.approvalService.update(this.editingId, this.editingTitle.trim()).subscribe({
      next: () => {
        this.closeEditModal();
        this.refresh();
      },
      error: (err) => this.error.set(err.message),
    });
  }

  openDeleteModal(item: Approval): void {
    this.deletingItem = item;
  }

  closeDeleteModal(): void {
    this.deletingItem = null;
  }

  confirmDelete(): void {
    if (!this.deletingItem) return;
    this.approvalService.delete(this.deletingItem.id).subscribe({
      next: () => {
        this.deletingItem = null;
        this.refresh();
      },
      error: (err) => {
        this.deletingItem = null;
        this.error.set(err.message);
      },
    });
  }

  openMockModal(): void {
    this.showMockModal = true;
  }

  closeMockModal(): void {
    if (this.mockLoading) return;
    this.showMockModal = false;
  }

  confirmMock(): void {
    if (this.mockLoading) return;
    this.mockLoading = true;
    this.approvalService.mock().subscribe({
      next: () => {
        this.mockLoading = false;
        this.showMockModal = false;
        this.error.set('');
        this.refresh();
      },
      error: (err) => {
        this.mockLoading = false;
        this.showMockModal = false;
        this.error.set(err.message);
      },
    });
  }

  openMemoModal(action: 'approve' | 'reject'): void {
    if (this.selectedIds.size === 0) return;
    this.memoAction = action;
    this.memo = '';
    this.memoError = '';
    this.showMemoModal = true;
  }

  closeMemoModal(): void {
    this.showMemoModal = false;
    this.memoAction = null;
  }

  submitMemo(): void {
    this.memoError = this.validate(this.memo, 'หมายเหตุ', 500);
    if (this.memoError) return;

    const ids = Array.from(this.selectedIds);
    const memo = this.memo.trim();
    const call =
      this.memoAction === 'approve'
        ? this.approvalService.approve(ids, memo)
        : this.approvalService.reject(ids, memo);

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
