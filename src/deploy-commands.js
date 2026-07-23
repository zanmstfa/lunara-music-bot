import './env.js';

const [{ REST, Routes }, { commandData }, { config, validateConfig }] = await Promise.all([
  import('discord.js'),
  import('./commands/definitions.js'),
  import('./config.js'),
]);

validateConfig({ deploy: true });

const rest = new REST({ version: '10' }).setToken(config.token);
const route = config.devGuildId
  ? Routes.applicationGuildCommands(config.clientId, config.devGuildId)
  : Routes.applicationCommands(config.clientId);

console.log(`Mendaftarkan ${commandData.length} slash command...`);
await rest.put(route, { body: commandData });
console.log(config.devGuildId
  ? `Command aktif pada server pengembangan ${config.devGuildId}.`
  : 'Command global berhasil didaftarkan. Discord mungkin membutuhkan waktu untuk menampilkannya.');
