import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-guide.html',
  styleUrl: './user-guide.css',
})
export class UserGuide {
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }
}
