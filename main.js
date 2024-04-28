const fs = require('fs').promises;
const path = require('path');
const mm = require('music-metadata');

const targetDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\complete';
const outputDirectory = 'C:\\Users\\kuros\\Downloads\\Music\\renamed';
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
        // Debug output for metadata comments
        // if (metadata.common.comment) {
        //     console.log(`Comment for ${filePath}:`, metadata.common.comment);
        // }
        
        if (isValidMetadata(metadata)) {
            const newFilePath = getNewFilePath(metadata, filePath, ext);
            await fs.rename(filePath, newFilePath);
            console.log(`Moved and renamed to: ${newFilePath}`);
        } else {
            console.error('Missing required metadata:', filePath);
        }
    } catch (err) {
        console.error('Error processing file:', filePath);
    }
}

function isValidMetadata(metadata) {
    return metadata.common.artist && metadata.common.track.no && metadata.common.title;
}

function getNewFilePath(metadata, filePath, ext) {
    const { artist, track, title, year, album } = metadata.common;
    const formattedTrackNumber = track.no.toString().padStart(3, '0');
    const albumPart = album ? `《${year} ${album}》` : '';
    const formattedOutput = `【${artist}】${albumPart}_${formattedTrackNumber}_${title}${ext}`;
    return path.join(outputDirectory, formattedOutput);
}

processDirectory(targetDirectory);
