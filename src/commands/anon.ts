import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, TextInputStyle } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { quickModal } from "../lib/utils.js";

export default class AnonCommand extends Command {
    public getName() { return "anon"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Post an anonymous message")
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        var txt = await quickModal("Message", "Text", "", TextInputStyle.Paragraph, msg, 2048);
        this.log.info(`${msg.user.id} anon msg`);
        msg.channel.send(txt);
    }
}
