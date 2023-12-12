import { APIEmbedField, ColorResolvable, EmbedBuilder, channelMention, userMention } from "discord.js";
import mc from "minecraftstatuspinger";
import { ServerStatus } from "minecraftstatuspinger/dist/types.js";
import MSSM from "../mssm.js";

export function getInfoEmbeds(bot: MSSM) {
    return [
        new EmbedBuilder()
            .setTitle("MSSM Bot Info")
            .setDescription("MSSM Bot is still in beta and I add new features all the time. There will be issues.\nIf you see any MSSM Bot commands not listed here, then you are likely not supposed to see them.\n\nThere's room for more features, so if you come up with anything then tell the mods.\n\n<#1141371554077348021> is underneath this message.\n\nReport any bugs to <@861608223597002773>\nSource code: https://github.com/kinderhead/mssmbot")
            .setThumbnail(bot.client.user.displayAvatarURL())
            .setColor("White")
            .addFields(
                { name: "Leveling info", value: "Every time you post in a non blacklisted channel (bot channels) you gain 1 xp. You cannot gain xp from messages twice in 30 seconds. Some commands and actions give xp so look below to find more information.\nSince the level system is new there may be changes. Your level may increase or decrease without warning. Leveling up gives .25 counting saves." },
                { name: "Starboard info", value: `Once a message has more than 4 stars, it is posted to ${channelMention("739336559219703859")}. All star emojis (✨, ⭐, 🌟, 💫) contribute to the same total. Getting a message to starboard gives the author 10 xp.` }
            ),

        new EmbedBuilder()
            .setTitle("Question of the Day")
            .setDescription("Everyday at noon a question or poll is posted. Any polls still active are closed and the results are shown. The max question size is 256 characters because Discord.")
            .setColor("Blurple")
            .addFields(
                { name: "`/qotd ask <question>`", value: "Adds a question to the queue. This gives 5 xp." },
                { name: "`/qotd ask-fancy`", value: "Adds a customized question to the queue. This gives 5 xp." },
                { name: "`/qotd poll <title> [option1] [option2] [option3] [option4] [option5] [option6] [option7] [option8] [option9]`", value: "Adds a poll to the queue. This gives 8 xp. Answering polls gives 3 xp and .25 counting saves." },
                { name: "`/qotd manage`", value: "Accidentally put a typo in your question? Forgot to add an option to your poll? Just want to see your questions before they are posted? Use this command to manage all your question and poll needs.\n\nNote: the bot tries to cover all edge cases, but sometimes errors do happen. Don't try anything weird. Due to Discord's limitations, you will have to copy your question's or poll's title and options before editing. Always press cancel before running the command again, and beware that there is a time limit to make changes." },
                { name: "`/qotd doomsday`", value: "Finds the last day there will be a QOTD post if no more are added." }
            ),

        new EmbedBuilder()
            .setTitle("Gaming")
            .setDescription("Play various games with people here and compete for high scores on the leaderboard. Gain 15+ xp and 1 counting save when winning (subject to change). The whole system is very new and complicated so there will be bugs. Suggest games if you come up with anything.")
            .setColor("Green")
            .addFields(
                { name: "`/play <game> [quiet]`", value: "Start and play a game. If quiet is true then no one will be pinged (default false). Each game is contained within a thread, and the bot creates one for you when you run this command. The person who runs this command is the host and can run host only chat commands. Players can only be in one game at a time." },
                { name: "`/games active`", value: "Show all active games." },
                { name: "`/games history (chess)`", value: "Show all games that have occured. Only certain games support this." },
                { name: "`/hand`", value: "View private information sent by games. Some games will use this command as a user interface." },
                { name: "\u200B", value: "**Games**" },
                { name: "`uno`", value: "Max players: 16\n\nUno. Don't forget to say uno! If someone forgets remind them by saying uno. Winners gain 5 xp + the amount of people in the game." },
                { name: "`chess`", value: "Max players: 2\n\nChess. Games are uploaded to Lichess when completed. Time limits and score are WIP." }
            ),

        new EmbedBuilder()
            .setTitle("Clubs")
            .setDescription(`Some clubs have decided to move to Discord. The list of clubs can be found in <#1155497438623305769>.`)
            .setColor("Blue")
            .addFields(
                { name: "`/clubs join <club>`", value: "Join club." },
                { name: "`/clubs leave <club>`", value: "Leave club." },
                { name: "`/clubs manage <club>`", value: "Manage club. Only available to club managers (you know who you are)." },
            ),

        new EmbedBuilder()
            .setTitle("Counting")
            .setDescription(`Count away in the ${channelMention("742500057143574648")} channel.\nIf you manage to count incorrectly 10 times you get the \`can't count\` role.\nThe max number of saves you can store is 3.`)
            .setColor("Aqua")
            .addFields(
                { name: "`/counting highscore`", value: "Displays the current counting highscore." },
                { name: "`/counting check`", value: "Check what the next number is just in case something goes wrong." }
            ),

        new EmbedBuilder()
            .setTitle("Miscellaneous")
            .setColor("Gold")
            .addFields(
                // { name: "`/apply`", value: "Apply for mod." },
                { name: "`/settings`", value: "Various MSSM Bot settings." },
                { name: "`/status <user>`", value: "Shows information about the user." },
                { name: "`/whois <user>`", value: "Checks who a user is. Basically status with only the bio." },
                { name: "`/leaderboard`", value: "Shows various leaderboards" },
                { name: "`/anon`", value: "Send an anonymous message. Good for <#739955844837277717>." },
                { name: "`/tools embed-builder`", value: "Create and save special bot messages." },
                { name: "`/tools message-count`", value: "Displays the number of messages sent today." },
                { name: "`/tools msg-converter`", value: "Transforms the last sent message into an embed." },
                { name: "`/help`", value: "Displays this message." }
            )
    ];
}

