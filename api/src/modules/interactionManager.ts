import {
    Interaction,
    StringSelectMenuInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';
import { CommandHandlers as CommandHandlersType, colors } from '../types';
import * as CommandHandlers from '../commands';

const commandMap: Record<string, keyof typeof CommandHandlers> = {
    'play': 'playCommand',
    'info': 'infoCommand',
    'help': 'helpCommand',
    'stats': 'statsCommand',
    'currently-playing': 'currentlyplayingCommand',
    'currentlyplaying': 'currentlyplayingCommand',
    'pause': 'pauseCommand',
    'resume': 'pauseCommand',
    'pause-resume': 'pauseCommand',
    'skip': 'skipCommand',
    'queue': 'queueCommand',
    'stop': 'stopCommand',
    'volume': 'volumeCommand',
    'forceplay': 'forceplayCommand',
    'shuffle': 'shuffleCommand',
    'loop': 'loopCommand',
    'unloop': 'loopCommand',
    'loop-unloop': 'loopCommand',
    'previous': 'previousCommand',
    'lyrics': 'lyricsCommand',
};

export default {
    handleInteraction: async (interaction: Interaction) => {
        try {
            console.log(`[DEBUG interactionManager] Handling interaction: type=${interaction.type}`);
            if (interaction.isChatInputCommand() || interaction.isCommand()) {
                const commandInteraction = interaction as ChatInputCommandInteraction;
                const { commandName } = commandInteraction;
                console.log(`[Interaction] Received slash command: /${commandName}`);

                // Instantly defer reply within 50ms so Discord never times out ("The application did not respond")
                if (!commandInteraction.deferred && !commandInteraction.replied) {
                    await commandInteraction.deferReply({ ephemeral: true }).catch((err) => {
                        console.error('Failed to defer reply:', err);
                    });
                }

                const handlerName = commandMap[commandName] || (`${commandName.replace(/-/g, '')}Command` as keyof typeof CommandHandlers);
                const handler = CommandHandlers[handlerName] as ((i: ChatInputCommandInteraction) => Promise<void>) | undefined;

                if (handler) {
                    console.log(`[Interaction] Executing handler for /${commandName}`);
                    await handler(commandInteraction);
                    console.log(`[Interaction] Finished executing /${commandName}`);
                } else {
                    console.log(`No handler found for command: ${commandName}`);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription(`Command not found: /${commandName}`)
                        .setColor(colors.Error);

                    if (commandInteraction.deferred) {
                        await commandInteraction.editReply({ embeds: [errorEmbed] });
                    } else {
                        await commandInteraction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                }
            } else if (interaction.isButton()) {
                const buttonInteraction = interaction as ButtonInteraction;
                switch (buttonInteraction.customId) {
                    case 'previous_queue_page':
                    case 'next_queue_page':
                        await CommandHandlers.handleQueuePagination(buttonInteraction);
                        break;
                    case 'previous_page':
                    case 'next_page':
                        await CommandHandlers.handleHelpCommandPagination(buttonInteraction);
                        break;
                    case 'volume_down_10':
                    case 'volume_down_5':
                    case 'volume_up_5':
                    case 'volume_up_10':
                    case 'open_volume_modal':
                        await CommandHandlers.handleVolumeButton(buttonInteraction);
                        break;
                }
            } else if (interaction.isModalSubmit()) {
                const modalSubmitInteraction = interaction as ModalSubmitInteraction;
                if (modalSubmitInteraction.customId === 'custom_volume_modal') {
                    await CommandHandlers.handleVolumeModal(modalSubmitInteraction);
                }
            } else if (interaction.isStringSelectMenu()) {
                const selectMenuInteraction = interaction as StringSelectMenuInteraction;
                switch (selectMenuInteraction.customId) {
                    case 'force-song':
                        await CommandHandlers.handleForceplaySelectMenuInteraction(selectMenuInteraction);
                        break;
                    case 'select-song':
                        await CommandHandlers.handleSelectMenuInteraction(selectMenuInteraction);
                        break;
                }
            }
        } catch (error) {
            console.error('[CRITICAL ERROR in interactionManager]:', error);
        }
    },
};
