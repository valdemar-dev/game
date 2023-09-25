"use client";

import { io, Socket } from "socket.io-client";
import { useState, useRef, useEffect, RefObject, MutableRefObject } from "react";
import crypto from "crypto";
import { useRouter } from "next/navigation";
import Image from "next/image";
import moveListData from "@/../../../lib/moves.json";
import characterListData from "@../../../lib/characters.json";

const characterList: CharacterListData = characterListData;

const moveList: MoveList = moveListData;

interface Move {
    type: string;
    name: string;
    power: number;
    manaCost: number;
    description: string;
};

interface MoveList {
    [key: number]: Move;
};

export default function Fight() {
    const router = useRouter();

    const infoRef = useRef<HTMLDivElement>(null);
    const cointossRef = useRef<any>();
    const moveRef = useRef<HTMLDivElement>(null);
    const targetSelectorRef = useRef<any>();
    const teammateSelectorRef = useRef<any>();
    const manaClickRef = useRef<any>();
    const soundClickRef = useRef<any>();
    const arrowRef = useRef<HTMLImageElement>(null);
    
    const [infoText, setInfoText] = useState<string>("");

    const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);

    const [timerRunning, setTimerRunning] = useState<boolean>(false);
    const [selectedCharacter, setSelectedCharacter] = useState<number>();
    const [infoCharacter, setInfoCharacter] = useState<number>();

    const manaClicks = useRef<number>(0);
    const [manaClickCountDisplayValue, setManaClickCountDisplayValue] = useState<number>(0);

    const [playerMana, setPlayerMana] = useState<number>(0);
    const [cpuMana, setCpuMana] = useState<number>(0);

    const [selectedMove, setSelectedMove] = useState<number>(0);

    const [gameData, setGameData] = useState<Game>();

    const socketRef = useRef<any>(null);

    // SFX STUFF
    const manaCollect = useRef<HTMLAudioElement>();
    const damageOne = useRef<HTMLAudioElement>();
    const backgroundOne = useRef<HTMLAudioElement | null>();
    const coinFlipStart = useRef<HTMLAudioElement>();
    const click = useRef<HTMLAudioElement>();
    const roundStart = useRef<HTMLAudioElement>();
    const heal = useRef<HTMLAudioElement>();
    const damageTake = useRef<HTMLAudioElement>();
    const cardSet = useRef<HTMLAudioElement>();
    const cardLift = useRef<HTMLAudioElement>();

    useEffect(() => {
        cardSet.current = new Audio("/sfx/cardOne.ogg");
        cardSet.current!.volume = 0.5;

        cardLift.current = new Audio("/sfx/cardLift.wav");
        cardLift.current!.volume = 0.8;

        manaCollect.current = new Audio("/sfx/manacollect.mp3");
        manaCollect.current.volume = 0.4;

        damageOne.current = new Audio("/sfx/damageone.wav");
        damageOne.current.volume = 0.5;

        backgroundOne.current = new Audio("/music/bossfight.mp3");
        backgroundOne.current.volume = 0.2;

        coinFlipStart.current = new Audio("/sfx/coinflipstart.wav");
        coinFlipStart.current.volume = 1;

        click.current = new Audio("/sfx/click.mp3");
        click.current.volume = 1;

        roundStart.current = new Audio("/sfx/roundstart.wav");

        heal.current = new Audio("/sfx/heal.wav");
        heal.current.volume = 0.7;

        damageTake.current = new Audio("/sfx/damage.mp3");
        damageTake.current.volume = 0.7;

        return(() => {
            backgroundOne.current!.pause()
        });
    }, []);

    const startTimer = () => {
        if (!timerRunning) {
            setTimerRunning(true);

            manaClicks.current = 0;

            setManaClickCountDisplayValue(0);

            setTimeout(() => {
                setTimerRunning(false);
                
                setTimeout(() => {
                    try {
                        socketRef.current.emit("manaRushResult", manaClicks.current);                

                        manaClickRef.current.close();
                    } catch {}
                }, 1200);
            }, 5000);
        }
    };

    const sleep = (durationMs: number): Promise<void> => {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, durationMs);
        })
    };

    useEffect(() => {
        // Retrieve the game token from localStorage
        const gameToken = localStorage.getItem("gameToken");

        if (!gameToken) return router.push("/app");

        // Check if gameToken exists
        // Create or reuse the socket instance
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3001", {
                query: {
                    gameToken: gameToken,
                },
            });

            socketRef.current.on("disconnect", () => {
                router.push("/app");
            });
              
            socketRef.current.on("connect", () => {
                backgroundOne.current!.play().catch(() => {

                    soundClickRef.current!.showModal();
                });

                backgroundOne.current!.loop = true;
            });

            socketRef.current.on("cointoss", () => {
                showCoinTossRef();
                coinFlipStart.current!.play().catch(() => {});

                socketRef.current.once("cointossResult", ({ guess, isCorrect, }: { guess: string, isCorrect: boolean, }) => {
                    setInfoText(`You guessed ${guess}.. ${isCorrect ? "It was correct!" : "It was incorrect!"}`);
                });
            });

            socketRef.current.on("cpuAttack", async ({ attacker, target, move, damage, game }: { attacker: GameCharacter, target: GameCharacter, move: Move, damage: number, game: Game }) => {
                const hitAudio = new Audio(`/moves/${move.name}.mp3`);

                setInfoText(`The opposing ${attacker.name} used ${move.name}!`)
                hitAudio.play();
                hitAudio.volume = 0.5;                

                hitAudio.onloadedmetadata = async () => {
                    await sleep(Math.ceil(hitAudio.duration) * 1000);
                    
                    damageTake.current!.play();

                    setInfoText(`It did ${damage} damage!`)
                    setGameData(game);
                    setCpuMana(game.cpu.mana);
                    
                    if (target.isFainted) {
                        await sleep (1500);

                        setInfoText(`${target.name} fainted!`);
                        damageOne.current!.play();
                    }
                }
            });

            socketRef.current.on("gameData", (game: Game) => {
                setPlayerMana(game.player.mana);
                setIsPlayerTurn(game.isPlayerTurn);
                setCpuMana(game.cpu.mana);

                setGameData(game);
            });
            
            socketRef.current.on("gameEnd", (winner: string) => {
                alert(`THE GAME HAS ENDED!`)
                alert(`The winner is: ${winner}!`)

                socketRef.current!.close();

                router.push("/app");
            });

            socketRef.current.on("subtitle", (subtitleText: string) => {
                setInfoText(subtitleText);
            }); 

            socketRef.current.on("playerAttack", async ({move, attacker, target, damage, game, }: {move: Move, attacker: GameCharacter, target: GameCharacter, damage: number, game: Game, }) => {
                const hitAudio = new Audio(`/moves/${move.name}.mp3`);

                setInfoText(`${attacker.name} used ${move.name}!`)
                hitAudio.play();
                hitAudio.volume = 0.5;
                
                hitAudio.onloadedmetadata = async () => {
                    await sleep(Math.ceil(hitAudio.duration) * 1000);
                
                    damageTake.current!.play();

                    setInfoText(`It did ${damage} damage!`)
                    setGameData(game);
                    setCpuMana(game.cpu.mana);
                    
                    if (target.isFainted) {
                        await sleep (1500);

                        setInfoText(`The opposing ${target.name} fainted!`);
                        damageOne.current!.play();
                    }
                }
            });

            socketRef.current.on("playerHeal", async ({ move, attacker, target, amountHealed, game }: { move: Move, attacker: GameCharacter, target: GameCharacter, amountHealed: number, game: Game }) => {
                const hitAudio = new Audio(`/moves/${move.name}.mp3`);

                setInfoText(`${attacker.name} used ${move.name}!`);
                hitAudio.play();
 
                hitAudio.onloadedmetadata = async () => {
                    await sleep(Math.ceil(hitAudio.duration) * 1000);

                    heal.current!.play();

                    setInfoText(`It healed ${amountHealed} HP!`);
                    setGameData(game);
                    setPlayerMana(game.player.mana);
                }                
            });

            socketRef.current.on("manaRush", async () => {
                setInfoText("Mana rush begins in 3...");
                await sleep(1000);
                setInfoText("2...");
                await sleep(1000);
                setInfoText("1...");
                await sleep(1000);
                setInfoText("GO!");
                
                manaClickRef.current.showModal();

                if (!timerRunning) {
                    startTimer();
                }

                socketRef.current.once("manaRushScore", ({ manaClicksFinal, newPlayerMana , cpuMana }: { manaClicksFinal: number, newPlayerMana: number, cpuMana: number, }) => {
                    setInfoText(`You got ${manaClicksFinal} mana during the rush!`);
                    manaCollect.current!.play();
                    
                    setPlayerMana(newPlayerMana);
                    setCpuMana(cpuMana);
                });
            });

            socketRef.current.on("cpuTurn", async () => {
                setIsPlayerTurn(false);

                arrowRef.current!.classList.remove("turnClockRotatePlayer");
                arrowRef.current!.classList.add("turnClockRotateCPU");

                setTimeout(() => {
                    roundStart.current!.play();
                }, (1000));
            });

            socketRef.current.on("playerTurn", async () => {
                setIsPlayerTurn(true);
                
                arrowRef.current!.classList.remove("turnClockRotateCPU");
                arrowRef.current!.classList.add("turnClockRotatePlayer");

                setTimeout(() => {
                    roundStart.current!.play();
                }, (1000));
            });

            socketRef.current.on("cpuHeal", async ({ move, user, target, health, game }: { move: Move, user: GameCharacter, target: GameCharacter, health: number, game: Game }) => {
                setInfoText(`The opposing ${user.name} used ${move.name}!`);
                heal.current!.play();

                await sleep (1700);
                
                setInfoText(`It healed ${health} HP!`);
                setGameData(game);
                setCpuMana(game.cpu.mana);
            });
        }
    }, []);

    const showMoveRef = () => {
        moveRef.current?.classList.remove("slideOutLeft");
        moveRef.current?.classList.add("slideInLeft");
    };

    const hideMoveRef = () => {
        moveRef.current?.classList.remove("slideInLeft");
        moveRef.current?.classList.add("slideOutLeft");    
    };

    const showInfoRef = () => {
        infoRef.current?.classList.add("slideInTop");
        infoRef.current?.classList.remove("slideOutTop");
    };

    const hideInfoRef = () => {
        infoRef.current?.classList.remove("slideInTop");
        infoRef.current?.classList.add("slideOutTop");
    };

    const showCoinTossRef = () => {
        cointossRef.current?.classList.remove("slideDown");
        cointossRef.current?.classList.add("slideUp");
    };

    const hideCoinTossRef = () => {
        cointossRef.current?.classList.remove("slideUp");
        cointossRef.current?.classList.add("slideDown");
    };

    const mapCharacters = (deck: Array<GameCharacter> | undefined, deckHolder: string,) => {
        if (!deck) {
            return (<></>)
        }

        if (deck.length < 1) return (
            <></>
        )

        return deck!.map((character, index) => {
            const handleMouseEnter = () => {
                setInfoCharacter(index);

                if (isPlayerTurn === false) return;
                if (character.isFainted) return;
                if (gameData?.isGameOver === true) return; 
                
                if (deckHolder === "player") {
                    setSelectedCharacter(index);
                    showMoveRef();
                    
                    return;
                }
            };

            const handleClick = () => {
                showInfoRef();
                cardLift.current!.play();
            };

            const handleMouseUp = () => {
                cardSet.current!.play();
            };
            
            const handleMouseLeave = () => {
                hideInfoRef();
            };

            return (
                <div 
                    key={`${crypto.randomBytes(8).toString("hex")}`}
                    className={
                        "flex flex-col justify-center items-center w-max card relative " +
                        `${deckHolder === "player" && index === 1 ? "top-6" : ""} ` +
                        `${deckHolder !== "player" && index === 1 ? "bottom-6" : ""}`
                    }
                >
                    <div  
                        className="p-1 pr-2 w-24 flex flex-col justify-between items-center chronoCard hover:cursor-pointer"
                        onMouseEnter={() => handleMouseEnter()}
                        onMouseLeave={() => handleMouseLeave()}
                        onMouseUp={() => handleMouseUp()}
                        onMouseDown={() => handleClick()}
                    >
                        <h3 className="text-lg">Lv. {character.level}</h3>
                        <Image
                            src={`/characters/${character.name}.png`}
                            height="80"
                            width="80"
                            alt="Player icon"
                            unoptimized
                        />
                        <p className="text-lg">
                            { character.health > 0 ? `${character.health} / ${character.maxHp} HP` : "FAINTED" }
                        </p>

                        <div className="w-screen">
                            <div className="w-100 bg-green-300"></div>
                        </div>
                    </div>

                    <h2 className="text-2xl">
                        {character.name}
                    </h2>
                </div>

            )
        })
    };

    const mapMoves = (characterIndex: number) => {
        const character = gameData?.player.deck[characterIndex];

        if (!character) {return<></>};

        const handleClick = (moveIndex: number, move: number) => {
            moveRef.current?.classList.remove("slideInLeft");
            moveRef.current?.classList.add("slideOutLeft");

            const moveInList: Move = moveList[move];

            if (moveInList.type === "attack") {
                targetSelectorRef.current.showModal();
            } else {
                teammateSelectorRef.current.showModal();
            }

            setSelectedMove(moveIndex);
        };

        return character.moves.map((move, index) => {
            const moveInList: Move = moveList[move];

            if (!moveInList) return (<></>);

            return (
                <div 
                    key={`${crypto.randomBytes(16).toString("hex")}`} 
                    className={`pb-2 ${playerMana < moveInList.manaCost ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => {
                        if (moveInList.manaCost > playerMana) {
                            return;
                        }
                        handleClick(index, move)
                    }}
                >
                    <p className="text-xl">{moveInList.name} [{moveInList.manaCost} mana]</p>
                    <p>{moveInList.description}</p>
                    <div>
                        Power: {moveInList.power}
                    </div>
                </div>
            )
        })
    };

    const doAction = (index: number) => {
        targetSelectorRef.current.close();
        teammateSelectorRef.current.close();

        socketRef.current.emit("playerMove", ({ moveIndex: selectedMove, attackerIndex: selectedCharacter, targetIndex: index, }));

        setSelectedCharacter(undefined);
    };

    const infoMapper = () => {
        const character = gameData?.player.deck[infoCharacter || 0];

        if (!character) return;

        return (
            <div>
                <div className="flex gap-2">
                    <div>
                        <h1 className="text-2xl">{character.name}</h1>
                        <h2>Lv. {character.level}</h2>

                        <div>
                            <ul>
                                <li>B. Attack: {character.ivs.attack}</li>
                                <li>B. Defence: {character.ivs.defence}</li>
                                <li>B. Health: {character.ivs.health}</li>
                            </ul>
                        </div>
                    </div>

                    <Image
                        className="ml-auto"
                        src={`/characters/${character.name}.png`}
                        height="128"
                        width="128"
                        alt="Player icon"
                        unoptimized
                    />
                </div>



                <p className="pt-2">{character.description}</p>
            </div>
        )
    };

    return (
        <div> 
            <div className="tablet absolute flex flex-col z-50 left-1/4 -bottom-2 p-8">
                <h2 className="text-2xl mb-auto text-center">CPU's turn</h2>
                <Image
                    ref={arrowRef}
                    className={`${isPlayerTurn ? "turnClockRotatePlayer" : "turnClockRotateCPU"} origin-top-left  absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
                    src="/assets/arrow.gif"
                    height="128"
                    width="128"
                    alt="Turnstile arrow"
                    unoptimized={true}
                />
                <h2 className="text-2xl mt-auto text-center">Your turn</h2>
            </div>

            <Image
                className="absolute left-1/2 -translate-x-1/2 z-10 -translate-y-12"
                src="/characters/darkmage.gif"
                height="512"
                width="512"
                alt="Dancing coin man"
            />

            <div className="absolute bottom-4 z-40 left-1/2 -translate-x-1/2">
                <div className="player w-44 px-5 absolute left-1/2 -translate-x-1/2 -top-10 flex flex-row items-center">
                    <h1 className="text-3xl">CPU</h1>
                    <div className="flex gap-2 ml-auto text-xl items-center">
                        {cpuMana}
                        <Image
                            src="/assets/mana.gif"
                            height="10"
                            width="10"
                            alt="Mana orb"
                            unoptimized
                        />
                    </div>
                </div>

                <div className="flex items-center flex-col">
                    <div>
                        <div className="flex gap-6">
                            {mapCharacters(gameData?.cpu?.deck, "cpu")}
                        </div>
                    </div>

                    <div>
                        <div className="flex gap-6">
                            {mapCharacters(gameData?.player?.deck, "player")}
                        </div>
                    </div>
                </div>

                {/* <div className="player w-44 px-5 absolute left-1/2 -translate-x-1/2 -bottom-32 flex flex-row items-center">
                    <h1 className="text-3xl">You</h1>
                    <div className="flex gap-2 ml-auto text-xl items-center">
                        {playerMana}
                        <Image
                            src="/assets/mana.gif"
                            height="10"
                            width="10"
                            alt="Mana orb"
                            unoptimized
                        />
                    </div>
                </div> */}
            </div>

            {/* DIALOGUE STUFF */}

            {/* character info */}
            <div
                className="absolute top-0 left-32 z-50 w-80 p-8 slideOutTop info"
                ref={infoRef}
            >
                {infoMapper()}
            </div>

            <div 
                ref={cointossRef}
                className="absolute inset-1/2 p-8 pb-12 z-50 -translate-x-1/2 -translate-y-1/2 w-min h-max opacity-0 hidden tablet"
            >                 
                <Image
                    src="/characters/darkmage.gif"
                    height="256"
                    width="256"
                    alt="Dancing coin man"
                />

                <span className="mx-1 text-center">"Your fate may rest<br/> on this choice."</span>

                <div className="flex justify-around gap-4 mt-auto mx-4 mb-4">
                    <button 
                        className="button w-20 text-xl"
                        onClick={() => {
                            socketRef.current.emit("cointossGuess", "heads");
                            click.current!.play();
                            backgroundOne.current!.play();
                            hideCoinTossRef()
                        }}>heads</button>

                    <button 
                        className="button w-20 text-xl"
                        onClick={() => {
                            socketRef.current.emit("cointossGuess", "tails"); 
                            click.current!.play();
                            hideCoinTossRef()
                        }}>tails</button>
                </div>
            d</div>

            <dialog ref={targetSelectorRef}>
                <p>Choose a target</p>

                <div className="flex">
                    {gameData?.cpu.deck.map((character: GameCharacter, index: number) => {
                        if (character.isFainted === true) return;

                        return (
                            <div 
                                key={`${crypto.randomBytes(16).toString("hex")}`}
                                className="p-4"
                                onClick={() => doAction(index)}
                            >
                                {character.name}<br/>
                                HP: {character.health}
                            </div>
                        )
                    })}
                </div>
            </dialog>

            <dialog ref={teammateSelectorRef}>
                <p>Choose a team member</p>

                <div className="flex">
                    {gameData?.player.deck.map((character: GameCharacter, index: number) => {
                        if (character.isFainted === true) return;

                        return (
                            <div 
                                key={`${crypto.randomBytes(16).toString("hex")}`}
                                className="p-4"
                                onClick={() => doAction(index)}
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
                    className={`p-10 bg-purple-300 text-neutral-950 select-none`}
                    onClick={() => {
                        if (timerRunning) {
                            manaClicks.current += 1; setManaClickCountDisplayValue(manaClickCountDisplayValue + 1)
                        }
                    }}
                >
                    Click here! Your clicks: {manaClickCountDisplayValue}
                </div>
            </dialog>   

            <div onMouseLeave={() => {hideMoveRef()}} ref={moveRef} className="absolute right-0 pl-12 pr-8 pt-16 w-80 movetile -translate-y-1/2 top-1/2 slideOutLeft">
                <button 
                    className={`absolute w-16 h-16 top-1 right-1`}
                    onClick={() => {
                        click.current!.play();
                        moveRef.current?.classList.remove("slideInLeft");
                        moveRef.current?.classList.add("slideOutLeft");
                    }}
                ></button>

                {mapMoves(selectedCharacter || 0)}
            </div>

            <dialog ref={soundClickRef} className="p-5 bg-green-800">
                <h2 className="text-2xl">This website uses sound.</h2>
                <form className="mt-4 w-full flex justify-center" method="dialog">
                    <button className="text-xl bg-green-950 px-5 py-2" onClick={() => {
                        backgroundOne.current!.play();
                        backgroundOne.current!.loop = true;
                    }}>OK</button>
                </form>
            </dialog>
        </div>
    )
}