


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

    static getNewCard(id: string, font: string, back: string): FlashcardData {
        const now = new Date();
        return {
            id,
            font,
            back,
            interval: 0,
            ease: 2.5,
            repetitions: 0,
            dueDate: now.toISOString()
        };
    }
}