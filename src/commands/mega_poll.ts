import { ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import { createCustomId, quickActionRow } from "../lib/utils.js";
import MegaPollData from "../data/mega_poll.js";
import MSSM from "../mssm.js";
import MSSMUser from "../data/user.js";

export default class MegaPollCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "mega-poll"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Gives a user xp")
            .addStringOption(opt => opt.setName("title").setDescription("Title").setRequired(true))
            .addStringOption(opt => opt.setName("options").setDescription("A maximum of 9 options separated by a |. Example: Option 1|Option 2|Option 3").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        const title = msg.options.getString("title");
        const options = msg.options.getString("options").split("|");

        this.log.info(`Creating mega poll ${title}`);

        msg.reply("Boo").then(i => i.delete());

        const buttonId = createCustomId();
        const message = await msg.channel.send({
            embeds: [new EmbedBuilder().setTitle(title).setDescription(`Options: ${options.join(", ")}`)],
            components: [quickActionRow(new ButtonBuilder().setCustomId(buttonId).setLabel("Vote").setStyle(ButtonStyle.Success))]
        });

        const poll = await MegaPollData.create(this.bot, title, new Date(), msg.channelId, message.id, buttonId, options);

        this.bot.qotd.handleMegaPoll(poll);
    }
}
