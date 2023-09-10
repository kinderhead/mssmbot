import { BISHOP, BLACK, Chess, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from "chess.ts";
import { EmbedBuilder, GuildMember, Message } from "discord.js";
import MSSM from "../bot.js";
import Game, { BasicOpts, desc, name } from "../game.js";
import { ChessData } from "../lib/storage.js";

export default class ChessGame extends Game<ChessOpts> {
    public game: Chess;

    public minPlayers(): number {
        return 2;
    }

    public maxPlayers(): number {
        return 2;
    }

    public getName(): string {
        if (this.players.length != 2) {
            return `${this.host.displayName}'s chess game`;
        }

        return `${this.players[0]} vs ${this.players[1]}`;
    }

    protected async init() {
        this.channel.send("Type `!help` for help");

        return new ChessOpts();
    }

    protected async start() {
        this.game = new Chess();

        await this.channel.send("Note: clear pieces (♙) are white and filled in pieces (♟︎) are black.");

        if (this.options.hostWhite && this.players[0].id !== this.host.id) {
            this.players.reverse();
        }

        try {
            this.game.addHeader("Event", "gaming");
            this.game.addHeader("Site", this.channel.guild.name);
            this.game.addHeader("Date", new Date().toLocaleDateString());
            this.game.addHeader("White", this.players[0].displayName);
            this.game.addHeader("Black", this.players[1].displayName);
        } catch (e) {
            this.log.error(e);
        }

        await this.channel.setName(`Chess: ${this.players[0].displayName} vs ${this.players[1].displayName}`);

        await this.sendBoard();
    }

    public getBoardString(highlight: string[] = []) {
        var board = "```ansi\n";
        var state = this.game.board();

        for (let y = 0; y < 8; y++) {
            board += (8 - y).toString() + " ";
            for (let x = 0; x < 8; x++) {
                var piece = state[y][x];

                if (highlight.includes(`${Object.keys(rank)[x]}${8 - y}`)) {
                    board += "\u001b[0;41;30m";
                } else {
                    board += x % 2 == y % 2 ? "\u001b[0;47;30m" : "\u001b[0;42;30m";
                }
                board += " ";

                if (piece === null) {
                    board += " ";
                } else {
                    board += chess_pieces[piece.color][piece.type];
                }

                board += " \u001b[0;0m";
            }

            board += "\n";
        }

        board += "   a  b  c  d  e  f  g  h\n```";

        return board;
    }

    protected async sendBoard() {
        var color = this.game.turn() === "w" ? "White" : "Black";
        var board = "";

        const embed = new EmbedBuilder();

        if (!this.betterGameOver()) {
            embed.setTitle(`${color} to move`);

            if (this.game.inCheck()) board += "In check\n";
        } else if (this.game.inCheckmate()) {
            embed.setTitle("Checkmate");
        } else if (this.betterDraw()) {
            embed.setTitle("Draw");
        }

        var lastMove = this.getLastMove();
        var highlight: string[] = [];

        if (lastMove !== undefined) {
            highlight.push(lastMove.from);
            highlight.push(lastMove.to);
        }

        board += this.getBoardString(highlight);

        if (!this.betterGameOver()) {
            board += "\nType a move using algebraic notation (e4)."
        }

        embed.setDescription(board);

        await this.channel.send({ embeds: [embed] });

        if (this.betterGameOver()) {
            if (this.game.inCheckmate()) {
                this.declareWinner(this.players[this.game.turn() === "w" ? 1 : 0]);
            } else {
                this.stop(false);
            }

            var url = "";

            try {
                url = await this.bot.lichess.postGame(this.game.pgn());
                this.send("View game on Lichess: " + url);
            } catch (e) {
                this.log.error(e);
            }

            await this.bot.db.chessData.create({
                data: {
                    pgn: this.game.pgn(),
                    lichess: url,
                    white: {
                        connect: {
                            id: this.players[0].id
                        }
                    },
                    black: {
                        connect: {
                            id: this.players[1].id
                        }
                    }
                }
            });
        }

        this.save();
    }

    protected async onMessage(user: GuildMember, msg: Message<boolean>) {
        if (!this.hasStarted) return;

        if (this.players[this.game.turn() === "w" ? 0 : 1].id === user.id) {
            var res = this.game.move(msg.content.trim());

            if (res != null) {
                this.sendBoard();
            }
        }
    }

    protected async continueFromCrash() {
        if (this.hasStarted) {
            this.game = new Chess();
            this.game.loadPgn((this.bot.memory.games[this.channel.id].data as ChessData).pgn);
            await this.sendBoard();
        }
    }

    protected save() {
        if (this.hasStarted) {
            this.bot.memory.games[this.channel.id].data = {
                pgn: this.game.pgn()
            }
        }

        super.save();
    }

    public getLastMove() {
        return this.game.history({ verbose: true }).reverse()[0];
    }

    public betterGameOver() {
        return this.betterDraw() || this.game.inCheckmate();
    }

    public betterDraw() {
        return this.game.inStalemate() || this.game.insufficientMaterial() || this.game.inThreefoldRepetition();
    }
}

export function getResult(pgn: string, white: string, black: string) {
    var c = new Chess();
    c.loadPgn(pgn);
    if (c.inCheckmate()) {
        if (c.turn() == "b") {
            return white;
        } else {
            return black;
        }
    }

    return "";
}

export function getResultPretty(pgn: string) {
    var res = getResult(pgn, "white", "black");

    if (res === "") return "0-0";
    else if (res === "white") return "1-0";
    else return "0-1";
}

export async function calcWinLoss(user: string, bot: MSSM): Promise<[number, number]> {
    const data = await bot.db.userData.findUnique({ where: { id: user }, include: { chess_games_black: true, chess_games_white: true, _count: true } });

    var win = 0;
    var loss = 0;

    for (const i of data.chess_games_white) {
        var res = getResult(i.pgn, i.whiteId, i.blackId);
        if (res !== "") {
            if (res === user) {
                win++;
            } else {
                loss++;
            }
        }
    }

    for (const i of data.chess_games_black) {
        var res = getResult(i.pgn, i.whiteId, i.blackId);
        if (res !== "") {
            if (res === user) {
                win++;
            } else {
                loss++;
            }
        }
    }

    return [win, loss];
}

class ChessOpts extends BasicOpts {
    @name("Host is white")
    @desc("Host plays white")
    hostWhite: boolean = true;
}

var chess_pieces = {
    [WHITE]: {
        [KING]: "♔",
        [QUEEN]: "♕",
        [ROOK]: "♖",
        [BISHOP]: "♗",
        [KNIGHT]: "♘",
        [PAWN]: "♙"
    },
    [BLACK]: {
        [KING]: "♚",
        [QUEEN]: "♛",
        [ROOK]: "♜",
        [BISHOP]: "♝",
        [KNIGHT]: "♞",
        [PAWN]: "♟︎"
    }
};

var rank = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7
};
