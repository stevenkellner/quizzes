import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { Question } from '../../../../models/quiz.model';

@Component({
    selector: 'app-quiz-select',
    templateUrl: './quiz-select.html',
    styleUrl: './quiz-select.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizSelectComponent {
    readonly allQuestions = input.required<Question[]>();
    readonly selectedIndices = input.required<Set<number>>();

    readonly back = output<void>();
    readonly start = output<void>();
    readonly toggle = output<number>();
    readonly selectAll = output<void>();
    readonly deselectAll = output<void>();

    protected readonly searchTerm = signal('');
    protected readonly statusText = signal('');

    private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    protected readonly filteredEntries = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        return this.allQuestions()
            .map((q, idx) => ({ q, idx }))
            .filter(({ q }) => {
                if (!term) return true;
                if (q.text.toLowerCase().includes(term)) return true;
                return q.answers.some(a => a.text.toLowerCase().includes(term));
            });
    });

    protected readonly infoText = computed(() =>
        `${this.selectedIndices().size} von ${this.allQuestions().length} Fragen ausgewählt`
    );

    protected isIndexSelected(idx: number): boolean {
        return this.selectedIndices().has(idx);
    }

    protected onSearchInput(value: string): void {
        this.searchTerm.set(value);
    }

    attemptStart(): void {
        if (this.selectedIndices().size === 0) {
            this.statusText.set('Bitte wähle mindestens eine Frage aus.');
            return;
        }
        this.statusText.set('');
        this.start.emit();
    }

    focus(): void {
        this.searchTerm.set('');
        setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 0);
    }
}
