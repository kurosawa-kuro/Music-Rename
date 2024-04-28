const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

const targetDirectory = 'C:\\Users\\kuros\\Downloads\\Music Rename\\file';

// 音楽ファイルと考えられる拡張子のリスト
const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m3u'];

// ディレクトリを読み込む
fs.readdir(targetDirectory, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  files.forEach(file => {
    const filePath = path.join(targetDirectory, file);
    const ext = path.extname(file).toLowerCase();

    if (supportedExtensions.includes(ext)) {
      mm.parseFile(filePath, { duration: true })
        .then(metadata => {
          if (metadata.common.artist && metadata.common.track.no && metadata.common.title) {
            const artist = metadata.common.artist;
            const trackNumber = metadata.common.track.no;
            const title = metadata.common.title;
            const year = metadata.common.year || ''; // 年がなければ空文字とする
            const album = metadata.common.album ? `${year} ${metadata.common.album}` : ''; // アルバム情報がある場合のみ年と組み合わせる

            // トラック番号を三桁のフォーマットで整形
            const formattedTrackNumber = trackNumber.toString().padStart(3, '0');

            // アルバム情報があるかどうかでフォーマットを変更
            const albumPart = album ? `《${album}》` : '';
            const formattedOutput = `【${artist}】${albumPart}_${formattedTrackNumber}_${title}${ext}`;
            const newFilePath = path.join(targetDirectory, formattedOutput);

            // ファイル名を変更
            fs.rename(filePath, newFilePath, err => {
              if (err) {
                console.error('Error renaming file:', err);
              } else {
                console.log(`Renamed to: ${formattedOutput}`);
              }
            });
          }
        })
        .catch(err => {
          console.error('Error reading metadata:', err);
        });
    }
  });
});
