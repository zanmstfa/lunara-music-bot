# Lunara Music Bot

Bot musik Discord full JavaScript yang terinspirasi oleh pengalaman pakai Jockie Music, tetapi punya identitas dan alur sendiri: **Mood Radio**, vote skip, preset audio, lirik, sumber cadangan, dan panel kontrol tombol.

## Yang sudah tersedia

- Pencarian judul memprioritaskan katalog Spotify. URL Spotify, SoundCloud, Apple Music, Vimeo, dan attachment audio tetap didukung.
- Queue, playlist, pause, previous, seek, shuffle, move, remove, volume, dan empat mode loop.
- Koneksi voice modern dengan dukungan enkripsi end-to-end Discord DAVE.
- Panel **Now Playing** dengan tombol previous, pause, skip, loop, dan stop.
- **Vote skip 50%** dari pendengar manusia; peminta lagu bisa skip langsung.
- **Mood Radio**: Chill, Focus, Party, Galau, dan Nusantara. Mode ini mengaktifkan autoplay lagu serupa.
- Preset efek: Bass Boost, Nightcore, Vaporwave, Karaoke, 8D, dan Lo-fi.
- Pencarian lirik melalui LRCLIB, termasuk lampiran `.txt` jika lirik terlalu panjang.
- Kontrol DJ: peminta lagu, role bernama `DJ`, atau member dengan izin Manage Server.
- Keluar otomatis jika voice channel kosong.
- Tidak membutuhkan Message Content Intent karena seluruh kontrol memakai slash command.

## Kebutuhan

- Node.js 22.12 atau lebih baru.
- Aplikasi bot dari [Discord Developer Portal](https://discord.com/developers/applications).
- FFmpeg. Dependency `ffmpeg-static` disertakan; Dockerfile juga memasang FFmpeg sistem.

## Menjalankan secara lokal

1. Buka folder proyek dan pasang dependency:

   ```bash
   npm install
   ```

2. Salin `.env.example` menjadi `.env`, lalu isi:

   ```env
   DISCORD_TOKEN=token_bot
   CLIENT_ID=id_aplikasi
   DEV_GUILD_ID=id_server_tes
   ```

   `DEV_GUILD_ID` disarankan saat pengembangan karena command akan muncul hampir seketika. Hapus nilainya ketika ingin mendaftarkan command secara global.

3. Daftarkan slash command:

   ```bash
   npm run deploy
   ```

4. Jalankan bot:

   ```bash
   npm start
   ```

   Untuk pengembangan dengan restart otomatis:

   ```bash
   npm run dev
   ```

## Mengundang bot

Pada menu **OAuth2 → URL Generator** di Discord Developer Portal:

- Pilih scope `bot` dan `applications.commands`.
- Berikan izin minimal: View Channels, Send Messages, Embed Links, Attach Files, Connect, Speak, dan Use Application Commands.

Lunara hanya memerlukan intent **Guilds** dan **Guild Voice States**.

## Command

| Command | Fungsi |
|---|---|
| `/play` | Cari lagu atau masukkan URL/playlist |
| `/mood` | Mulai radio berdasarkan suasana |
| `/pause` | Jeda atau lanjut |
| `/skip` | Vote skip |
| `/previous` | Putar lagu sebelumnya |
| `/stop` | Hentikan sesi dan kosongkan antrean |
| `/queue` | Lihat antrean per halaman |
| `/nowplaying` | Tampilkan panel lagu aktif |
| `/volume` | Atur volume 1–100 |
| `/loop` | Off, track, queue, atau autoplay |
| `/shuffle` | Acak antrean |
| `/seek` | Lompat ke detik atau format `mm:ss` |
| `/filter` | Terapkan preset audio |
| `/lyrics` | Cari lirik lagu aktif |
| `/remove` | Hapus lagu dari antrean |
| `/move` | Pindahkan posisi lagu |
| `/help` | Ringkasan command |

## Menjalankan dengan Docker

Pastikan `.env` sudah tersedia, lalu:

```bash
docker build -t lunara-music .
docker run --env-file .env --restart unless-stopped lunara-music
```

## Konfigurasi opsional

| Variable | Default | Keterangan |
|---|---:|---|
| `DEFAULT_VOLUME` | `70` | Volume awal, 1–100 |
| `LEAVE_ON_EMPTY_MS` | `300000` | Waktu tunggu sebelum keluar dari channel kosong |
| `MAX_PLAYLIST_SIZE` | `100` | Batas lagu dari satu playlist |
Jangan pernah memasukkan `.env` ke Git. `.gitignore` sudah disiapkan.

## Catatan sumber audio

Saat kamu mengetik judul lagu, Lunara mencari kecocokan di katalog Spotify terlebih dahulu agar judul, artis, sampul, dan tautannya konsisten. Spotify tidak menyediakan stream audio langsung untuk bot Discord, jadi Discord Player menjembatani hasil tersebut ke SoundCloud untuk audionya. URL sumber lain tetap dideteksi otomatis.

Pemilik bot bertanggung jawab mematuhi ketentuan layanan sumber musik dan aturan hak cipta yang berlaku.

## Pemeriksaan

```bash
npm run check
```

Perintah ini menjalankan pemeriksaan sintaks entry point dan seluruh unit test untuk parser waktu, vote skip, serta kesesuaian slash command dengan handler.
