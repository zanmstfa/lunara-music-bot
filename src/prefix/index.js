import { handlers } from '../commands/handlers.js';
import { createPrefixInteraction } from './adapter.js';
import { DEFAULT_PREFIX, parsePrefixCommand } from './parser.js';

export async function handlePrefixMessage(message, player, prefix = DEFAULT_PREFIX) {
  const parsed = parsePrefixCommand(message.content, prefix);
  if (!parsed) return false;

  if (parsed.error) {
    await message.reply({
      content: parsed.error,
      allowedMentions: { repliedUser: false },
    });
    return true;
  }

  const handler = handlers.get(parsed.commandName);
  if (!handler) return false;

  const interaction = createPrefixInteraction(message, parsed);
  await handler(interaction, player);
  return true;
}
