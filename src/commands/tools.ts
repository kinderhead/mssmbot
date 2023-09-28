import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { embedBuilder } from "../lib/utils.js";
import Reddit from "../lib/reddit.js";

export default class ToolsCommand extends Command {
    public getName() { return "tools"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Some discord tools to mess around with")
            .addSubcommand(sbc => sbc
                .setName("embed-builder")
                .setDescription("Create fancy message"))
            .addSubcommand(sbc => sbc
                .setName("message-count")
                .setDescription("Displays the number of messages sent today"))
            .addSubcommand(sbc => sbc
                .setName("msg-converter")
                .setDescription("Transforms the last sent message into an embed"))
            .addSubcommand(sbc => sbc
                .setName("reddit")
                .setDescription("Creates an embed for a reddit post")
                .addStringOption(opt => opt.setName("url").setDescription("Url with .json at the end").setRequired(true)));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        var user = bot.getUser(msg);
        if (msg.options.getSubcommand() === "embed-builder") {
            await msg.deferReply({ ephemeral: true });
            await embedBuilder(user, msg.editReply.bind(msg), bot);
        } else if (msg.options.getSubcommand() === "message-count") {
            await msg.reply(`${bot.memory.messagestoday} messages sent today.`);
        } else if (msg.options.getSubcommand() === "msg-converter") {
            await msg.deferReply();
            var lastMsg = (await msg.channel.messages.fetch({ limit: 2 })).at(1);
            var data = bot.createEmbedFromMessage(lastMsg);
            data[0].setURL(lastMsg.url);
            await msg.editReply({ embeds: [data[0]], files: data[1] === null ? [] : [data[1]] });
        } else if (msg.options.getSubcommand() === "reddit") {
            await msg.deferReply();
            await msg.editReply({ embeds: [Reddit.getEmbedForPost(await Reddit.getPost(msg.options.getString("url")))] });
        }
    }
}
