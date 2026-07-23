import 'dotenv/config';
import { existsSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';

if (!process.env.FFMPEG_PATH && ffmpegPath && existsSync(ffmpegPath)) {
  process.env.FFMPEG_PATH = ffmpegPath;
}
