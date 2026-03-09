import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizStartComponent } from './quiz-start';

describe('QuizStartComponent', () => {
    async function setup(
        maxQuestions = 10,
        defaultCount = 5,
        quizId = 'q1',
    ): Promise<ComponentFixture<QuizStartComponent>> {
        await TestBed.configureTestingModule({
            imports: [QuizStartComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        const fixture = TestBed.createComponent(QuizStartComponent);
        fixture.componentRef.setInput('maxQuestions', maxQuestions);
        fixture.componentRef.setInput('defaultCount', defaultCount);
        fixture.componentRef.setInput('quizId', quizId);
        fixture.detectChanges();
        return fixture;
    }

    it('creates successfully', async () => {
        const fixture = await setup();
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('sets the count input default value to defaultCount', async () => {
        const fixture = await setup(10, 7);
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        expect(Number(input.value)).toBe(7);
    });

    it('sets the input max attribute to maxQuestions', async () => {
        const fixture = await setup(15, 5);
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        expect(Number(input.max)).toBe(15);
    });

    it('attemptStart emits startQuiz with the default count when unchanged', async () => {
        const fixture = await setup(10, 5);
        const emitted: number[] = [];
        fixture.componentInstance.startQuiz.subscribe((v: number) => emitted.push(v));
        fixture.componentInstance.attemptStart();
        expect(emitted).toEqual([5]);
    });

    it('attemptStart emits startQuiz with the value entered in the input', async () => {
        const fixture = await setup(10, 5);
        const emitted: number[] = [];
        fixture.componentInstance.startQuiz.subscribe((v: number) => emitted.push(v));
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        input.value = '3';
        fixture.componentInstance.attemptStart();
        expect(emitted).toEqual([3]);
    });

    it('attemptStart shows status text for a count exceeding maxQuestions', async () => {
        const fixture = await setup(10, 5);
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        input.value = '15';
        fixture.componentInstance.attemptStart();
        fixture.detectChanges();
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.textContent?.trim()).toContain('1 und 10');
    });

    it('attemptStart shows status text for a count below 1', async () => {
        const fixture = await setup(10, 5);
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        input.value = '0';
        fixture.componentInstance.attemptStart();
        fixture.detectChanges();
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.textContent?.trim()).toContain('1 und 10');
    });

    it('attemptStart shows status text for a non-numeric value', async () => {
        const fixture = await setup(10, 5);
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        input.value = 'abc';
        fixture.componentInstance.attemptStart();
        fixture.detectChanges();
        const status = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.status')!;
        expect(status.textContent?.trim()).not.toBe('');
    });

    it('does not emit startQuiz for an invalid count', async () => {
        const fixture = await setup(10, 5);
        const emitted: number[] = [];
        fixture.componentInstance.startQuiz.subscribe((v: number) => emitted.push(v));
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=number]')!;
        input.value = '99';
        fixture.componentInstance.attemptStart();
        expect(emitted).toHaveLength(0);
    });

    it('clicking the Starten button calls attemptStart', async () => {
        const fixture = await setup(10, 5);
        const emitted: number[] = [];
        fixture.componentInstance.startQuiz.subscribe((v: number) => emitted.push(v));
        const startBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.actions button[type=button]')!;
        startBtn.click();
        expect(emitted).toHaveLength(1);
    });

    it('clicking "Fragen manuell auswÃ¤hlen" emits openSelect', async () => {
        const fixture = await setup();
        const emitted: null[] = [];
        fixture.componentInstance.openSelect.subscribe(() => emitted.push(null));
        const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.secondary-btn')!;
        btn.click();
        expect(emitted).toHaveLength(1);
    });
});
