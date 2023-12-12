import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class LogCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "log"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Send a message in #bot-log because why not")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addStringOption(opt => opt.setName("message").setDescription("Message to send").setRequired(true))
            .addStringOption(opt => opt.setName("severity").setDescription("Option log level, anything less than INFO will not show in #bot-log. Default INFO")
                .setChoices(
                    { name: "SILLY", value: "SILLY" },
                    { name: "DEBUG", value: "DEBUG" },
                    { name: "INFO", value: "INFO" },
                    { name: "WARN", value: "WARN" },
                    { name: "ERROR", value: "ERROR" },
                    { name: "FATAL", value: "FATAL" },
                ).setRequired(false)
            );
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        var severity = msg.options.getString("severity", false);
        switch (severity == null ? "INFO": severity) {
            case "SILLY":
                this.log.silly(msg.options.getString("message"));
                break;
            
            case "DEBUG":
                this.log.debug(msg.options.getString("message"));
                break;
            
            case "INFO":
                this.log.info(msg.options.getString("message"));
                break;
            
            case "WARN":
                this.log.warn(msg.options.getString("message"));
                break;
            
            case "ERROR":
                this.log.error(msg.options.getString("message"));
                break;
            
            case "FATAL":
                this.log.fatal(msg.options.getString("message"));
                break;
            
            default:
                break;
        }

        (await msg.deferReply()).delete();
    }
}
