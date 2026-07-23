import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { useQueue } from 'discord-player';

export function getVoiceChannel(interaction) {
  return interaction.member?.voice?.channel ?? null;
}

export function getQueue(interaction) {
  return useQueue(interaction.guildId);
}

export function isSameVoiceChannel(interaction, queue) {
  const memberChannel = getVoiceChannel(interaction);
  const botChannel = queue?.channel;
  return Boolean(memberChannel && botChannel && memberChannel.id === botChannel.id);
}

export function canManagePlayer(interaction, queue) {
  const isRequester = queue?.currentTrack?.requestedBy?.id === interaction.user.id;
  const isDj = interaction.member?.roles?.cache?.some(
    (role) => role.name.toLocaleLowerCase('id') === 'dj',
  );
  const canManageGuild = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
  return Boolean(isRequester || isDj || canManageGuild);
}

export async function replyPrivate(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral };
  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload);
  }
  return interaction.reply(payload);
}

export async function requireActiveQueue(interaction, { sameChannel = true } = {}) {
  const queue = getQueue(interaction);
  if (!queue?.currentTrack) {
    await replyPrivate(interaction, 'Belum ada musik yang sedang diputar.');
    return null;
  }

  if (sameChannel && !isSameVoiceChannel(interaction, queue)) {
    await replyPrivate(interaction, 'Masuk ke voice channel yang sama dengan Lunara dulu.');
    return null;
  }

  return queue;
}
