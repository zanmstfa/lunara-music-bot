function cleanPayload(payload) {
  if (typeof payload === 'string') {
    return {
      content: payload,
      allowedMentions: { repliedUser: false },
    };
  }

  const { flags: _flags, ...cleaned } = payload;
  return {
    ...cleaned,
    allowedMentions: cleaned.allowedMentions ?? { repliedUser: false },
  };
}

export function createPrefixInteraction(message, parsed) {
  let response = null;

  async function sendReply(payload) {
    response = await message.reply(cleanPayload(payload));
    return response;
  }

  return {
    commandName: parsed.commandName,
    options: {
      getString(name, required = false) {
        const value = parsed.options[name] ?? null;
        if (required && value === null) throw new Error(`Prefix option "${name}" belum diisi.`);
        return value;
      },
      getInteger(name, required = false) {
        const value = parsed.options[name] ?? null;
        if (required && value === null) throw new Error(`Prefix option "${name}" belum diisi.`);
        return value;
      },
    },
    guild: message.guild,
    guildId: message.guildId,
    channel: message.channel,
    channelId: message.channelId,
    client: message.client,
    member: message.member,
    memberPermissions: message.member?.permissions,
    user: message.author,
    isPrefixCommand: true,
    deferred: false,
    replied: false,

    async deferReply() {
      this.deferred = true;
      await message.channel.sendTyping().catch(() => null);
    },

    async reply(payload) {
      this.replied = true;
      return sendReply(payload);
    },

    async editReply(payload) {
      this.deferred = false;
      this.replied = true;
      if (response?.editable) return response.edit(cleanPayload(payload));
      return sendReply(payload);
    },

    async followUp(payload) {
      return message.channel.send(cleanPayload(payload));
    },
  };
}
