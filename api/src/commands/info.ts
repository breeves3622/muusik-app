import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { colors } from '../types';

export default async (interaction: CommandInteraction) => {
    try {
        const embed = new EmbedBuilder()
            .setTitle('Muusik Information')
            .setDescription(
                `Information for [muusik.app](https://muusik.app), developed by [Jay](https://jayxtq.xyz) with love <3.

muusik.app is a free and open source Discord music bot which allows you to play your favourite music.
We have an interactive dashboard and plenty of features to keep you entertained.
For the whole list of our features, head on over to our [website](https://muusik.app).
If you are looking for our dashboard, you can find it [here](https://muusik.app/dashboard).

Bot Invite: https://muusik.app/invite
Discord Server: https://muusik.app/discord
Frontend Source: https://github.com/JayXTQ/muusik-web
Backend Source: https://github.com/JayXTQ/muusik-api

Thank you for using muusik.app!

If you wish to do so, you can donate at my Ko-Fi page: https://ko-fi.com/jxtq`,
            )
            .setColor(colors.Muusik);

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (err) {
        console.error('Error in info command:', err);
    }
};
