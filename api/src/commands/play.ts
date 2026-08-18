import {
    ActionRowBuilder,
    CommandInteraction,
    GuildMember,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    VoiceBasedChannel,
    EmbedBuilder,
} from 'discord.js';
import { player } from '../instance';
import { default as fetchSongNamesFromLastFM } from '../utils/fetchSongNamesFromLastFM';
import { default as playlinks } from '../utils/fetchPlaylinks';
import axios from 'axios';
import { colors } from '../types';
import { sendReply } from '../utils/sendReply';

function spacesToPlus(str: string) {
    return str.replace(/ /g, '+');
}

export default async (interaction: CommandInteraction) => {
    if (interaction.commandName === 'play') {
        const query = interaction.options.get('query')?.value as string;

        if (!query) {
            const embed = new EmbedBuilder()
                .setColor(colors.Error)
                .setDescription('Please provide a search query.');
            return sendReply(interaction, { embeds: [embed], ephemeral: true });
        }

        const member = interaction.member as GuildMember;
        const voiceChannel = member?.voice?.channel as VoiceBasedChannel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(colors.Error)
                .setDescription('You need to be in a voice channel to play music!');
            return sendReply(interaction, { embeds: [embed] });
        }

        // Direct URL or playlist
        if (
            query.startsWith('http://') ||
            query.startsWith('https://') ||
            query.includes('spotify.com') ||
            query.includes('youtube.com') ||
            query.includes('youtu.be') ||
            query.includes('soundcloud.com')
        ) {
            if (
                query.includes('spotify.com/playlist') ||
                query.startsWith(
                    `http${process.env.DEV ? '://localhost:5173' : 's://muusik.app'}/playlist/`,
                )
            ) {
                await handlePlaylist(interaction, query, voiceChannel);
            } else {
                try {
                    const embed = new EmbedBuilder()
                        .setColor(colors.Muusik)
                        .setDescription(`Loading: **${query}**`);
                    await sendReply(interaction, { embeds: [embed] });

                    await player.play(voiceChannel, query, {
                        requestedBy: interaction.user.id,
                    });
                } catch (error) {
                    console.error('Error playing direct link:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor(colors.Error)
                        .setDescription('Failed to play the requested track/URL.');
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        } else {
            // Text search
            const songs = await fetchSongNamesFromLastFM(query);

            if (!songs || songs.length === 0) {
                try {
                    const embed = new EmbedBuilder()
                        .setColor(colors.Muusik)
                        .setDescription(`Searching and playing: **${query}**`);
                    await sendReply(interaction, { embeds: [embed] });

                    await player.play(voiceChannel, query, {
                        requestedBy: interaction.user.id,
                    });
                } catch (err) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(colors.Error)
                        .setDescription(`No playable tracks found for **${query}**.`);
                    await sendReply(interaction, { embeds: [errorEmbed] });
                }
                return;
            }

            const options = songs
                .slice(0, 25)
                .map((song) => ({
                    label: song.name,
                    description: song.artist,
                    value: song.url.replace(
                        'https://www.last.fm/music/',
                        '',
                    ) as string,
                }))
                .filter((song) => song.value.length < 100);

            if (options.length === 0) {
                try {
                    await player.play(voiceChannel, query, {
                        requestedBy: interaction.user.id,
                    });
                } catch (err) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(colors.Error)
                        .setDescription(`No playable tracks found for **${query}**.`);
                    await sendReply(interaction, { embeds: [errorEmbed] });
                }
                return;
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-song')
                .setPlaceholder('Select a song')
                .addOptions(options);

            const row =
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    selectMenu,
                );

            const embed = new EmbedBuilder()
                .setColor(colors.Muusik)
                .setDescription('Choose a song from the list:');

            await sendReply(interaction, {
                embeds: [embed],
                components: [row],
            });
        }
    }
};

