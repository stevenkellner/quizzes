import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.HomeComponent),
    },
    {
        path: 'quiz/:id',
        loadComponent: () => import('./features/quiz/quiz').then(m => m.QuizComponent),
    },
    {
        path: 'fragen/:id',
        loadComponent: () => import('./features/fragen/fragen').then(m => m.FragenComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
