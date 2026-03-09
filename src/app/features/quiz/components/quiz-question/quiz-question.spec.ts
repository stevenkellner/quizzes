import { TestBed, ComponentFixture } from '@angular/core/testing';
import { QuizQuestionComponent } from './quiz-question';
import type { Question, StatusMessage } from '../../../../models/quiz.model';

const mockQuestion: Question = {
    text: 'What is TypeScript?',
    imageUrl: null,
    answers: [
        { text: 'A superset of JavaScript', isCorrect: true },
        { text: 'A CSS preprocessor', isCorrect: false },
    ],
};

const neutralStatus: StatusMessage = { text: '', kind: 'neutral' };
const correctStatus: StatusMessage = { text: 'Richtig', kind: 'correct' };
const incorrectStatus: StatusMessage = { text: 'Falsch', kind: 'incorrect' };

describe('QuizQuestionComponent', () => {
    async function setup(overrides: {
        question?: Question;
        selectedAnswers?: boolean[];
        revealed?: boolean;
        isLastQuestion?: boolean;
        statusMessage?: StatusMessage;
    } = {}): Promise<ComponentFixture<QuizQuestionComponent>> {
        await TestBed.configureTestingModule({
            imports: [QuizQuestionComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(QuizQuestionComponent);
        fixture.componentRef.setInput('question', overrides.question ?? mockQuestion);
        fixture.componentRef.setInput('selectedAnswers', overrides.selectedAnswers ?? [false, false]);
        fixture.componentRef.setInput('revealed', overrides.revealed ?? false);
        fixture.componentRef.setInput('isLastQuestion', overrides.isLastQuestion ?? false);
        fixture.componentRef.setInput('statusMessage', overrides.statusMessage ?? neutralStatus);
        fixture.detectChanges();
        return fixture;
    }

    it('creates successfully', async () => {
        expect((await setup()).componentInstance).toBeTruthy();
    });

    // â”€â”€â”€ action button label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('action button text', () => {
        it('shows "Antwort bestätigen" before reveal', async () => {
            const fixture = await setup({ revealed: false });
            const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!;
            expect(btn.textContent?.trim()).toBe('Antwort bestätigen');
        });

        it('shows "Nächste Frage" after reveal when not the last question', async () => {
            const fixture = await setup({ revealed: true, isLastQuestion: false });
            const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!;
            expect(btn.textContent?.trim()).toBe('Nächste Frage');
        });

        it('shows "Quiz beenden" after reveal on the last question', async () => {
            const fixture = await setup({ revealed: true, isLastQuestion: true });
            const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!;
            expect(btn.textContent?.trim()).toBe('Quiz beenden');
        });
    });

    // â”€â”€â”€ onAction() dispatch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('onAction()', () => {
        it('emits confirm before reveal', async () => {
            const fixture = await setup({ revealed: false });
            const emitted: null[] = [];
            fixture.componentInstance.confirm.subscribe(() => emitted.push(null));
            fixture.componentInstance.onAction();
            expect(emitted).toHaveLength(1);
        });

        it('emits next after reveal', async () => {
            const fixture = await setup({ revealed: true });
            const emitted: null[] = [];
            fixture.componentInstance.next.subscribe(() => emitted.push(null));
            fixture.componentInstance.onAction();
            expect(emitted).toHaveLength(1);
        });

        it('does not emit confirm after reveal', async () => {
            const fixture = await setup({ revealed: true });
            const emitted: null[] = [];
            fixture.componentInstance.confirm.subscribe(() => emitted.push(null));
            fixture.componentInstance.onAction();
            expect(emitted).toHaveLength(0);
        });

        it('does not emit next before reveal', async () => {
            const fixture = await setup({ revealed: false });
            const emitted: null[] = [];
            fixture.componentInstance.next.subscribe(() => emitted.push(null));
            fixture.componentInstance.onAction();
            expect(emitted).toHaveLength(0);
        });
    });

    // â”€â”€â”€ status message display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    it('displays the status message text', async () => {
        const fixture = await setup({ statusMessage: correctStatus });
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.textContent?.trim()).toBe('Richtig');
    });

    it('applies the correct CSS class to the correct status', async () => {
        const fixture = await setup({ statusMessage: correctStatus });
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.classList).toContain('correct');
    });

    it('applies the incorrect CSS class to the incorrect status', async () => {
        const fixture = await setup({ statusMessage: incorrectStatus });
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.classList).toContain('incorrect');
    });

    // â”€â”€â”€ button click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    it('clicking the action button emits confirm before reveal', async () => {
        const fixture = await setup({ revealed: false });
        const emitted: null[] = [];
        fixture.componentInstance.confirm.subscribe(() => emitted.push(null));
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!.click();
        expect(emitted).toHaveLength(1);
    });

    it('clicking the action button emits next after reveal', async () => {
        const fixture = await setup({ revealed: true });
        const emitted: null[] = [];
        fixture.componentInstance.next.subscribe(() => emitted.push(null));
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!.click();
        expect(emitted).toHaveLength(1);
    });

    // â”€â”€â”€ toggleAnswer passthrough â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    it('passes toggleAnswer events up from the question view', async () => {
        const fixture = await setup({ revealed: false });
        const emitted: number[] = [];
        fixture.componentInstance.toggleAnswer.subscribe((i: number) => emitted.push(i));
        const checkbox = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=checkbox]')!;
        checkbox.dispatchEvent(new Event('change'));
        expect(emitted).toEqual([0]);
    });
});
