import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuizService } from './quiz.service';
import type { QuizConfig, Question } from '../models/quiz.model';

describe('QuizService', () => {
    let service: QuizService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(QuizService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    describe('loadConfig()', () => {
        it('makes a GET request to data/config.json', () => {
            service.loadConfig().subscribe();
            const req = httpMock.expectOne('data/config.json');
            expect(req.request.method).toBe('GET');
            req.flush([]);
        });

        it('returns active quizzes and quizzes without active property', () => {
            const configs: QuizConfig[] = [
                { id: '1', title: 'A', file: 'a.json', active: true },
                { id: '2', title: 'B', file: 'b.json', active: false },
                { id: '3', title: 'C', file: 'c.json' },
            ];
            let result: QuizConfig[] = [];
            service.loadConfig().subscribe(c => (result = c));
            httpMock.expectOne('data/config.json').flush(configs);
            expect(result.map(c => c.id)).toEqual(['1', '3']);
        });

        it('returns empty array for a null response', () => {
            let result: QuizConfig[] = [];
            service.loadConfig().subscribe(c => (result = c));
            httpMock.expectOne('data/config.json').flush(null);
            expect(result).toEqual([]);
        });

        it('returns empty array for a non-array response', () => {
            let result: QuizConfig[] = [];
            service.loadConfig().subscribe(c => (result = c));
            httpMock.expectOne('data/config.json').flush('invalid');
            expect(result).toEqual([]);
        });
    });

    describe('loadQuestions()', () => {
        it('makes a GET request to data/<file>', () => {
            service.loadQuestions('mta.json').subscribe();
            const req = httpMock.expectOne('data/mta.json');
            expect(req.request.method).toBe('GET');
            req.flush([]);
        });

        it('filters out questions with an empty answers array', () => {
            let result: Question[] = [];
            service.loadQuestions('f.json').subscribe(q => (result = q));
            httpMock.expectOne('data/f.json').flush([
                { text: 'Q1', imageUrl: null, answers: [] },
                { text: 'Q2', imageUrl: null, answers: [{ text: 'A', isCorrect: true }] },
            ]);
            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Q2');
        });

        it('normalizes an empty imageUrl string to null', () => {
            let result: Question[] = [];
            service.loadQuestions('f.json').subscribe(q => (result = q));
            httpMock.expectOne('data/f.json').flush([
                { text: 'Q', imageUrl: '', answers: [{ text: 'A', isCorrect: true }] },
            ]);
            expect(result[0].imageUrl).toBeNull();
        });

        it('normalizes a whitespace-only imageUrl to null', () => {
            let result: Question[] = [];
            service.loadQuestions('f.json').subscribe(q => (result = q));
            httpMock.expectOne('data/f.json').flush([
                { text: 'Q', imageUrl: '   ', answers: [{ text: 'A', isCorrect: true }] },
            ]);
            expect(result[0].imageUrl).toBeNull();
        });

        it('trims whitespace from a valid imageUrl', () => {
            let result: Question[] = [];
            service.loadQuestions('f.json').subscribe(q => (result = q));
            httpMock.expectOne('data/f.json').flush([
                { text: 'Q', imageUrl: '  img.png  ', answers: [{ text: 'A', isCorrect: true }] },
            ]);
            expect(result[0].imageUrl).toBe('img.png');
        });

        it('defaults isCorrect to false when the property is missing', () => {
            let result: Question[] = [];
            service.loadQuestions('f.json').subscribe(q => (result = q));
            httpMock.expectOne('data/f.json').flush([
                { text: 'Q', imageUrl: null, answers: [{ text: 'A' }] },
            ]);
            expect(result[0].answers[0].isCorrect).toBe(false);
        });

        it('returns empty array for a null response', () => {
            let result: Question[] = [];
            service.loadQuestions('f.json').subscribe(q => (result = q));
            httpMock.expectOne('data/f.json').flush(null);
            expect(result).toEqual([]);
        });
    });

    describe('shuffle()', () => {
        it('returns a new array containing the same elements', () => {
            const arr = [1, 2, 3, 4, 5];
            const result = service.shuffle(arr);
            expect(result).not.toBe(arr);
            expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
        });

        it('does not mutate the original array', () => {
            const arr = [10, 20, 30];
            service.shuffle(arr);
            expect(arr).toEqual([10, 20, 30]);
        });

        it('returns an empty array for an empty input', () => {
            expect(service.shuffle([])).toEqual([]);
        });

        it('returns a single-element array unchanged', () => {
            expect(service.shuffle([99])).toEqual([99]);
        });
    });
});
