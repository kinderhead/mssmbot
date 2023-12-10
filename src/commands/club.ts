import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, channelMention } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import MSSMUser from "../data/user.js";
import { settingsHelper, values } from "../lib/utils.js";

export default class ClubCommand extends Command {
    public getName() { return "clubs"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Join and manage clubs")
            .addSubcommand(sbc => sbc
                .setName("join")
                .setDescription("Join a club")
                .addStringOption(opt => opt.setName("club").setDescription("Club to join").setRequired(true).setAutocomplete(true))
            )
            .addSubcommand(sbc => sbc
                .setName("leave")
                .setDescription("Leave a club")
                .addStringOption(opt => opt.setName("club").setDescription("Club to leave").setRequired(true).setAutocomplete(true))
            )
            .addSubcommand(sbc => sbc
                .setName("view")
                .setDescription("View club information")
                .addStringOption(opt => opt.setName("club").setDescription("Club to check").setRequired(true).setAutocomplete(true))
            )
            .addSubcommand(sbc => sbc
                .setName("manage")
                .setDescription("Manage a club")
                .addStringOption(opt => opt.setName("club").setDescription("Club to manage").setRequired(true).setAutocomplete(true))
            );
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        if (msg.options.getSubcommand() === "join") {
            await this.join(msg, bot, user);
        } else if (msg.options.getSubcommand() === "leave") {
            await this.leave(msg, bot, user);
        } else if (msg.options.getSubcommand() === "view") {
            await this.view(msg, bot, user);
        } else if (msg.options.getSubcommand() === "manage") {
            await this.manage(msg, bot, user);
        }
    }

    public async join(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });
        var club = values(bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var role = bot.getRole(club.role);

        if (role.members.has(msg.user.id)) {
            await msg.editReply("Already joined club");
            return;
        }

        await user.discord.roles.add(role);

        var channel = bot.getChannel(club.channel);
        await channel.send(`${user.discord.displayName} has joined!`);
        await msg.editReply(`Joined club! Check out their channel: ${channelMention(channel.id)}`);

        this.log.info(`${user.discord.displayName} has joined ${club.name}`);

        await bot.clubs.refreshClubs();
    }

    public async leave(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });
        var club = values(bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var role = bot.getRole(club.role);

        if (!role.members.has(msg.user.id)) {
            await msg.editReply("Not in club");
            return;
        }

        await user.discord.roles.remove(role);

        var channel = bot.getChannel(club.channel);
        await channel.send(`${user.discord.displayName} has left.`);
        await msg.editReply(`Left club :(`);

        this.log.info(`${user.discord.displayName} has left ${club.name}`);

        await bot.clubs.refreshClubs();
    }

    public async view(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        await msg.deferReply();
        var club = values(bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        await msg.editReply({ embeds: [bot.clubs.getClubEmbed(club)] });
    }

    public async manage(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });
        var club = values(bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        if (club.managerId !== user.id && !user.discord.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await msg.editReply("Unable to manage club");
            return;
        }

        await settingsHelper(user.discord, msg.editReply.bind(msg), bot, new EmbedBuilder().setTitle("Club Settings"), [
            { default: club.desc, name: "Description", desc: "", on_change: (i: string) => { club.desc = i } },
            { default: club.meetingTime ?? "TBD", name: "Meeting time", desc: "", on_change: (i: string) => { club.meetingTime = i } },
            { default: club.meetingLocation ?? "TBD", name: "Meeting location", desc: "", on_change: (i: string) => { club.meetingLocation = i } },
        ], false);

        await bot.clubs.refreshClubs();
    }

    public async autocomplete(cmd: AutocompleteInteraction<CacheType>, bot: MSSM): Promise<void> {
        const focusedValue = cmd.options.getFocused();
        const choices = bot.clubs.clubs;
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));

        await cmd.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    }
}
