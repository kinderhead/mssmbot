import axios from "axios";
import MSSM, { DEFAULT_LOGGER } from "../bot.js";
import { EmbedBuilder } from "discord.js";

export interface RedditPost {
    title: string;
    selftext: string;
    // Image URL
    url_overridden_by_dest: string;
    url: string;
    created: number;
    // Is text
    is_self: boolean;
    is_video: boolean;
    author: string;
    thumbnail: string;
}

export enum RedditPostType {
    TEXT,
    IMAGE,
    VIDEO
}

export default class Reddit {
    public static readonly subreddit = "d_wing";

    public static getPostType(post: RedditPost): RedditPostType {
        if (post.is_self) return RedditPostType.TEXT;
        if (post.is_video) return RedditPostType.VIDEO;
        return RedditPostType.IMAGE;
    }

    public static async getNewPosts(bot: MSSM) {
        try {
            var res = await axios.get(`https://www.reddit.com/r/${this.subreddit}/new.json?sort=new`);
            var data = (res.data["data"]["children"] as any[]).map((i: any) => i["data"] as RedditPost);
            data = data.filter(i => i.created * 1000 > bot.memory.lastredditcheck);
            data.reverse();

            bot.memory.lastredditcheck = Date.now();
            bot.memory.save();
            return data;
        } catch (e) {
            DEFAULT_LOGGER.error(e);
            return [];
        }
    }

    public static getEmbedForPost(post: RedditPost) {
        var embed = new EmbedBuilder().setTitle(post.title).setTimestamp(post.created * 1000).setAuthor({ name: "u/" + post.author }).setURL(post.url);

        switch (this.getPostType(post)) {
            case RedditPostType.TEXT:
                embed.setDescription(post.selftext);
                break;
            
            case RedditPostType.VIDEO:
                embed.setDescription(`Video`).setThumbnail(post.thumbnail);
            
            case RedditPostType.IMAGE:
                embed.setImage(post.url_overridden_by_dest);
        
            default:
                break;
        }

        return embed;
    }

    public static async getPost(url: string) {
        var res = await axios.get(url);
        return res.data[0]["data"]["children"][0]["data"] as RedditPost;
    }
}