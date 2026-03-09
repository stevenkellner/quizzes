import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    input,
    output,
    viewChild,
} from '@angular/core';
import { Question } from '../../../models/quiz.model';

@Component({
    selector: 'app-question-view',
    templateUrl: './question-view.html',
    styleUrl: './question-view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionViewComponent {
    readonly question = input.required<Question>();

    /** 'display' – read-only with correct-answer markers and optional search highlighting.
     *  'interactive' – checkboxes, toggleAnswer output, revealed state.
     *  'review' – read-only with correct + wrongly-selected answer highlighting. */
    readonly mode = input<'display' | 'interactive' | 'review'>('display');

    // interactive mode
    readonly selectedAnswers = input<boolean[]>([]);
    readonly revealed = input<boolean>(false);
    readonly toggleAnswer = output<number>();

    // review mode
    readonly selectedInReview = input<Set<number>>(new Set());

    // display mode
    readonly searchTerm = input<string>('');

    // optional 1-based number prefix (e.g. review list)
    readonly questionNumber = input<number | null>(null);

    private readonly answersRef = viewChild<ElementRef<HTMLElement>>('answersRef');

    focus(): void {
        setTimeout(() => {
            this.answersRef()?.nativeElement.querySelector<HTMLElement>('label')?.focus();
        }, 0);
    }

    protected isIncorrectSelected(idx: number): boolean {
        return !this.question().answers[idx].isCorrect && this.selectedInReview().has(idx);
    }

    protected highlightHtml(text: string): string {
        const escaped = this.escapeHtml(text);
        const term = this.searchTerm().trim();
        if (!term) return escaped;
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escaped.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark>$1</mark>');
    }

    protected onImageError(img: HTMLImageElement): void {
        img.hidden = true;
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