export async function handleSelectMenuInteraction(
    interaction: StringSelectMenuInteraction,
) {
    if (interaction.customId === 'select-song') {
        const url = `https://www.last.fm/music/${interaction.values[0]}`;
        const links = await playlinks(url);
        const link =
            links.find((link) => link.includes('spotify')) || links[0] || null;

        if (!link) {
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.Error)
                .setDescription('No playable links found.');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        let songName: string = '';
        let authorName: string = '';
        let songUrl: string = '';

        try {
            await axios
                .get(
                    `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${process.env.LASTFM_API_KEY}&artist=${spacesToPlus(decodeURIComponent(url).replace('https://www.last.fm/music/', '').split('/')[0])}&track=${spacesToPlus(decodeURIComponent(url).replace('https://www.last.fm/music/', '').split('/')[2])}&format=json`,
                )
                .then((r) => {
                    if (r.status !== 200) {
                        songName = 'Unknown';
                    }
                    songName = `${r.data.track.name}`;
                    authorName = r.data.track.artist.name;
                    songUrl = r.data.track.url;
                });
        } catch (error: any) {
            songName = 'Unknown';
            authorName = 'Unknown';
        }

        try {
            const member = interaction.member as GuildMember;
            const voiceChannel = member?.voice?.channel as VoiceBasedChannel;

            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setColor(colors.Error)
                    .setDescription(
                        'You need to be in a voice channel to play music!',
                    );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const node = player.nodes.get(voiceChannel.guild.id);
            let queuePosition = 0;
            let currentlyPlaying = node?.currentTrack ? true : false;

            if (node && node.tracks.data.length > 0) {
                queuePosition = node.tracks.data.length;
            }

            const embed = new EmbedBuilder()
                .setColor(colors.Muusik)
                .setDescription(
                    currentlyPlaying
                        ? (songName === 'Unknown' && authorName === 'Unknown' ? `Unknown song added to the queue, position ${queuePosition + 1}` : `[${songName} by ${authorName}](${songUrl}) added to queue, position ${queuePosition + 1}`)
                        : `Now playing [${songName} by ${authorName}](${songUrl})`,
                );
            await interaction.reply({ embeds: [embed], ephemeral: true });

            await player.play(voiceChannel, link, {
                requestedBy: interaction.user.id,
            });
        } catch (error) {
            console.error('Error handling the song selection:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.Error)
                .setDescription(
                    'There was an error processing your selection.',
                );
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handlePlaylist(
    interaction: CommandInteraction,
    playlistUrl: string,
    voiceChannel: VoiceBasedChannel,
) {
    const skippedTracks = [];

    try {
        if (
            playlistUrl.startsWith(
                `http${process.env.DEV ? '://localhost:5173' : 's://muusik.app'}/playlist/`,
            )
        ) {
            const data = await axios.get(`${playlistUrl}/data`);
            const tracks = data.data.songs;

            const embed = new EmbedBuilder()
                .setColor(colors.Muusik)
                .setDescription(`Playing muusik playlist: ${playlistUrl}`);

            await sendReply(interaction, { embeds: [embed] });

            for (const track of tracks) {
                try {
                    await player.play(voiceChannel, track.url, {
                        requestedBy: interaction.user.id,
                    });
                } catch (error) {
                    console.error('Error playing track:', track.url, error);
                    skippedTracks.push(
                        `[${track.metadata.name}, ${track.metadata.artist}](<${track.url}>)`,
                    );
                }
            }
        } else if (playlistUrl.includes('spotify.com/playlist/')) {
            const embed = new EmbedBuilder()
                .setColor(colors.Muusik)
                .setDescription(`Playing Spotify playlist: ${playlistUrl}`);

            await sendReply(interaction, { embeds: [embed] });
            try {
                await player.play(voiceChannel, playlistUrl, {
                    requestedBy: interaction.user.id,
                });
            } catch (error) {
                console.error('Error playing Spotify playlist:', error);
                const embed = new EmbedBuilder()
                    .setColor(colors.Error)
                    .setDescription(
                        'There was an error playing the Spotify playlist.',
                    );
                await interaction.followUp({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
        } else {
            const embed = new EmbedBuilder()
                .setColor(colors.Error)
                .setDescription(`Invalid playlist URL: ${playlistUrl}`);
            await sendReply(interaction, { embeds: [embed] });
        }

        if (skippedTracks.length > 0) {
            const skippedTracksEmbed = new EmbedBuilder()
                .setColor(colors.Muusik)
                .setDescription(
                    `Playlist processed. Skipped tracks:\n${skippedTracks.join('\n')}`,
                );
            await interaction.followUp({
                embeds: [skippedTracksEmbed],
                ephemeral: true,
            });
        }
    } catch (error) {
        console.error('Error playing the playlist:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor(colors.Error)
            .setDescription('There was an error processing the playlist.');
        await sendReply(interaction, { embeds: [errorEmbed] });
    }
}
