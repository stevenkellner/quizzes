import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { QuizComponent } from './quiz';
import type { Question, QuizConfig } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

const mockQuestions: Question[] = [
    {
        text: 'What is Angular?',
        imageUrl: null,
        answers: [
            { text: 'A framework', isCorrect: true },
            { text: 'A database', isCorrect: false },
        ],
    },
    {
        text: 'What is TypeScript?',
        imageUrl: null,
        answers: [
            { text: 'A superset of JS', isCorrect: true },
            { text: 'A CSS preprocessor', isCorrect: false },
        ],
    },
];

const mockConfig: QuizConfig[] = [{ id: 'q1', title: 'Test Quiz', file: 'test.json', active: true }];

describe('QuizComponent', () => {
    let loadConfigImpl: () => Observable<QuizConfig[]>;
    let loadQuestionsImpl: () => Observable<Question[]>;

    beforeEach(async () => {
        vi.useFakeTimers();
        loadConfigImpl = () => of(mockConfig);
        loadQuestionsImpl = () => of(mockQuestions);

        await TestBed.configureTestingModule({
            imports: [QuizComponent],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => 'q1' } } },
                },
                {
                    provide: QuizService,
                    useValue: {
                        loadConfig: () => loadConfigImpl(),
                        loadQuestions: () => loadQuestionsImpl(),
                        shuffle: <T>(arr: T[]) => [...arr],
                    },
                },
            ],
        }).compileComponents();
    });

    afterEach(() => {
        vi.runAllTimers();
        vi.useRealTimers();
    });

    it('starts in loading state before detectChanges', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.loading()).toBe(true);
    });

    it('shows the start view after data loads', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-quiz-start')).not.toBeNull();
    });

    it('sets the quiz title after data loads', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.quizTitle()).toBe('Test Quiz Quiz');
    });

    it('shows an error when the quiz id is not found', () => {
        loadConfigImpl = () => of([{ id: 'other', title: 'X', file: 'x.json' }]);
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    });

    it('shows an error when config loading fails', () => {
        loadConfigImpl = () => throwError(() => new Error('Net error'));
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    });

    it('maxQuestions matches the number of loaded questions', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.maxQuestions()).toBe(mockQuestions.length);
    });

    it('onStart() switches the view to "question"', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(1);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.view()).toBe('question');
    });

    it('onStart() sets selectedAnswers to all-false for the first question', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(1);
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        const selected: boolean[] = fixture.componentInstance.selectedAnswers();
        expect(selected.every((v: boolean) => v === false)).toBe(true);
    });

    it('toggleAnswer() flips the selected state of one answer', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(2);
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.selectedAnswers()[0]).toBe(false);
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.toggleAnswer(0);
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.selectedAnswers()[0]).toBe(true);
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.toggleAnswer(0);
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.selectedAnswers()[0]).toBe(false);
    });

    it('onConfirm() reveals the current answer', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(1);
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.revealed()).toBe(false);
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onConfirm();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.revealed()).toBe(true);
    });

    it('onConfirm() increments score for a correct answer', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(1);
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.toggleAnswer(0);
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onConfirm();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.score()).toBe(1);
    });

    it('onConfirm() does not increment score for a wrong answer', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(1);
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.toggleAnswer(1);
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onConfirm();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.score()).toBe(0);
    });

    it('onNext() after last question switches view to "finished"', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onStart(1);
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onConfirm();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.onNext();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.view()).toBe('finished');
    });

    it('openSelectCard() switches the view to "select"', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.openSelectCard();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.view()).toBe('select');
    });

    it('backToStart() switches the view back to "start"', () => {
        const fixture = TestBed.createComponent(QuizComponent);
        fixture.detectChanges();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.openSelectCard();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        fixture.componentInstance.backToStart();
        vi.runAllTimers();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.view()).toBe('start');
    });

    describe('onKeydown()', () => {
        it('ignores non-Enter keys', () => {
            const fixture = TestBed.createComponent(QuizComponent);
            fixture.detectChanges();
            vi.runAllTimers();
            const comp = fixture.componentInstance;
            // @ts-expect-error Accessing private method for testing
            const startRef = comp.startRef()!;
            const attemptStartSpy = vi.spyOn(startRef, 'attemptStart');
            // @ts-expect-error Accessing private method for testing
            comp.onKeydown(new KeyboardEvent('keydown', { key: 'Space' }));
            expect(attemptStartSpy).not.toHaveBeenCalled();
        });

        it('ignores repeated keypresses', () => {
            const fixture = TestBed.createComponent(QuizComponent);
            fixture.detectChanges();
            vi.runAllTimers();
            const comp = fixture.componentInstance;
            // @ts-expect-error Accessing private method for testing
            const startRef = comp.startRef()!;
            const attemptStartSpy = vi.spyOn(startRef, 'attemptStart');
            // @ts-expect-error Accessing private method for testing
            comp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
            expect(attemptStartSpy).not.toHaveBeenCalled();
        });

        it('calls attemptStart on the start component when Enter is pressed in start view', () => {
            const fixture = TestBed.createComponent(QuizComponent);
            fixture.detectChanges();
            vi.runAllTimers();
            const comp = fixture.componentInstance;
            // @ts-expect-error Accessing private method for testing
            const startRef = comp.startRef()!;
            const attemptStartSpy = vi.spyOn(startRef, 'attemptStart');
            // @ts-expect-error Accessing private method for testing
            comp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(attemptStartSpy).toHaveBeenCalledTimes(1);
        });
    });
});
