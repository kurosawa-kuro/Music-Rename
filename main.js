const fs = require('fs').promises;
const path = require('path');
const mm = require('music-metadata');

const targetDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\complete';
const outputDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\renamed';
const missingMetadataDirectory = '【Missing required metadata】'; // Define a constant for the folder name
const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m3u'];

async function processDirectory(directory) {
    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else {
                await processFileIfNeeded(fullPath);
            }
        }
    } catch (err) {
        console.error('Error processing directory:', directory, err);
    }
}

async function processFileIfNeeded(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (supportedExtensions.includes(ext)) {
        await processFile(filePath, ext);
    }
}

async function processFile(filePath, ext) {
    try {
        const metadata = await mm.parseFile(filePath, { duration: true });
        
        if (isValidMetadata(metadata)) {
            const newFilePath = await getNewFilePath(metadata, filePath, ext);
            await fs.rename(filePath, newFilePath);
            console.log(`Moved and renamed to: ${newFilePath}`);
        } else {
            throw new Error('Missing required metadata');
        }
    } catch (err) {
        const newFilePath = await moveToMissingMetadataFolder(filePath, ext);
        console.error(err.message, filePath);
    }
}

function isValidMetadata(metadata) {
    return metadata.common.artist && metadata.common.track.no && metadata.common.title;
}

async function getNewFilePath(metadata, filePath, ext) {
    const { artist, track, title, year, album } = metadata.common;
    const formattedTrackNumber = track.no.toString().padStart(3, '0');
    const yearPart = year ? `${year} ` : '';
    const albumPart = album ? `《${yearPart}${album}》` : '';
    const artistFolder = path.join(outputDirectory, artist);
    await fs.mkdir(artistFolder, { recursive: true });
    const formattedOutput = `${albumPart}_${formattedTrackNumber}_${title}${ext}`;
    return path.join(artistFolder, formattedOutput);
}

async function moveToMissingMetadataFolder(filePath, ext) {
    const fileName = path.basename(filePath);
    const missingFolder = path.join(outputDirectory, missingMetadataDirectory);
    await fs.mkdir(missingFolder, { recursive: true });
    const newFilePath = path.join(missingFolder, fileName);
    await fs.rename(filePath, newFilePath);
    return newFilePath;
}

processDirectory(targetDirectory);