export function getModInfoEmbeds(bot: MSSM) {
    return [
        new EmbedBuilder()
            .setTitle("MSSM Bot Mod Info")
            .setDescription("These are all of the mod only commands. If you want more control (because many things are hard coded and should not be) then I can add more commands.")
            .setThumbnail(bot.client.user.displayAvatarURL())
            .setColor("White"),

        new EmbedBuilder()
            .setTitle("QOTD")
            .setDescription(`Varios QOTD related commands.`)
            .setColor("Aqua")
            .addFields(
                { name: "`/qotd-queue`", value: "Displays the QOTD queue." },
                { name: "`/qotd-send`", value: "Sends the next QOTD post." },
                { name: "`/qotd-close-poll <id>`", value: "Close a poll and release the results with the given ID. The ID can be found in the footer of QOTD messages." },
                { name: "`/qotd manage > Hijack`", value: "When editing your QOTD posts you can move it to the top if necessary." },
            ),

        new EmbedBuilder()
            .setTitle("Meta questions")
            .setDescription(`Post and manage meta questions.`)
            .setColor("Green")
            .addFields(
                { name: "`/meta-board post <question>`", value: "Posts a question in the #meta-questions-board channel." },
                { name: "`/meta-board poll <title> <options>`", value: "Posts a poll just like QOTD in the #meta-questions-board channel." },
                { name: "`/meta-board manage`", value: "Manage all posts." },
            ),

        new EmbedBuilder()
            .setTitle("Channel setups")
            .setDescription(`Sets up a few custom channels' features.`)
            .setColor("Yellow")
            .addFields(
                { name: "`/set-info pleb`", value: "Creates and remembers the #mssm-bot-info message in the channel." },
                { name: "`/set-info mod`", value: "Creates and remembers the mod only #mssm-bot-info message in the channel." },
                { name: "`/set-count`", value: "Sets the counting channel and starts the count." },
                { name: "`/set-rules`", value: "Sets the rules channel and sends the rules." },
            ),

        new EmbedBuilder()
            .setTitle("Miscellaneous")
            .setColor("Gold")
            .addFields(
                { name: "`/kill`", value: "Panic stops the bot." },
                { name: "`/role-remover <role>`", value: "Removes the roles of all users with a certain role." },
                { name: "`/add-xp <user> <amount>`", value: "Gives a user an amount of xp. The amount can be negative to remove xp. Don't use this to give xp to yourself." },
                { name: "`/archive <channel>`", value: "Archive a channel." },
                { name: "`/log <message> [severity]`", value: "Sends a message in #bot-log." },
            ),
    ];
}

export async function getMinecraftEmbeds(bot: MSSM) {
    var res: ServerStatus;
    var color: ColorResolvable;
    var desc: string;
    var fields: APIEmbedField[] = [];

    try {
        res = await mc.lookup({ host: "24.39.61.178" });
        color = "Green";
        desc = `${res.status.players.online}/${res.status.players.max}`;

        if (res.status.players.sample) {
            for (const i of res.status.players.sample) {
                var user = bot.getAllMembers().find(e => e.minecraft_username === i.name);

                if (user) {
                    fields.push({ name: i.name, value: userMention(user.id), inline: true });
                } else {
                    fields.push({ name: i.name, value: "\u200B", inline: true });
                }
            }
        }
    } catch {
        color = "Red";
        desc = "Server offline";
    }

    return [
        new EmbedBuilder()
            .setTitle("Skyfactory 4 Server")
            .setColor("DarkGold")
            .setDescription("[Modpack download link](https://legacy.curseforge.com/minecraft/modpacks/skyfactory-4)\nNon MSSM ip address: 24.39.61.178\nLocal MSSM ip address: 192.168.15.254\n\nFor the time being, you need a Minecraft account to join (rip Xavier)."),
        new EmbedBuilder()
            .setTitle("Server Status")
            .setColor(color)
            .setDescription(desc)
            .setFields(...fields)
            .setFooter({ text: "To connect your Minecraft and Discord accounts use /settings" }),
        new EmbedBuilder()
            .setTitle("Commands")
            .setColor("Blue")
            .addFields(
                { name: "`/topography spawn`", value: "Teleport to spawn. Players are encouraged to build around spawn." },
                { name: "`/topography island home`", value: "Teleport to your island. This will create an island if you don't have one." },
                { name: "`/topography invite <player>`", value: "Invite a player to your island." },
                { name: "`/topography accept`", value: "Accept a player's invite." },
                { name: "`/tofe invite <player>`", value: "Invite a player to share achievements with you. I'd recommend doing this if you invite a player to join your island." },
                { name: "`/tofe info`", value: "Shows info about your team." },
            )
    ];
}

export function getClubEmbed() {
    return new EmbedBuilder()
        .setTitle("Clubs")
        .setDescription("These clubs have decided to be added to the MSSM Discord server. Message a mod if you want your club to be added.\n\nTo join a club use `/join club`.")
}