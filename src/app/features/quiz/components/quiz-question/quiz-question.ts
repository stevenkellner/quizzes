import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    viewChild,
} from '@angular/core';
import { Question, StatusMessage } from '../../../../models/quiz.model';
import { QuestionViewComponent } from '../../../../shared/components/question-view/question-view';

@Component({
    selector: 'app-quiz-question',
    templateUrl: './quiz-question.html',
    styleUrl: './quiz-question.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [QuestionViewComponent],
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

    private readonly questionViewRef = viewChild(QuestionViewComponent);

    protected readonly actionButtonText = computed(() =>
        !this.revealed()
            ? 'Antwort bestätigen'
            : this.isLastQuestion()
              ? 'Quiz beenden'
              : 'Nächste Frage'
    );

    onAction(): void {
        if (!this.revealed()) {
            this.confirm.emit();
        } else {
            this.next.emit();
        }
    }
}

