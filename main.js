const fs = require('fs').promises;
const path = require('path');
const mm = require('music-metadata');

const targetDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\complete';
const outputDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\renamed';

// 音楽ファイルと考えられる拡張子のリスト
const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m3u'];

// ディレクトリを再帰的に読み込む関数
async function processDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (supportedExtensions.includes(ext)) {
          await processFile(fullPath, ext);
        }
      }
    }
  } catch (err) {
    console.error('Error processing directory:', err);
  }
}

// ファイルを処理する関数
async function processFile(filePath, ext) {
  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    if (metadata.common.artist && metadata.common.track.no && metadata.common.title) {
      const artist = metadata.common.artist;
      const trackNumber = metadata.common.track.no;
      const title = metadata.common.title;
      const year = metadata.common.year || '';
      const album = metadata.common.album ? `${year} ${metadata.common.album}` : '';

      const formattedTrackNumber = trackNumber.toString().padStart(3, '0');
      const albumPart = album ? `《${album}》` : '';
      const formattedOutput = `【${artist}】${albumPart}_${formattedTrackNumber}_${title}${ext}`;
      const newFilePath = path.join(outputDirectory, formattedOutput);

      await fs.rename(filePath, newFilePath);
      console.log(`Moved and renamed to: ${newFilePath}`);
    }
  } catch (err) {
    console.error('Error processing file:', err);
  }
}

// メイン処理を開始
processDirectory(targetDirectory);
