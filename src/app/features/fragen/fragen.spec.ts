import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { FragenComponent } from './fragen';
import type { Question, QuizConfig } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

const mockQuestions: Question[] = [
    {
        text: 'What is Angular?',
        imageUrl: null,
        answers: [{ text: 'A framework', isCorrect: true }, { text: 'A database', isCorrect: false }],
    },
    {
        text: 'What is React?',
        imageUrl: null,
        answers: [{ text: 'A library', isCorrect: true }],
    },
    {
        text: 'What is Vue?',
        imageUrl: null,
        answers: [{ text: 'A progressive framework', isCorrect: true }],
    },
];

const mockConfig: QuizConfig[] = [{ id: 'test', title: 'Test Quiz', file: 'test.json', active: true }];

describe('FragenComponent', () => {
    function setupTestBed(options: {
        quizId?: string;
        configs?: QuizConfig[];
        questions?: Question[];
        configError?: boolean;
        questionsError?: boolean;
    } = {}) {
        const {
            quizId = 'test',
            configs = mockConfig,
            questions = mockQuestions,
            configError = false,
            questionsError = false,
        } = options;

        TestBed.configureTestingModule({
            imports: [FragenComponent],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => quizId } } },
                },
                {
                    provide: QuizService,
                    useValue: {
                        loadConfig: () => configError
                            ? throwError(() => new Error('Config failed'))
                            : of(configs),
                        loadQuestions: () => questionsError
                            ? throwError(() => new Error('Questions failed'))
                            : of(questions),
                    },
                },
            ],
        });
    }

    it('creates successfully', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('is in loading state before detectChanges', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.loading()).toBe(true);
    });

    it('renders all questions after loading', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();
        const entries = fixture.nativeElement.querySelectorAll('article.fragen-entry');
        expect(entries).toHaveLength(3);
    });

    it('sets the page title from the quiz config', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();
        // @ts-expect-error Accessing private method for testing
        expect(fixture.componentInstance.pageTitle()).toContain('Test Quiz');
    });

    it('filters questions matching the search term', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();

        const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
        searchInput.value = 'angular';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const entries = fixture.nativeElement.querySelectorAll('article.fragen-entry');
        expect(entries).toHaveLength(1);
    });

    it('shows searchInfoText with count when filter is active', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();

        const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
        searchInput.value = 'angular';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const info = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.search-info')!;
        expect(info.textContent).toContain('1 von 3');
    });

    it('shows total question count in searchInfoText when no filter is active', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();

        const info = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.search-info')!;
        expect(info.textContent).toContain('3 Fragen insgesamt');
    });

    it('shows "Keine Ergebnisse" when the search term matches nothing', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();

        const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
        searchInput.value = 'zzz_no_match';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const noResults = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.no-results');
        expect(noResults?.textContent).toContain('Keine Ergebnisse');
    });

    it('shows an error when the config load fails', async () => {
        setupTestBed({ configError: true });
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();
        const alert = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role=alert]');
        expect(alert).not.toBeNull();
    });

    it('shows an error when quiz is not found in config', async () => {
        setupTestBed({ quizId: 'not-found', configs: [{ id: 'other', title: 'X', file: 'x.json' }] });
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();
        const alert = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role=alert]');
        expect(alert).not.toBeNull();
    });

    it('goBack() calls Location.back()', async () => {
        setupTestBed();
        await TestBed.compileComponents();
        const fixture = TestBed.createComponent(FragenComponent);
        fixture.detectChanges();

        const location = TestBed.inject(Location);
        const backSpy = vi.spyOn(location, 'back').mockImplementation(vi.fn());
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.back-link')!.click();
        expect(backSpy).toHaveBeenCalledTimes(1);
    });
});
