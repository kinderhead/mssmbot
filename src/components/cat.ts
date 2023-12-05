import { GuildEmoji, Awaitable, Message } from "discord.js";
import Component from "../lib/component.js";

export default class CatHandler extends Component {
    public catEmojiList: string[];
    public catChannel = "1139362238151536670";

    public init(): Awaitable<void> {
        this.refreshCats();
    }

    public onEmojiUpdate(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): Awaitable<void> {
        this.refreshCats();
    }

    public refreshCats() {
        for (const i of this.bot.client.guilds.cache.values()) {
            this.catEmojiList = [" ", "\n", "\t"];

            this.log.debug("Adding cat emojis");
            for (const e of i.emojis.cache.values()) {
                if (e.name.toLowerCase().includes("cat") || ["__", "que", "nyoom"].includes(e.name)) {
                    this.log.silly("Found cat emoji: ", e.toString());
                    this.catEmojiList.push(e.toString());
                }
            }
        }
    }

    public async onMessage(msg: Message<boolean>) {
        if (msg.channelId === this.catChannel) {
            var safe = true;
            if (msg.stickers.size != 0) {
                if (msg.stickers.size > 1 || !(msg.stickers.has(msg.guild.stickers.cache.find(i => i.name === "1984cat").id) || msg.stickers.has(msg.guild.stickers.cache.find(i => i.name === "catpeek").id))) {
                    safe = false;
                }
            } else {
                var modifiedInput = msg.content;
                for (const i of this.catEmojiList) {
                    if (modifiedInput.includes(i)) {
                        modifiedInput = modifiedInput.replaceAll(i, "");
                    }
                }

                if (modifiedInput.length != 0 || msg.attachments.size != 0) {
                    safe = false;
                }
            }

            if (!safe) {
                this.log.warn(`${this.bot.getUserV2(msg.id).discord.displayName} was very naughty and did not cat.`);
                await msg.delete();
            }
        }
    }
}