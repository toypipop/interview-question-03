import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingList } from './components/pending-list/pending-list';
import { ApprovedList } from './components/approved-list/approved-list';
import { RejectedList } from './components/rejected-list/rejected-list';

type Tab = 'pending' | 'approved' | 'rejected';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PendingList, ApprovedList, RejectedList],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  activeTab: Tab = 'pending';

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }
}
