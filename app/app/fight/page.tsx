"use client";

import { io, Socket } from "socket.io-client";
import { useState, useRef, useEffect } from "react";
import crypto from "crypto";
import { useRouter } from "next/navigation";
import Image from "next/image";
import moveListData from "@/../../../lib/moves.json";
const moveList: MoveList = moveListData;

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

export default function Fight() {
    const router = useRouter();

    const cointossRef = useRef<any>();
    const moveModalRef = useRef<any>();
    const targetSelectorRef = useRef<any>();
    const manaClickRef = useRef<any>();

    const [timerRunning, setTimerRunning] = useState<boolean>(false);
    const [selectedTarget, setSelectedTarget] = useState<number>();
    const [selectedCharacter, setSelectedCharacter] = useState<number>();

    const manaClicks = useRef<number>(0);
    const [manaClickCountDisplayValue, setManaClickCountDisplayValue] = useState<number>(0);

    const [selectedMove, setSelectedMove] = useState<number>(0);
    
    const [gameData, setGameData] = useState<Game>();
    const [cointossGuess, setCointossGuess] = useState<string>("");

    // Create a ref to hold the socket instance
    const socketRef = useRef<any>(null);

    const showCointossRef = () => {
        cointossRef.current!.showModal();
    };

    const startTimer = () => {
        if (!timerRunning) {
            setTimerRunning(true);

            manaClicks.current = 0;

            setManaClickCountDisplayValue(0);

            setTimeout(() => {
                const gameToken = localStorage.getItem("gameToken");

                socketRef.current.emit("manaRushScore", {gameToken: gameToken, manaClicks: manaClicks.current});

                manaClickRef.current.close();

                setTimerRunning(false);
            }, 5000);
        }
      };

    useEffect(() => {
        // Retrieve the game token from localStorage
        const gameToken = localStorage.getItem("gameToken");

        // Check if gameToken exists
        if (gameToken) {
        // Create or reuse the socket instance
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3001", {
                query: {
                    gameToken: gameToken,
                },
            });

            socketRef.current.on("connect", () => {
                socketRef.current.emit("gameDataRequest");
            });

            socketRef.current.on("gameData", (game: Game) => {
                setGameData(game);

                // display coin toss to determine who goes first
                if (game.turnCount === 0) {
                    showCointossRef();

                    socketRef.current.once("gameData", (game: Game) => {
                        if (game.isPlayerTurn === false) {
                            alert("You were wrong! The CPU goes first!");
                        } else {
                            alert("You were right! You get to go first!");
                        }

                        cointossRef.current.close();
                    });
                }

                if (game.turnCount % 2 !== 0 && game.turnCount > 0) {
                    socketRef.current.emit("manaRushRequest", gameToken);
                }
            });

            socketRef.current.on("manaRush", () => {
                manaClickRef.current.showModal();

                if (!timerRunning) {
                    startTimer();
                }
            });
        }
        }
    }, []);

    const quitGame = () => {
        const gameToken = localStorage.getItem("gameToken");

        if (!gameToken) return alert("Can't quit game.");

        socketRef.current.emit("quitGame", gameToken);
    };

    const handleCointoss = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const gameToken = localStorage.getItem("gameToken") || "";

        socketRef.current.emit("gameCointoss", {gameToken: gameToken, choice: cointossGuess});
    };

    const mapCharacters = (deck: Array<ExtendedCharacter> | undefined, deckHolder: string,) => {
        if (!deck) {
            return (<></>)
        }

        if (deck.length < 1) return (
            <></>
        )

        return deck!.map((character, index) => {
            let className = "flex flex-col gap-2 w-fit";

            if (deckHolder === "player" && selectedCharacter === index) {
                className += " animateCharacter";
            } else if (deckHolder === "cpu" && selectedTarget === index) {
                className += " animateCharacter";
            }

            const handleClick = () => {
                if (gameData?.isPlayerTurn === false) return;

                if (deckHolder === "player") {
                    if (selectedCharacter === index) {
                        setSelectedCharacter(3);
                        moveModalRef.current.close();
                    } else {
                        moveModalRef.current.showModal();
                        setSelectedCharacter(index);
                    }

                    return;
                } else {
                    return setSelectedTarget(index);
                }
            };

            return (
                <div 
                    key={`${crypto.randomBytes(8).toString("hex")}`} 
                    className={className}
                    onClick={() => handleClick()}
                >
                    <h2>{character.name}</h2>
                    <Image
                        src={"/user.svg"}
                        height="60"
                        width="60"
                        alt="Player icon"
                    />
                    <ul>
                        <li>
                            Attack: {character.attack}
                        </li>
                        <li>
                            HP: {character.health}
                        </li>
                        <li>
                            Defence: {character.defence}
                        </li>
                    </ul>
                </div>
            )
        })
    };

    const mapMoves = (characterIndex: number) => {
        const character = gameData?.player.deck[characterIndex];

        if (!character) {return<></>};

        const handleClick = (moveIndex: number) => {
            moveModalRef.current.close();
            targetSelectorRef.current.showModal();

            setSelectedMove(moveIndex);
        };

        return character.moves.map((move, index) => {
            const moveInList: Move = moveList[move];

            if (!moveInList) return (<></>);

            return (
                <div 
                    key={`${crypto.randomBytes(16).toString("hex")}`} 
                    className={`p-4 ${gameData?.player.mana < moveInList.manaCost ? "opacity-30" : ""}`}
                    onClick={() => {
                        if (moveInList.manaCost > gameData.player.mana) {
                            return;
                        }
                        handleClick(index)
                    }}
                >
                    <p className="text-xl">{moveInList.name}</p>
                    <p>{moveInList.description}</p>
                    <span className="text-sm">Cost: {moveInList.manaCost}</span>
                </div>
            )
        })
    };

    const attack = (index: number) => {
        setSelectedCharacter(undefined);

        targetSelectorRef.current.close();

        const gameToken = localStorage.getItem("gameToken");
        if (!gameToken) return;

        const data = {
            gameToken,
            moveIndex: selectedMove,
            characterIndex: selectedCharacter,
            targetIndex: index,
        };

        socketRef.current.emit("playerAttack", data);
    };

    return (
        <div> 
            <div>
                <h1>Game</h1>
                <p>Is player turn? {`${gameData?.isPlayerTurn}`}</p>
                <button onClick={() => {quitGame()}}>Quit game</button>
                <p>Turn count: {gameData?.turnCount}</p>

                <div className="h-10"></div>
                <div className="h-10"></div>

                <div className="flex w-full items-center flex-col gap-10">
                    <div>
                        <h2 className="text-2xl">CPU</h2>
                        <div className="flex flex-row gap-5">
                            {mapCharacters(gameData?.cpu?.deck, "cpu")}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl">Player</h2>
                        <p>Mana: {gameData?.player.mana}</p>
                        <div className="flex flex-row gap-5">
                            {mapCharacters(gameData?.player?.deck, "player")}
                        </div>
                    </div>
                </div>

            </div>


            <dialog ref={cointossRef}>
                <p>Heads or tails?</p>

                <form className="flex gap-2" onSubmit={async (event) => {await handleCointoss(event)}}>
                    <button type="submit" onClick={() => {setCointossGuess("heads")}}>heads</button>
                    <button type="submit" onClick={() => {setCointossGuess("tails")}}>tails</button>
                </form>
            </dialog>

            <dialog ref={moveModalRef}>
                <p>Choose a move</p>
                
                <div className="flex gap-2">
                    {mapMoves(selectedCharacter || 0)}
                </div>
            </dialog>

            <dialog ref={targetSelectorRef}>
                <p>Choose a target</p>

                <div className="flex">
                    {gameData?.cpu.deck.map((character: ExtendedCharacter, index: number) => {
                        return (
                            <div 
                                key={`${crypto.randomBytes(16).toString("hex")}`}
                                className="p-4"
                                onClick={() => attack(index)}
                            >
                                {character.name}<br/>
                                HP: {character.health}
                            </div>
                        )
                    })}
                </div>
            </dialog>

            <dialog ref={manaClickRef}>
                <p>MANA RUSH! CLICK AS FAST AS YOU CAN!</p>

                <div 
                    className="p-10 bg-purple-300 text-neutral-950 select-none"
                    onClick={() => {
                        if (timerRunning) {
                            manaClicks.current += 1; setManaClickCountDisplayValue(manaClickCountDisplayValue + 1)
                        }
                    }}
                >
                    Click here! Your clicks: {manaClickCountDisplayValue}
                </div>
            </dialog>
        </div>

    )
}