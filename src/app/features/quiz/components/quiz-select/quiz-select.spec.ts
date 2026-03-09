import { TestBed, ComponentFixture } from '@angular/core/testing';
import { QuizSelectComponent } from './quiz-select';
import type { Question } from '../../../../models/quiz.model';

const mockQuestions: Question[] = [
    { text: 'Angular question', imageUrl: null, answers: [{ text: 'A', isCorrect: true }] },
    { text: 'React question', imageUrl: null, answers: [{ text: 'B', isCorrect: true }] },
    {
        text: 'Vue question',
        imageUrl: null,
        answers: [{ text: 'CompositionAPI', isCorrect: false }, { text: 'OptionsAPI', isCorrect: true }],
    },
];

describe('QuizSelectComponent', () => {
    async function setup(
        questions = mockQuestions,
        selected = new Set<number>(),
    ): Promise<ComponentFixture<QuizSelectComponent>> {
        await TestBed.configureTestingModule({
            imports: [QuizSelectComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(QuizSelectComponent);
        fixture.componentRef.setInput('allQuestions', questions);
        fixture.componentRef.setInput('selectedIndices', selected);
        fixture.detectChanges();
        return fixture;
    }

    it('creates successfully', async () => {
        expect((await setup()).componentInstance).toBeTruthy();
    });

    it('renders all questions initially', async () => {
        const fixture = await setup();
        expect(fixture.nativeElement.querySelectorAll('.select-entry')).toHaveLength(3);
    });

    it('shows selection count in the info text', async () => {
        const fixture = await setup(mockQuestions, new Set([0, 2]));
        const info = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.select-info')!;
        expect(info.textContent).toContain('2 von 3');
    });

    it('filters entries whose question text matches the search term', async () => {
        const fixture = await setup();
        const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
        searchInput.value = 'angular';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.select-entry')).toHaveLength(1);
    });

    it('filters entries by answer text as well', async () => {
        const fixture = await setup();
        const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
        searchInput.value = 'compositionapi';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        // Only Vue question has answer with "CompositionAPI"
        expect(fixture.nativeElement.querySelectorAll('.select-entry')).toHaveLength(1);
    });

    it('shows "no results" message when the search term matches nothing', async () => {
        const fixture = await setup();
        const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
        searchInput.value = 'zzz_no_match_xyz';
        searchInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.select-no-results')).not.toBeNull();
    });

    it('shows selected class on selected entries', async () => {
        const fixture = await setup(mockQuestions, new Set([1]));
        const entries = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.select-entry');
        expect(entries[0].classList).not.toContain('selected');
        expect(entries[1].classList).toContain('selected');
        expect(entries[2].classList).not.toContain('selected');
    });

    it('clicking an entry emits toggleEntry with its original index', async () => {
        const fixture = await setup();
        const emitted: number[] = [];
        fixture.componentInstance.toggleEntry.subscribe((i: number) => emitted.push(i));
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.select-entry')[2].click();
        expect(emitted).toEqual([2]);
    });

    it('clicking "Alle" emits selectAll', async () => {
        const fixture = await setup();
        const emitted: null[] = [];
        fixture.componentInstance.selectAll.subscribe(() => emitted.push(null));
        const btns = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.select-btn-group button');
        btns[0].click();
        expect(emitted).toHaveLength(1);
    });

    it('clicking "Keine" emits deselectAll', async () => {
        const fixture = await setup();
        const emitted: null[] = [];
        fixture.componentInstance.deselectAll.subscribe(() => emitted.push(null));
        const btns = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.select-btn-group button');
        btns[1].click();
        expect(emitted).toHaveLength(1);
    });

    it('clicking "ZurÃ¼ck" emits back', async () => {
        const fixture = await setup();
        const emitted: null[] = [];
        fixture.componentInstance.back.subscribe(() => emitted.push(null));
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.back-btn')!.click();
        expect(emitted).toHaveLength(1);
    });

    it('attemptStart shows error status when no questions are selected', async () => {
        const fixture = await setup(mockQuestions, new Set<number>());
        fixture.componentInstance.attemptStart();
        fixture.detectChanges();
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.textContent).toContain('mindestens eine');
    });

    it('attemptStart emits startQuiz when questions are selected', async () => {
        const fixture = await setup(mockQuestions, new Set([0, 1]));
        const emitted: null[] = [];
        fixture.componentInstance.startQuiz.subscribe(() => emitted.push(null));
        fixture.componentInstance.attemptStart();
        expect(emitted).toHaveLength(1);
    });

    it('start button is disabled when no questions are selected', async () => {
        const fixture = await setup(mockQuestions, new Set<number>());
        const startBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!;
        expect(startBtn.disabled).toBe(true);
    });

    it('start button is enabled when at least one question is selected', async () => {
        const fixture = await setup(mockQuestions, new Set([0]));
        const startBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!;
        expect(startBtn.disabled).toBe(false);
    });
});
