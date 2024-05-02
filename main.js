const fs = require('fs').promises;
const path = require('path');
const mm = require('music-metadata');

const targetDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\complete';
const outputDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\renamed';
const missingMetadataDirectory = '【Missing required metadata】';
const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m3u'];

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
      await moveToMissingMetadataFolder(filePath);
      console.error('Missing required metadata', filePath);
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
  const { artist, track, title, year, album } = metadata.common;
  const ext = path.extname(filePath);
  const formattedTrackNumber = track.no.toString().padStart(3, '0');
  const yearPart = year ? `${year} ` : '';
  const albumPart = album ? `《${yearPart}${album}》` : '';
  const artistFolder = path.join(outputDirectory, artist);
  await fs.mkdir(artistFolder, { recursive: true });
  const formattedOutput = `${albumPart}_${formattedTrackNumber}_${title}${ext}`;
  return path.join(artistFolder, formattedOutput);
}

async function moveToMissingMetadataFolder(filePath) {
  const fileName = path.basename(filePath);
  const missingFolder = path.join(outputDirectory, missingMetadataDirectory);
  await fs.mkdir(missingFolder, { recursive: true });
  const newFilePath = path.join(missingFolder, fileName);
  await fs.rename(filePath, newFilePath);
}

processDirectory(targetDirectory);