import { GuildEmoji, Awaitable, Message, TextChannel } from "discord.js";
import Component from "../lib/component.js";
import Reddit from "../lib/reddit.js";

export default class RedditComponent extends Component {
    public dwing: TextChannel;

    public init(): Awaitable<void> {
        this.dwing = this.bot.getChannel("748666259213647942");

        this.checkPosts();
    }

    public async checkPosts() {
        var posts = await Reddit.getNewPosts(this.bot);

        for (const i of posts) {
            this.log.info(`Sending reddit post info ${i.title}`);
            this.dwing.send({ embeds: [Reddit.getEmbedForPost(i)] });
        }

        setTimeout(() => {
            this.checkPosts();
        }, 60000);
    }
}