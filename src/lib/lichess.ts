import axios from "axios";

export default class Lichess {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    public async post(path: string, body: any) {
        return await axios.post("https://lichess.org" + path, body, { headers: { Authorization: "Bearer " + this.token, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" } });
    }

    public async postGame(pgn: string) {
        var res = await this.post("/api/import", new URLSearchParams({ pgn: pgn }));
        if (res.status != 200) {
            throw `${res.status}: ${res.data}`;
        }
        return res.data["url"];
    }
}
