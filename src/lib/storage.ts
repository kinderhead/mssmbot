import { APIEmbed } from 'discord.js';
import fs from 'node:fs';
import { Card } from '../games/uno.js';

export type StorageObj<T> = T & { save?: () => void };

export class Storage {
    public static make<T>(filename: string, def: T) {
        var obj: StorageObj<T>;

        if (fs.existsSync(filename)) {
            var data = JSON.parse(fs.readFileSync(filename).toString());

            for (const key in def) {
                if (!(key in data)) {
                    data[key] = def[key];
                }
            }

            obj = data;
        } else {
            obj = def;
        }

        obj.save = () => {
            fs.writeFileSync(filename, JSON.stringify(obj, null, 4));
        };

        return obj;
    }

    public save() {
        
    }
}

export interface QueueDataStorage {
    queue: (Question | Poll)[];
}

export interface Question {
    type: "question";
    question: string | APIEmbed;
    id: number;
}

export interface Poll {
    type: "poll";
    title: string;
    options: string[];
    id: number;
}

export class UnoData {
    hands: { [id: string]: Card[] };
    cardInPlay: Card;

    reversed: boolean;
    turn: number;

    currentStack: number;
    currentStackType: "+2" | "+4";

    lastPickupAmount: number;

    safeUno: string[];
}

export class ChessData {
    pgn: string;
}

export class GameData {
    type: string;
    channelID: string;
    players: string[];
    host: string;
    options: any;
    started: boolean;
    allowNewPlayers: boolean;
    data: UnoData | ChessData;
}

export class Memory {
    infoid = "";
    infochannelid = "";
    modinfoid = "";
    modinfochannelid = "";

    changelogthreadid = "";
    changeloglastdesc = "";
    changeloglastdate = "";
    changelognumdate = 1;

    ruleschannelid: string = "";
    rulesmessageids: string[] = [];
    rulesmessages: APIEmbed[] = [];

    minecraftchannelid: string = "";
    minecraftid: string = "";

    clubchannelid = "";
    clubmessageid = "";

    metaid = "";

    countingchannelid = "";
    count = 0;
    lasttocount = "";
    highscore = 0;

    games: { [channelID: string]: GameData } = {};

    messagestoday = 0;
    latestmessagedate = "";

    poop = 0;

    lastredditcheck = Date.now();
}
