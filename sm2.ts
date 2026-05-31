


export interface FlashcardData {
    id: string;
    front: string;
    back: string;
    interval: number;
    ease: number;
    repetitions: number;
    dueDate: string;
}



export type ReviewQuality = 0 | 1 | 2;

export interface SM2Result {
    interval: number;
    ease: number;
    repetitions: number;
    dueDate: string;
}

export class SM2Engine {

    static getNewCard(id: string, front: string, back: string): FlashcardData {
        const now = new Date();
        return {
            id,
            front,
            back,
            interval: 0,
            ease: 2.5,
            repetitions: 0,
            dueDate: now.toISOString()
        };
    }

    static calculate(card: FlashcardData, rating: 0 | 1 | 2): SM2Result {
        const q = rating === 0 ? 2 : rating === 1 ? 4 : 5;
        let { repetitions, ease, interval } = card;
        if (q >= 3) {
            if (repetitions === 0) interval = 1;
            else if (repetitions === 1) interval = 6;
            else interval = Math.round(interval * ease);
            repetitions++;
        } else {
            repetitions = 0;
            interval = 1;
        }
        ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
        const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
        return { interval, ease, repetitions, dueDate };
    }
}