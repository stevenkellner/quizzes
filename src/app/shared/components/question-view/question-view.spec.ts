import { TestBed, ComponentFixture } from '@angular/core/testing';
import { QuestionViewComponent } from './question-view';
import type { Question } from '../../../models/quiz.model';

const mockQuestion: Question = {
    text: 'What is 2+2?',
    imageUrl: null,
    answers: [
        { text: 'Four', isCorrect: true },
        { text: 'Three', isCorrect: false },
        { text: 'Five', isCorrect: false },
    ],
};

describe('QuestionViewComponent', () => {
    async function setupComponent(
        inputs: Record<string, unknown> = {},
    ): Promise<ComponentFixture<QuestionViewComponent>> {
        await TestBed.configureTestingModule({
            imports: [QuestionViewComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(QuestionViewComponent);
        fixture.componentRef.setInput('question', mockQuestion);
        for (const [key, val] of Object.entries(inputs)) {
            fixture.componentRef.setInput(key, val);
        }
        fixture.detectChanges();
        return fixture;
    }

    it('creates successfully', async () => {
        const fixture = await setupComponent();
        expect(fixture.componentInstance).toBeTruthy();
    });

    // ─── display mode (default) ───────────────────────────────────────────────

    describe('display mode (default)', () => {
        it('renders the question text', async () => {
            const fixture = await setupComponent();
            const text = (fixture.nativeElement as HTMLElement).querySelector('.question-text')!.textContent;
            expect(text).toContain('What is 2+2?');
        });

        it('prefixes question text with number when questionNumber is set', async () => {
            const fixture = await setupComponent({ questionNumber: 3 });
            const text = (fixture.nativeElement as HTMLElement).querySelector('.question-text')!.textContent;
            expect(text).toContain('3.');
        });

        it('highlights the searchTerm with <mark> tags', async () => {
            const fixture = await setupComponent({ searchTerm: '2+2' });
            const mark = (fixture.nativeElement as HTMLElement).querySelector('mark');
            expect(mark).not.toBeNull();
            expect(mark!.textContent).toBe('2+2');
        });

        it('renders all answers', async () => {
            const fixture = await setupComponent();
            const answers = (fixture.nativeElement as HTMLElement).querySelectorAll('.answer');
            expect(answers).toHaveLength(3);
        });

        it('applies the correct class to correct answers', async () => {
            const fixture = await setupComponent();
            const answers = (fixture.nativeElement as HTMLElement).querySelectorAll('.answer');
            expect(answers[0].classList).toContain('correct');
            expect(answers[1].classList).not.toContain('correct');
        });

        it('does not apply the incorrect class in display mode', async () => {
            const fixture = await setupComponent();
            const answers = (fixture.nativeElement as HTMLElement).querySelectorAll('.answer');
            answers.forEach(a => expect(a.classList).not.toContain('incorrect'));
        });

        it('shows a marker span for each answer in display mode', async () => {
            const fixture = await setupComponent();
            const markers = (fixture.nativeElement as HTMLElement).querySelectorAll('.marker');
            expect(markers).toHaveLength(3);
        });

        it('uses the fallback text when question text is empty', async () => {
            const q: Question = { ...mockQuestion, text: '' };
            await TestBed.configureTestingModule({ imports: [QuestionViewComponent] }).compileComponents();
            const fixture = TestBed.createComponent(QuestionViewComponent);
            fixture.componentRef.setInput('question', q);
            fixture.detectChanges();
            expect((fixture.nativeElement as HTMLElement).querySelector('.question-text')!.textContent).toContain('(Kein Fragetext)');
        });
    });

    // ─── interactive mode ─────────────────────────────────────────────────────

    describe('interactive mode', () => {
        it('renders a checkbox for each answer', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, false, false],
                revealed: false,
            });
            const checkboxes = (fixture.nativeElement as HTMLElement).querySelectorAll('input[type=checkbox]');
            expect(checkboxes).toHaveLength(3);
        });

        it('checks the boxes matching selectedAnswers', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [true, false, true],
                revealed: false,
            });
            const cbs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type=checkbox]');
            expect(cbs[0].checked).toBe(true);
            expect(cbs[1].checked).toBe(false);
            expect(cbs[2].checked).toBe(true);
        });

        it('disables all checkboxes when revealed', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, false, false],
                revealed: true,
            });
            const cbs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type=checkbox]');
            cbs.forEach(cb => expect(cb.disabled).toBe(true));
        });

        it('emits toggleAnswer with the answer index when a checkbox changes', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, false, false],
                revealed: false,
            });
            const emitted: number[] = [];
            fixture.componentInstance.toggleAnswer.subscribe((i: number) => emitted.push(i));
            const cbs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type=checkbox]');
            cbs[1].dispatchEvent(new Event('change'));
            expect(emitted).toEqual([1]);
        });

        it('applies the correct class to correct answers after reveal', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, false, false],
                revealed: true,
            });
            const labels = (fixture.nativeElement as HTMLElement).querySelectorAll('label.answer-item');
            expect(labels[0].classList).toContain('correct');
            expect(labels[1].classList).not.toContain('correct');
        });

        it('applies incorrect only to selected wrong answers after reveal', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, true, false],
                revealed: true,
            });
            const labels = (fixture.nativeElement as HTMLElement).querySelectorAll('label.answer-item');
            expect(labels[0].classList).not.toContain('incorrect'); // correct answer, not selected
            expect(labels[1].classList).toContain('incorrect');     // wrong answer, selected
            expect(labels[2].classList).not.toContain('incorrect'); // wrong answer, not selected
        });

        it('does not apply incorrect to unselected wrong answers after reveal', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, false, false],
                revealed: true,
            });
            const labels = (fixture.nativeElement as HTMLElement).querySelectorAll('label.answer-item');
            labels.forEach(l => expect(l.classList).not.toContain('incorrect'));
        });

        it('does not show marker spans in interactive mode', async () => {
            const fixture = await setupComponent({
                mode: 'interactive',
                selectedAnswers: [false, false, false],
                revealed: false,
            });
            expect((fixture.nativeElement as HTMLElement).querySelectorAll('.marker')).toHaveLength(0);
        });
    });

    // ─── review mode ──────────────────────────────────────────────────────────

    describe('review mode', () => {
        it('applies the correct class to correct answers', async () => {
            const fixture = await setupComponent({
                mode: 'review',
                selectedInReview: new Set<number>(),
            });
            const answers = (fixture.nativeElement as HTMLElement).querySelectorAll('.answer');
            expect(answers[0].classList).toContain('correct');
        });

        it('applies incorrect only to selected wrong answers', async () => {
            const fixture = await setupComponent({
                mode: 'review',
                selectedInReview: new Set<number>([1]),
            });
            const answers = (fixture.nativeElement as HTMLElement).querySelectorAll('.answer');
            expect(answers[1].classList).toContain('incorrect');
            expect(answers[2].classList).not.toContain('incorrect');
        });

        it('does not show marker spans in review mode', async () => {
            const fixture = await setupComponent({
                mode: 'review',
                selectedInReview: new Set<number>(),
            });
            expect((fixture.nativeElement as HTMLElement).querySelectorAll('.marker')).toHaveLength(0);
        });
    });

    // ─── HTML escaping ────────────────────────────────────────────────────────

    describe('highlightHtml() HTML escaping', () => {
        it('escapes HTML special characters in question text', async () => {
            const q: Question = { ...mockQuestion, text: 'A & B <script>' };
            await TestBed.configureTestingModule({ imports: [QuestionViewComponent] }).compileComponents();
            const fixture = TestBed.createComponent(QuestionViewComponent);
            fixture.componentRef.setInput('question', q);
            fixture.componentRef.setInput('searchTerm', 'B');
            fixture.detectChanges();
            const html = (fixture.nativeElement as HTMLElement).querySelector('.question-text')!.innerHTML;
            expect(html).toContain('&amp;');
            expect(html).not.toContain('<script>');
        });
    });

    // ─── image error handling ─────────────────────────────────────────────────

    describe('image error handling', () => {
        it('hides the image element on error in interactive mode', async () => {
            const q: Question = { ...mockQuestion, imageUrl: 'broken.png' };
            await TestBed.configureTestingModule({ imports: [QuestionViewComponent] }).compileComponents();
            const fixture = TestBed.createComponent(QuestionViewComponent);
            fixture.componentRef.setInput('question', q);
            fixture.componentRef.setInput('mode', 'interactive');
            fixture.componentRef.setInput('selectedAnswers', [false, false, false]);
            fixture.componentRef.setInput('revealed', false);
            fixture.detectChanges();

            const img = (fixture.nativeElement as HTMLElement).querySelector('img') as HTMLImageElement;
            expect(img).not.toBeNull();
            img.dispatchEvent(new Event('error'));
            expect(img.hidden).toBe(true);
        });
    });
});
