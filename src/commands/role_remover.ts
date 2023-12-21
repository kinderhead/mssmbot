import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, Role, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class RoleRemoverCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "role-remover"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Removes all roles from users with a certain role")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addRoleOption(opt => opt.setName("role").setRequired(true).setDescription("Role"));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply();

        const role = msg.options.getRole("role") as Role;

        for (const i of role.members.values()) {
            for (const e of i.roles.cache.values()) {
                try {
                    if (e.name === "@everyone" || e.id === role.id) continue;

                    await i.roles.remove(e, "Role purge");
                } catch (er) {
                    this.log.error("Error removing " + e.name + " from " + i.displayName + ". Most likely it is a role it can't remove");
                }
            }

            this.log.info("Finished removing roles from " + i.displayName);
        }

        await msg.editReply("hehe");
    }
}