# Lunara Music Bot

Bot musik Discord full JavaScript yang terinspirasi oleh pengalaman pakai Jockie Music, tetapi punya identitas dan alur sendiri: **Mood Radio**, vote skip, preset audio, lirik, sumber cadangan, dan panel kontrol tombol.

## Versi 1.2

- Prefix command `l!` tersedia berdampingan dengan slash command.
- Gunakan `l!p` untuk play, `l!s` untuk skip, `l!stop` untuk menghentikan sesi, dan `l!help` untuk melihat semua command.
- Input prefix divalidasi sebelum diteruskan ke pemutar, jadi salah format akan mendapat contoh pemakaian.
- Prefix dapat diganti melalui `BOT_PREFIX`, dengan default tetap `l!`.

## Versi 1.1

- Pencarian teks tetap memakai katalog Spotify untuk judul, artis, sampul, dan tautan.
- Lunara membandingkan hingga 10 kandidat SoundCloud sebelum memilih audio.
- Skor kecocokan mempertimbangkan judul, artis, selisih durasi, serta ketersediaan transcoding berkualitas tinggi.
- Cover, karaoke, live, remix, slowed, nightcore, dan versi lain tidak dipilih kecuali memang tertulis pada judul Spotify.
- Jika pencocokan pintar tidak menemukan hasil yang layak, Lunara kembali ke pencarian standar supaya command tetap berjalan.
- URL playlist Spotify tetap dimuat sebagai playlist dan tidak dipotong menjadi satu lagu.

## Yang sudah tersedia

- Pencarian judul memprioritaskan katalog Spotify dengan pencocokan audio SoundCloud yang mempertimbangkan judul, artis, durasi, versi, dan kualitas transcoding. URL Spotify, SoundCloud, Apple Music, Vimeo, dan attachment audio tetap didukung.
- Queue, playlist, pause, previous, seek, shuffle, move, remove, volume, dan empat mode loop.
- Koneksi voice modern dengan dukungan enkripsi end-to-end Discord DAVE.
- Panel **Now Playing** dengan tombol previous, pause, skip, loop, dan stop.
- **Vote skip 50%** dari pendengar manusia; peminta lagu bisa skip langsung.
- **Mood Radio**: Chill, Focus, Party, Galau, dan Nusantara. Mode ini mengaktifkan autoplay lagu serupa.
- Preset efek: Bass Boost, Nightcore, Vaporwave, Karaoke, 8D, dan Lo-fi.
- Pencarian lirik melalui LRCLIB, termasuk lampiran `.txt` jika lirik terlalu panjang.
- Kontrol DJ: peminta lagu, role bernama `DJ`, atau member dengan izin Manage Server.
- Keluar otomatis jika voice channel kosong.
- Slash command dan prefix command `l!` dapat dipakai berdampingan.

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
   BOT_PREFIX=l!
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
- Berikan izin minimal: View Channels, Send Messages, Read Message History, Embed Links, Attach Files, Connect, Speak, dan Use Application Commands.

Karena prefix membaca pesan biasa, buka menu **Bot → Privileged Gateway Intents**, aktifkan **Message Content Intent**, lalu tekan **Save Changes**. Lunara juga memakai intent **Guilds**, **Guild Messages**, dan **Guild Voice States** dari kode.

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

## Prefix command

| Prefix | Fungsi |
|---|---|
| `l!p <judul atau URL>` | Cari lagu atau tambahkan playlist |
| `l!mood <pilihan>` | Mulai Mood Radio: chill, focus, party, galau, atau nusantara |
| `l!pause` | Jeda atau lanjut |
| `l!s` | Vote skip |
| `l!prev` | Putar lagu sebelumnya |
| `l!stop` | Hentikan sesi dan kosongkan antrean |
| `l!q [halaman]` | Lihat antrean |
| `l!np` | Tampilkan panel lagu aktif |
| `l!vol <1-100>` | Atur volume |
| `l!loop <mode>` | Gunakan off, track, queue, atau autoplay |
| `l!shuffle` | Acak antrean |
| `l!seek <waktu>` | Lompat ke detik atau format `mm:ss` |
| `l!filter <preset>` | Terapkan preset audio |
| `l!lyrics` | Cari lirik lagu aktif |
| `l!rm <posisi>` | Hapus lagu dari antrean |
| `l!move <dari> <ke>` | Pindahkan posisi lagu |
| `l!help` | Ringkasan command |

## Menjalankan dengan Docker

Pastikan `.env` sudah tersedia, lalu:

```bash
docker build -t lunara-music .
docker run --env-file .env --restart unless-stopped lunara-music
```

## Konfigurasi opsional

| Variable | Default | Keterangan |
|---|---:|---|
| `BOT_PREFIX` | `l!` | Prefix untuk command berbasis pesan |
| `DEFAULT_VOLUME` | `70` | Volume awal, 1–100 |
| `LEAVE_ON_EMPTY_MS` | `300000` | Waktu tunggu sebelum keluar dari channel kosong |
| `MAX_PLAYLIST_SIZE` | `100` | Batas lagu dari satu playlist |
Jangan pernah memasukkan `.env` ke Git. `.gitignore` sudah disiapkan.

## Catatan sumber audio

Saat kamu mengetik judul lagu, Lunara mencari kecocokan di katalog Spotify terlebih dahulu agar judul, artis, sampul, dan tautannya konsisten. Spotify tidak menyediakan stream audio langsung untuk bot Discord, jadi Lunara membandingkan beberapa kandidat SoundCloud dan memilih audio yang paling mendekati versi Spotify. Library SoundCloud mengutamakan transcoding `hq` ketika tersedia. URL sumber lain tetap dideteksi otomatis.

Pemilik bot bertanggung jawab mematuhi ketentuan layanan sumber musik dan aturan hak cipta yang berlaku.

## Pemeriksaan

```bash
npm run check
```

Perintah ini menjalankan pemeriksaan sintaks entry point dan seluruh unit test untuk parser waktu, prefix command, vote skip, serta kesesuaian slash command dengan handler.
