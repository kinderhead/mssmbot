import { Command, quickModal } from "botinator";
import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, TextInputStyle } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class AnonCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "anon"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Post an anonymous message")
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        var txt = await quickModal("Message", "Text", "", TextInputStyle.Paragraph, msg, 2048);
        txt = txt.replace(/[^\x00-\x7F]/g, "");

        if (txt.trim() == "") {
            return;
        }

        this.log.info(`${msg.user.id} anon msg`);
        msg.channel.send(txt);
    }
}
