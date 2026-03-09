import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { StatusMessage, WrongAnswer } from '../../../../models/quiz.model';
import { QuestionViewComponent } from '../../../../shared/components/question-view/question-view';

@Component({
    selector: 'app-quiz-finished',
    templateUrl: './quiz-finished.html',
    styleUrl: './quiz-finished.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [QuestionViewComponent],
})
export class QuizFinishedComponent {
    readonly wrongAnswers = input.required<WrongAnswer[]>();
    readonly statusMessage = input.required<StatusMessage>();

    readonly restart = output<void>();
}
