"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function App() {
    const router = useRouter();

    const [characters, setCharacters] = useState<any[]>([]);
    const [deck, setDeck] = useState<any[]>([]);
    const [characterList, setCharacterList] = useState<any[]>();

    useEffect(() => {
        fetch("/api/user/characters").then(async (response) => {
            if (!response.ok) {
                return alert(await response.text());
            }
            const res = await response.json();

            setCharacters(res);

            const deck = localStorage.getItem("deck") || "[]";
            const deckArray = JSON.parse(deck);
    
            setDeck(deckArray);
        })

        fetch("/api/data/characterlist").then(async (response) => {
            if (!response.ok) {
                return alert("Failed fetching character list.");
            }

            const res = await response.json();

            setCharacterList(res);
        })

    }, []);

    const addCharacterToDeck = (id: string) => {
        const deck = localStorage.getItem("deck") || "[]";
        const deckArray = JSON.parse(deck);

        if (deckArray?.length === 3) {
            return alert("Remove a character from your deck.");
        }

        if (deckArray.includes(id)) {
            return alert("This character is already in your deck.");
        }

        deckArray.push(id);

        localStorage.setItem("deck", JSON.stringify(deckArray));
    };

    const fight = async () => {
        const deck = localStorage.getItem("deck") || "[]";
        const deckArray = JSON.parse(deck);

        if (deckArray?.length !== 3) {
            return alert("Invalid deck");
        }

        const data = {
            deck    
        };

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const endpoint = "/api/game";

        const result = await fetch(endpoint, options);

        if (!result.ok) {
            if (result.status === 403) {
                router.push("/app/fight");
            }

            return alert(await result.text());
        }

        const res = await result.json();

        localStorage.setItem("gameToken", res);

        alert("Prepare to fight!");

        router.push("/app/fight");

        return;
    };

    return (
        <main>
            <div>
                <h2 className="text-2xl">Current deck</h2>
                {deck?.map((id) => {
                    if (deck.length < 1) {
                        return (
                            <div>No characters</div>
                        )
                    }

                    const character = characters?.find(c => c.id === id);

                    if (!character) {
                        return(<>Invalid character</>)
                    }

                    return (
                        <div key={character.id}>
                            <h1>{character.name}</h1>
                            <ul>
                                <li>Attack: {character.attack}</li>
                                <li>Defence: {character.defence}</li>
                                <li>EXP: {character.exp}</li>
                            </ul>
                        </div>
                    )
                })}
            </div>
            <div>
                <h2 className="text-2xl">Unlocked characters</h2>
                {characters?.map((character) => {
                    return (
                        <div key={character.id}>
                            <h1>{character.name}</h1>
                            <ul>
                                <li>Attack: {character.attack}</li>
                                <li>Defence: {character.defence}</li>
                                <li>EXP: {character.exp}</li>
                                <li>ID: {character.id}</li>
                            </ul>
                            <button
                                onClick={() => {addCharacterToDeck(character.id)}}
                                disabled={deck?.length === 3}
                            >Add to deck</button>
                        </div>
                    )
                })}
            </div>

            <div>
                <button onClick={async () => {await fight()}} className="text-2xl">FIGHT</button>
            </div>

            <dialog open>
                <p>This website uses sound.</p>
                <form method="dialog">
                    <button>OK</button>
                </form>
            </dialog>
        </main>
    )
}