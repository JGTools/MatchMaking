import { nanoid } from "nanoid";
import MatchMaker, { Lobby, Match } from "../../../src";

class MMTest {
    static run() {
        const lobbies = MMTest.#getTestLobbies();
        console.log(lobbies);
        console.log(lobbies.length);

        const config = {
            TEAM_SIZE: 5,
            TEAMS_PER_MATCH: 2,
            MM_INTERVAL: 1000,
            MAX_DIFF_START: 0.02,
            INCREASE_DIFF_TIME: 60000,
            CLEAR_INTERVAL: 3600000,
            CLEAR_AFTER_QUE_TIME: 7200000
        };

        const mm = new MatchMaker({
            onMatchesFound: (matches: Match[]) => {
                for (const match of matches) {
                    console.log("M:", match.teams.length, match.rankDiff);
                }
                console.log("Found:", matches.length);
                console.log("Q:", mm.getQue().size);
            },
            config
        });

        // add lobbies to matchmaking
        while (lobbies.length > 0) {
            const l = lobbies.pop();
            if (l)
                mm.addToQue(l);
        }
        // remove lobby with id "1" from matchmaking
        mm.removeFromQue("1");
    }
    static #getTestLobbies() {
        const TEST_USERS = 100;
        const users = [];
        for (let i = 0; i < TEST_USERS; i++) {
            const u = {
                id: "user" + i,
                rank: Math.random()
            };
            users.push(u);
        }

        const TEAM_SIZE = 5;
        const lobbies: Lobby[] = [];
        for (let i = 0; i < users.length; i += 0) {
            const lsize = 1 + Math.floor(Math.random() * TEAM_SIZE);
            const l = [];
            for (let j = 0; j < lsize; j++) {
                const u = users[i];
                if (u)
                    l.push(u);
                i++;
            }

            const id = nanoid();
            const rank = l.reduce((s, u) => s + u.rank, 0) / l.length;
            const members = l.length;
            lobbies.push({ id, rank, members });
        }
        return lobbies;
    }
}
MMTest.run();