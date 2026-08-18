import { CommandInteraction, InteractionReplyOptions, MessagePayload } from 'discord.js';

export async function sendReply(
    interaction: CommandInteraction,
    options: string | MessagePayload | InteractionReplyOptions,
) {
    if (interaction.deferred || interaction.replied) {
        return await interaction.editReply(options as any);
    }
    return await interaction.reply(options as any);
}
