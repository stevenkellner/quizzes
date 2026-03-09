import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    output,
    input,
    viewChild,
} from '@angular/core';
import { Question, StatusMessage } from '../../../../models/quiz.model';

@Component({
    selector: 'app-quiz-question',
    templateUrl: './quiz-question.html',
    styleUrl: './quiz-question.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizQuestionComponent {
    readonly question = input.required<Question>();
    readonly selectedAnswers = input.required<boolean[]>();
    readonly revealed = input.required<boolean>();
    readonly isLastQuestion = input.required<boolean>();
    readonly statusMessage = input.required<StatusMessage>();

    readonly toggleAnswer = output<number>();
    readonly confirm = output<void>();
    readonly next = output<void>();

    private readonly answersRef = viewChild<ElementRef<HTMLElement>>('answersRef');

    protected readonly actionButtonText = computed(() =>
        !this.revealed()
            ? 'Antwort bestätigen'
            : this.isLastQuestion()
              ? 'Quiz beenden'
              : 'Nächste Frage'
    );

    focus(): void {
        setTimeout(() => {
            this.answersRef()?.nativeElement.querySelector<HTMLElement>('label')?.focus();
        }, 0);
    }

    onAction(): void {
        if (!this.revealed()) {
            this.confirm.emit();
        } else {
            this.next.emit();
        }
    }

    protected onImageError(img: HTMLImageElement): void {
        img.hidden = true;
    }
}
