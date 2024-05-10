const fs = require('fs').promises;
const path = require('path');
const mm = require('music-metadata');

const targetDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\complete';
const outputDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\renamed';
const missingMetadataDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\【Missing required metadata】';
const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a'];

async function processDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (isSupportedFile(entry.name)) {
        await processFile(fullPath);
      }
    }
  } catch (err) {
    console.error('Error processing directory:', directory, err);
  }
}

function isSupportedFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return supportedExtensions.includes(ext);
}

async function processFile(filePath) {
  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    if (isValidMetadata(metadata)) {
      const newFilePath = await getNewFilePath(metadata, filePath);
      await fs.rename(filePath, newFilePath);
      console.log(`Moved and renamed to: ${newFilePath}`);
    } else {
      console.error('Missing required metadata', filePath);
      await moveToMissingMetadataFolder(filePath);
    }
  } catch (err) {
    console.error('Error processing file:', filePath, err);
    await moveToMissingMetadataFolder(filePath);
  }
}

function isValidMetadata(metadata) {
  return metadata.common.artist && metadata.common.track.no && metadata.common.title;
}

async function getNewFilePath(metadata, filePath) {
  const { artist, track, title, year, album, genre } = metadata.common;
  const ext = path.extname(filePath);
  const formattedTrackNumber = track.no.toString().padStart(2, '0');
  const yearPart = year ? `${year} ` : '';
  const albumPart = album ? `《${yearPart}${album}》` : '';
  const artistPart = `【${artist}】`;
  const genrePart = genre ? `【${genre}】` : '【No Genre】';
  const artistFolder = path.join(outputDirectory, artist);
  await fs.mkdir(artistFolder, { recursive: true });
  const formattedOutput = `${genrePart}${artistPart}${albumPart}_${formattedTrackNumber}_${title}${ext}`;
  return path.join(artistFolder, formattedOutput);
}

async function moveToMissingMetadataFolder(filePath) {
  const fileName = path.basename(filePath);
  await fs.mkdir(missingMetadataDirectory, { recursive: true });
  const newFilePath = path.join(missingMetadataDirectory, fileName);
  await fs.rename(filePath, newFilePath);
}

processDirectory(targetDirectory);