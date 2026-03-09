import { TestBed, ComponentFixture } from '@angular/core/testing';
import { QuizFinishedComponent } from './quiz-finished';
import type { StatusMessage, WrongAnswer } from '../../../../models/quiz.model';

const neutralStatus: StatusMessage = { text: 'Quiz beendet. Ergebnis: 100% (2/2)', kind: 'neutral' };

const wrongAnswers: WrongAnswer[] = [
    {
        question: {
            text: 'What is Angular?',
            imageUrl: null,
            answers: [
                { text: 'A framework', isCorrect: true },
                { text: 'A database', isCorrect: false },
            ],
        },
        selected: new Set([1]),
    },
];

describe('QuizFinishedComponent', () => {
    async function setup(
        wrong: WrongAnswer[] = [],
        statusMessage: StatusMessage = neutralStatus,
    ): Promise<ComponentFixture<QuizFinishedComponent>> {
        await TestBed.configureTestingModule({
            imports: [QuizFinishedComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(QuizFinishedComponent);
        fixture.componentRef.setInput('wrongAnswers', wrong);
        fixture.componentRef.setInput('statusMessage', statusMessage);
        fixture.detectChanges();
        return fixture;
    }

    it('creates successfully', async () => {
        expect((await setup()).componentInstance).toBeTruthy();
    });

    it('displays the status message text', async () => {
        const fixture = await setup();
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.textContent?.trim()).toBe(neutralStatus.text);
    });

    it('shows the "Falsche Antworten" section when wrongAnswers is non-empty', async () => {
        const fixture = await setup(wrongAnswers);
        const section = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.review-card');
        expect(section).not.toBeNull();
    });

    it('hides the "Falsche Antworten" section when wrongAnswers is empty', async () => {
        const fixture = await setup([]);
        const section = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.review-card');
        expect(section).toBeNull();
    });

    it('renders one review entry per wrong answer', async () => {
        const twoWrong: WrongAnswer[] = [
            ...wrongAnswers,
            {
                question: {
                    text: 'What is RxJS?',
                    imageUrl: null,
                    answers: [{ text: 'A library', isCorrect: true }],
                },
                selected: new Set([0]),
            },
        ];
        const fixture = await setup(twoWrong);
        const entries = fixture.nativeElement.querySelectorAll('.review-entry');
        expect(entries).toHaveLength(2);
    });

    it('clicking "Neu starten" emits restart', async () => {
        const fixture = await setup();
        const emitted: null[] = [];
        fixture.componentInstance.restart.subscribe(() => emitted.push(null));
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type=button]')!.click();
        expect(emitted).toHaveLength(1);
    });
});
