interface Ability {
    use: Function;
    name: string;
    id: string;
    trigger: string;
};

interface Game {
    token: string;
    isGameOver: boolean; 
    turnCount: number;
    isPlayerTurn: boolean;

    player: {
        name: string;
        deck: GameCharacter[];
        mana: number;
        isTurnComplete: boolean;
    };

    cpu: {
        name: string;
        deck: GameCharacter[];
        mana: number;
        isTurnComplete: boolean;
    };
}

interface Character {
    name: string,
    description: string,
    ivs: {
        attack: number,
        defence: number,
        health: number,
    },
    moves: Array<number>
    type: string,
    ability: string;
};

interface CharacterListData {
    [Key: string]: Character
}

interface DBCharacter { 
    characterId: string, 
    attack: number, 
    defence: number, 
    health: number, 
    moves: Array<number>, 
    exp: number;
    level: number;
}

interface GameCharacter {
    name: string;
    description: string;
    ivs: {
        attack: number;
        defence: number;
        health: number;
    };
    characterId: string;
    attack: number;
    defence: number;
    health: number;
    maxHp: number;
    ability: Ability;
    moves: Array<number>
    isFainted: boolean;
    exp: number;
    level: number;
}

interface Move {
    type: string;
    name: string;
    power: number;
    manaCost: number;
    description: string;
};

interface MoveList {
    [key: string]: Move;
};
