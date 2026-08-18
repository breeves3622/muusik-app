import { Client, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';

export const client = new Client({
    intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

export const player = new Player(client);

export const voiceStates = new Map<
    string,
    { guild_id: string; channel_id: string }
>();

export const updates = new Map<
    string,
    { track: boolean; volume: boolean; queue: boolean; paused: boolean }
>();

export const updatesTimeout = new Map<string, NodeJS.Timeout>();

export let onlineSince: number = Date.now();

export function setOnlineSince(time: number) {
    onlineSince = time;
}
