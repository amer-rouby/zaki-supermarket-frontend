import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { AssistantService } from '../../../core/services/assistant.service';
import { AssistantChatMessage } from '../../../core/models/assistant.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-assistant-chat-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule],
  templateUrl: './assistant-chat-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './assistant-chat-dialog.component.scss'
})
export class AssistantChatDialogComponent implements AfterViewChecked {
  private readonly assistantService = inject(AssistantService);
  private readonly translate = inject(TranslateService);
  dialogRef = inject(MatDialogRef<AssistantChatDialogComponent>);

  @ViewChild('messagesEnd') private messagesEndRef?: ElementRef<HTMLDivElement>;

  readonly messages = signal<AssistantChatMessage[]>([]);
  readonly loading = signal(false);
  queryText = '';

  readonly suggestedQuestions = [
    'ما أكثر المنتجات مبيعًا هذا الأسبوع؟',
    'ما المنتجات التي ستنفد قريبًا؟',
    'ما المنتجات القريبة من انتهاء الصلاحية؟',
    'ما المبيعات اليوم مقارنة بمتوسط آخر 30 يوم؟',
    'ما المنتجات التي تنصح بإعادة طلبها؟'
  ];

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.messagesEndRef?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  onAskSuggested(question: string): void {
    this.queryText = question;
    this.onSend();
  }

  onSend(): void {
    const query = this.queryText.trim();
    if (!query || this.loading()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', text: query }]);
    this.queryText = '';
    this.loading.set(true);
    this.shouldScroll = true;

    this.assistantService.ask(query).subscribe({
      next: (answer) => {
        this.loading.set(false);
        this.shouldScroll = true;
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          text: answer?.text || this.translate.instant('ASSISTANT.ERROR')
        }]);
      },
      error: () => {
        this.loading.set(false);
        this.shouldScroll = true;
        this.messages.update(msgs => [...msgs, { role: 'assistant', text: this.translate.instant('ASSISTANT.ERROR') }]);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
