import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Answer, Question, QuizConfig } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
    private readonly http = inject(HttpClient);

    loadConfig(): Observable<QuizConfig[]> {
        return this.http.get<QuizConfig[]>('data/config.json').pipe(
            map(quizzes => (Array.isArray(quizzes) ? quizzes : []).filter(q => q.active !== false))
        );
    }

    loadQuestions(file: string): Observable<Question[]> {
        return this.http.get<Question[]>(`data/${file}`).pipe(
            map(raw => {
                const questions = Array.isArray(raw) ? raw : [];
                return questions
                    .filter(q => Array.isArray(q.answers) && q.answers.length > 0)
                    .map(q => this.normalizeQuestion(q));
            })
        );
    }

    shuffle<T>(array: T[]): T[] {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    private normalizeQuestion(raw: Question): Question {
        const hasImage = typeof raw.imageUrl === 'string' && raw.imageUrl.trim().length > 0;
        return {
            text: typeof raw.text === 'string' ? raw.text : '',
            imageUrl: hasImage ? (raw.imageUrl as string).trim() : null,
            answers: this.shuffle(
                (Array.isArray(raw.answers) ? raw.answers : [] as Answer[])
                    .filter((a): a is Answer => a !== null && typeof a.text === 'string')
                    .map(a => ({ text: a.text, isCorrect: Boolean(a.isCorrect) }))
            ),
        };
    }
}
