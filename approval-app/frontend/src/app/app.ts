import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingList } from './components/pending-list/pending-list';
import { ApprovedList } from './components/approved-list/approved-list';
import { RejectedList } from './components/rejected-list/rejected-list';
import { UserGuide } from './components/user-guide/user-guide';

type Tab = 'pending' | 'approved' | 'rejected';

const GUIDE_SEEN_KEY = 'greenbook.guide.seen';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PendingList, ApprovedList, RejectedList, UserGuide],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  activeTab: Tab = 'pending';
  showGuide = !localStorage.getItem(GUIDE_SEEN_KEY);

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  openGuide(): void {
    this.showGuide = true;
  }

  closeGuide(): void {
    this.showGuide = false;
    localStorage.setItem(GUIDE_SEEN_KEY, '1');
  }
}
