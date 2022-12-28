import { nanoid } from "nanoid";

const mg = <T,>(map: Map<string, T>, key: string) => {
    return map.get(key) || { id: "", time: 0, rank: 0, members: 0, lobbies: [] };
}

const rem = <T,>(list: T[], f: (l: T) => boolean) => {
    const removed = [];
    const nl = [];
    for (const e of list) {
        if (f(e))
            removed.push(e);
        else
            nl.push(e)
    }
    list.length = 0;
    Object.assign(list, nl);
    return removed;
}

const c = {
    "TEAM_SIZE": 5,
    "TEAMS_PER_MATCH": 2,
    "d": {
        "MM_INTERVAL": 1000,
        "MAX_DIFF_START": 0.02,
        "INCREASE_DIFF_TIME": 60000,
        "CLEAR_INTERVAL": 3600000,
        "CLEAR_AFTER_QUE_TIME": 7200000
    }
};

export interface Group_I {
    time: number;
    rank: number;
    members: number;
}

export interface Lobby_I extends Group_I {
    id: string;
}

export interface Team_I extends Group_I {
    lobbies: string[];
}


export default class MatchMaker {
    private que = new Map<string, Lobby_I>();
    constructor() {
        //TODO: pass options and override config

        setInterval(() => this.#matchMake(), c.d.MM_INTERVAL);
        setInterval(() => this.#clearLobbies(), c.d.CLEAR_INTERVAL);
    }
    addToQue(lobby: Lobby_I) {
        const t = {
            id: lobby.id,
            time: Date.now(),
            rank: lobby.rank,
            members: lobby.members
        };
        this.que.set(lobby.id, t);
    }
    removeFromQue(id: string) {
        this.que.delete(id);
    }
    #matchMake() {
        const matches = Helper.createMatches(this.que);
        if (!matches || matches.length == 0)
            return;
        // removed selected lobbies from que
        for (const match of matches) {
            for (const team of match) {
                for (const l of team) {
                    this.removeFromQue(l);
                }
            }
        }
        // return promise
    }
    #clearLobbies() {
        for (const [k, v] of this.que.entries()) {
            if (Date.now() - v.time > c.d.CLEAR_AFTER_QUE_TIME) {
                this.removeFromQue(k)
            }
        }
    }
}

class Helper {
    static createMatches(lobbyQue: Map<string, Lobby_I>) {
        const teams = this.#createGroups(lobbyQue, c.TEAM_SIZE);
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
        const matches: string[][][] = [];
        for (const match of this.#createGroups(teamQue, c.TEAMS_PER_MATCH)) {
            const m: string[][] = [];
            for (const team of match) {
                m.push(mg(teamQue, team).lobbies);
            }
            matches.push(m);
        }
        return matches;
    }
    static #createGroups(que: Map<string, Group_I>, size: number) {
        const available = [...que.keys()];
        const groups: string[][] = [];

        // make the full premades into groups
        for (const lobby of rem(available, (l: string) => mg(que, l).members == size)) {
            groups.push([lobby]);
        }

        // make the full premades into groups
        while (available.length > 0) {
            const t = this.#createGroup(available, que, size);
            if (!t)
                continue;
            groups.push(t);
            for (const l of t) {
                rem(available, (e: string) => e == l);
            }
        }
        return groups;
    }
    static #createGroup(available: string[], que: Map<string, Group_I>, size: number) {
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
            if (Math.abs(l.rank - rank) > c.d.MAX_DIFF_START + time / c.d.INCREASE_DIFF_TIME)
                continue;

            group.push(lid);
            if (members + l.members == size)
                return group;
        }
        return null;
    }
}