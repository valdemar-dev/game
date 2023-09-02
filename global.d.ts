
interface Character {
    name: string;
    description: string;
    attack: number;
    defence: number;
    baseHealth: number;
    moves: string[];
};

interface ExtendedCharacter extends Character {
    health: number;
};

interface CharacterList {
    [key: string]: Character;
};

interface Game {
    player: {
        id: string;
        deck: Array<ExtendedCharacter>;
        mana: number;
    };
    cpu: {
        id: string;
        deck: Array<ExtendedCharacter>;
        mana: number;
    };
    isPlayerTurn: boolean;
    token: string;
    turnCount: number;
};
