import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { ActivityType, REST, Routes } from 'discord.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import axios from 'axios';
import {
    client,
    player,
    voiceStates,
    updates,
    updatesTimeout,
    onlineSince,
    setOnlineSince,
} from './instance';
import * as routeHandlers from './routes/index';
import { default as interactionManager } from './modules/interactionManager';
import {
    audioTrackAdd,
    playerFinish,
    playerPause,
    playerResume,
    playerSkip,
    playerStart,
    volumeChange,
} from './player_events';

export {
    client,
    player,
    voiceStates,
    updates,
    updatesTimeout,
    onlineSince,
    setOnlineSince,
};

player.extractors.loadDefault();

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member && newState.channelId) {
        if (!client.guilds.cache.get(newState.guild.id))
            await client.guilds.fetch();
        if (!client.users.cache.get(newState.member.user.id))
            await client.users.fetch(newState.member.user.id);
        voiceStates.set(newState.member.user.id, {
            guild_id: newState.guild.id,
            channel_id: newState.channelId,
        });
    } else if (oldState.member) {
        if (!client.guilds.cache.get(oldState.guild.id))
            await client.guilds.fetch();
        if (!client.users.cache.get(oldState.member.user.id))
            await client.users.fetch(oldState.member.user.id);
        if (oldState.member.user.id) {
            voiceStates.delete(oldState.member.user.id);
        }
    }
});

client.on('ready', async () => {
    console.log(`[Bot Ready] Logged in as ${client.user?.tag} (ID: ${client.user?.id})`);
    console.log(player.scanDeps());
    setOnlineSince(Date.now());

    try {
        const appId = client.user?.id || process.env.CLIENT_ID;
        if (process.env.TOKEN && appId) {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            const commandsData = JSON.parse(
                await fs.promises.readFile(path.join(process.cwd(), 'commands.json'), 'utf-8'),
            );
            
            // 1. Register global commands
            await rest.put(Routes.applicationCommands(appId), {
                body: commandsData,
            });
            console.log('Successfully registered global application (/) commands.');

            // 2. Register instant guild commands for all currently joined guilds (bypasses 1-hour Discord global cache delay)
            for (const guild of Array.from(client.guilds.cache.values())) {
                try {
                    await rest.put(Routes.applicationGuildCommands(appId, guild.id), {
                        body: commandsData,
                    });
                    console.log(`Successfully registered INSTANT slash commands for guild: ${guild.name} (${guild.id})`);
                } catch (gErr) {
                    console.error(`Failed registering instant guild commands for ${guild.name}:`, gErr);
                }
            }
        }
    } catch (cmdError) {
        console.error('Error auto-registering application commands:', cmdError);
    }

    client.user?.setPresence({
        activities: [
            {
                name: 'music for everyone',
                type: ActivityType.Streaming,
                url: 'https://twitch.tv/jxtq',
            },
        ],
    });
    if (process.env.TOPGG_TOKEN && process.env.TOPGG_TOKEN !== 'TOPGG_TOKEN') {
        await axios.post(
            `https://top.gg/api/bots/${process.env.CLIENT_ID}/stats`,
            {
                server_count: client.guilds.cache.size,
            },
            {
                headers: {
                    Authorization: process.env.TOPGG_TOKEN,
                },
            },
        );
    }
});

client.on('guildCreate', async (guild) => {
    try {
        const appId = client.user?.id || process.env.CLIENT_ID;
        if (appId && process.env.TOKEN) {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            const commandsData = JSON.parse(
                await fs.promises.readFile(path.join(process.cwd(), 'commands.json'), 'utf-8'),
            );
            await rest.put(Routes.applicationGuildCommands(appId, guild.id), {
                body: commandsData,
            });
            console.log(`Registered instant guild commands on join for guild: ${guild.name}`);
        }
    } catch (e) {
        console.error('Error registering commands on guild join:', e);
    }
});

client.on('interactionCreate', async (interaction) => {
    console.log(`[DEBUG index.ts] Raw interaction event received! ID: ${interaction.id}, Type: ${interaction.type}`);
    try {
        await interactionManager.handleInteraction(interaction);
    } catch (err) {
        console.error('[CRITICAL ERROR in interactionCreate]:', err);
    }
});

const token = process.env.TOKEN;

if (!token) {
    throw new Error('TOKEN is not defined in the environment variables');
}

const app = new Hono();

const dev = process.env.NODE_ENV !== 'production';

app.get('/', (c) => c.redirect('https://muusik.app'));
routeHandlers.auth_type(app, dev);
routeHandlers.check_permissions(app, client);
routeHandlers.check_playing(app, client, voiceStates, player);
routeHandlers.current_song(app, client, voiceStates, player);
routeHandlers.find_song(app);
routeHandlers.find_user(app, client, voiceStates);
routeHandlers.get_playlinks(app);
routeHandlers.get_roles(app, client);
routeHandlers.get_user(app, client);
routeHandlers.pause(app, client, voiceStates, player);
routeHandlers.play(app, client, voiceStates, player);
routeHandlers.playlist(app, client, voiceStates, player, dev);
routeHandlers.queue(app, client, player, voiceStates);
routeHandlers.scrobble(app);
routeHandlers.session_type(app);
routeHandlers.skip(app, client, voiceStates, player);
routeHandlers.song_info(app);
routeHandlers.shuffle(
    app,
    client,
    voiceStates,
    player,
    updates,
    updatesTimeout,
);
routeHandlers.get_owner(app, client, voiceStates);
routeHandlers.volume(app, player, voiceStates);
routeHandlers.updates(app, voiceStates, updates);
routeHandlers.previous(app, client, player, voiceStates);
routeHandlers.move_track(
    app,
    player,
    voiceStates,
    updates,
    updatesTimeout,
    client,
);

const port = Number(process.env.PORT || 8000);
serve({ port, fetch: app.fetch });
console.log(`Server listening on port ${port}`);

client.login(process.env.TOKEN);

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

player.on('error', (error) => {
    console.error('Player Error:', error);
});

audioTrackAdd();
playerFinish();
playerPause();
playerResume();
playerSkip();
playerStart();
volumeChange();
