import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, channelMention } from "discord.js";
import Command from "../command.js";
import MSSMUser from "../data/user.js";
import { settingsHelper, values } from "../lib/utils.js";
import MSSM from "../mssm.js";

export default class ClubCommand extends Command<MSSMUser, MSSM> {
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

    public async execute(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        if (msg.options.getSubcommand() === "join") {
            await this.join(msg, user);
        } else if (msg.options.getSubcommand() === "leave") {
            await this.leave(msg, user);
        } else if (msg.options.getSubcommand() === "view") {
            await this.view(msg, user);
        } else if (msg.options.getSubcommand() === "manage") {
            await this.manage(msg, user);
        }
    }

    public async join(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });
        var club = values(this.bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var role = this.bot.getRole(club.role);

        if (role.members.has(msg.user.id)) {
            await msg.editReply("Already joined club");
            return;
        }

        await user.discord.roles.add(role);

        var channel = this.bot.getChannel(club.channel);
        await channel.send(`${user.discord.displayName} has joined!`);
        await msg.editReply(`Joined club! Check out their channel: ${channelMention(channel.id)}`);

        this.log.info(`${user.discord.displayName} has joined ${club.name}`);

        await this.bot.clubs.refreshClubs();
    }

    public async leave(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });
        var club = values(this.bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var role = this.bot.getRole(club.role);

        if (!role.members.has(msg.user.id)) {
            await msg.editReply("Not in club");
            return;
        }

        await user.discord.roles.remove(role);

        var channel = this.bot.getChannel(club.channel);
        await channel.send(`${user.discord.displayName} has left.`);
        await msg.editReply(`Left club :(`);

        this.log.info(`${user.discord.displayName} has left ${club.name}`);

        await this.bot.clubs.refreshClubs();
    }

    public async view(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        await msg.deferReply();
        var club = values(this.bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        await msg.editReply({ embeds: [this.bot.clubs.getClubEmbed(club)] });
    }

    public async manage(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });
        var club = values(this.bot.clubs.clubData).find(i => i.name === msg.options.getString("club"));

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        if (club.managerId !== user.id && !user.discord.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await msg.editReply("Unable to manage club");
            return;
        }

        await settingsHelper(user.discord, msg.editReply.bind(msg), this.bot, new EmbedBuilder().setTitle("Club Settings"), [
            { default: club.desc, name: "Description", desc: "", on_change: (i: string) => { club.desc = i } },
            { default: club.meetingTime ?? "TBD", name: "Meeting time", desc: "", on_change: (i: string) => { club.meetingTime = i } },
            { default: club.meetingLocation ?? "TBD", name: "Meeting location", desc: "", on_change: (i: string) => { club.meetingLocation = i } },
        ], false);

        await this.bot.clubs.refreshClubs();
    }

    public async autocomplete(cmd: AutocompleteInteraction<CacheType>): Promise<void> {
        const focusedValue = cmd.options.getFocused();
        const choices = this.bot.clubs.clubs;
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));

        await cmd.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    }
}
