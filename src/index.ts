import { remove } from "@jgtools/listutils";
import { nanoid } from "nanoid";

const mg = <T,>(map: Map<string, T>, key: string) => {
    return map.get(key) || { id: "", time: 0, rank: 0, members: 0, lobbies: [] };
}

export interface Lobby {
    id: string;
    rank: number;
    members: number;
};
export type Team = string[];
export interface Match {
    teams: Team[];
    rankDiff: number;
}

interface MatchMakingConfig {
    TEAM_SIZE: number,
    TEAMS_PER_MATCH: number,
    MM_INTERVAL: number,
    MAX_DIFF_START: number,
    INCREASE_DIFF_TIME: number,
    CLEAR_INTERVAL: number,
    CLEAR_AFTER_QUE_TIME: number
}
interface Group_I {
    time: number;
    rank: number;
    members: number;
}
interface Lobby_I extends Group_I {
    id: string;
}
interface Team_I extends Group_I {
    lobbies: string[];
}

export default class MatchMaking {
    #c: MatchMakingConfig = {
        TEAM_SIZE: 5,
        TEAMS_PER_MATCH: 2,
        MM_INTERVAL: 1000,
        MAX_DIFF_START: 0.02,
        INCREASE_DIFF_TIME: 60000,
        CLEAR_INTERVAL: 3600000,
        CLEAR_AFTER_QUE_TIME: 7200000
    };
    #que = new Map<string, Lobby_I>();
    constructor(onMatchesFound: (matches: Match[]) => void, config?: MatchMakingConfig) {
        if (config)
            this.#c = config;

        setInterval(() => this.#matchMake(onMatchesFound), this.#c.MM_INTERVAL);
        setInterval(() => this.#clearLobbies(), this.#c.CLEAR_INTERVAL);
    }
    addToQue(lobby: Lobby) {
        const l = {
            id: lobby.id,
            time: Date.now(),
            rank: lobby.rank,
            members: lobby.members
        };
        this.#que.set(lobby.id, l);
    }
    removeFromQue(id: string) {
        this.#que.delete(id);
    }
    setConfig(config: MatchMakingConfig) {
        this.#c = config;
    }
    getQue() {
        return this.#que;
    }
    getConfig() {
        return this.#c;
    }
    #matchMake(onMatchesFound: (matches: Match[]) => void) {
        const matches = Helper.createMatches(this.#c, this.#que);
        if (!matches || matches.length == 0)
            return;
        this.#calculateRankDiff(matches);
        this.#removeMatchesFromQue(matches);
        onMatchesFound(matches);
    }
    #clearLobbies() {
        for (const [k, v] of this.#que.entries()) {
            if (Date.now() - v.time > this.#c.CLEAR_AFTER_QUE_TIME) {
                this.removeFromQue(k);
            }
        }
    }
    #removeMatchesFromQue(matches: Match[]) {
        for (const match of matches) {
            for (const team of match.teams) {
                for (const l of team) {
                    this.removeFromQue(l);
                }
            }
        }
    }
    #calculateRankDiff(matches: Match[]) {
        for (const match of matches) {
            const ranks = [];
            for (const team of match.teams) {
                const rank = team.reduce((s, l) => s + (this.#que.get(l)?.rank || 0), 0) / team.length;
                ranks.push(rank);
            }
            const avg = ranks.reduce((s, r) => s + r, 0) / ranks.length;
            match.rankDiff = ranks.reduce((s, r) => s + Math.abs(r - avg), 0) / ranks.length;
        }
    }
}

class Helper {
    static createMatches(c: MatchMakingConfig, lobbyQue: Map<string, Lobby_I>) {
        const teams = this.#createGroups(c, lobbyQue, c.TEAM_SIZE);
        if (teams.length < c.TEAMS_PER_MATCH)
            return;

        const teamQue = new Map<string, Team_I>();
        for (const t of teams) {
            const time = t.reduce((s: number, l: string) => s + mg(lobbyQue, l).time, 0) / t.length;
            const rank = t.reduce((s: number, l: string) => s + mg(lobbyQue, l).rank, 0) / t.length;
            const members = 1;
            const lobbies = t;
            teamQue.set(nanoid(), { time, rank, members, lobbies });
        }
        const matches: Match[] = [];
        for (const match of this.#createGroups(c, teamQue, c.TEAMS_PER_MATCH)) {
            const m: Match = { teams: [], rankDiff: 0 };
            for (const team of match) {
                m.teams.push(mg(teamQue, team).lobbies);
            }
            matches.push(m);
        }
        return matches;
    }
    static #createGroups(c: MatchMakingConfig, que: Map<string, Group_I>, size: number) {
        const available = [...que.keys()];
        const groups: string[][] = [];

        for (const lobby of remove(available, (l: string) => mg(que, l).members == size)) {
            groups.push([lobby]);
        }

        while (available.length > 0) {
            const t = this.#createGroup(c, available, que, size);
            if (!t)
                continue;
            groups.push(t);
            for (const l of t) {
                remove(available, (e: string) => e == l);
            }
        }
        return groups;
    }
    static #createGroup(c: MatchMakingConfig, available: string[], que: Map<string, Group_I>, size: number) {
        const group = available.splice(Math.random() * available.length, 1);
        if (!group[0])
            return null;
        for (const lid of available) {
            const members = group.reduce((s, l) => s + mg(que, l).members, 0);
            const l = mg(que, lid);

            if (members + l.members > size)
                continue;

            const time = group.reduce((s, l) => s + Date.now() - mg(que, l).time, 0) / group.length;
            const rank = group.reduce((s, l) => s + mg(que, l).rank, 0) / group.length;
            if (Math.abs(l.rank - rank) > c.MAX_DIFF_START + time / c.INCREASE_DIFF_TIME)
                continue;

            group.push(lid);
            if (members + l.members == size)
                return group;
        }
        return null;
    }
}