import mime from 'mime'
import { error } from 'quiver-util/error'

import {
  promisify, resolve
} from 'quiver-util/promise'

import {
  nodeToQuiverReadStream,
  nodeToQuiverWriteStream,
  pipeStream
} from 'quiver-stream-util'

import {
  createReadStream as nodeFileReadStream,
  createWriteStream as nodeFileWriteStream,
  unlink as unlinkFile,
  stat,
  access
} from 'fs'

export const statFile = promisify(stat)
export const accessFile = promisify(access)

const isFile = fileStats => {
  if(typeof(fileStats.isFile) == 'function')
    return fileStats.isFile()

  return fileStats.isFile
}

const isDirectory = fileStats => {
  if(typeof(fileStats.isDirectory) == 'function')
    return fileStats.isDirectory()

  return fileStats.isDirectory
}

const getFileStats = async function(filePath, fileStats) {
  if(!fileStats) fileStats = await statFile(filePath)

  if(!isFile(fileStats))
    throw error(404, 'file path is not a regular file')

  return fileStats
}

export const fileExists = filePath =>
  accessFile(filePath)

export const fileReadStream = async function(filePath, fileStats) {
  await getFileStats(filePath, fileStats)
  return nodeToQuiverReadStream(nodeFileReadStream(filePath))
}

export const fileWriteStream = async function(filePath) {
  return nodeToQuiverWriteStream(nodeFileWriteStream(filePath))
}

/*
 * create a read stream from a temporary file. The temp file
 * is deleted once the read stream piped finish
 */
export const tempFileReadStream = async function(filePath, fileStats) {
  await getFileStats(filePath, fileStats)
  const nodeStream = nodeFileReadStream(filePath)

  let deleted = false
  const deleteFile = () => {
    if(deleted) return
    deleted = true
    unlinkFile(filePath, err => { /*ignore*/ })
  }

  nodeStream.on('end', deleteFile)
  nodeStream.on('error', deleteFile)

  return nodeToQuiverReadStream(nodeStream)
}

export const streamToFile = async function(readStream, filePath) {
  const writeStream = await fileWriteStream(filePath)
  return pipeStream(readStream, writeStream)
}

/*
 * Create a stream containing ranged content of a file.
 * The start and end values are provided optionally in options.
 * Range convention is the same as Array.slice(), i.e.
 * begin from 0 and not inclusive of end.
 * Example full range is (0, length)
 */
export const byteRangeFileStream = async function(filePath, options={}) {
  const { fileStats: $fileStats, start=0, end=-1 } = options

  const fileStats = await getFileStats(filePath, $fileStats)
  const fileSize = fileStats.size
  if(end == -1) end = fileSize

  if(fileSize < end)
    throw error(416, 'out of range')

  return nodeToQuiverReadStream(nodeFileReadStream(filePath, {
    start: start,
    end: end-1
  }))
}

export const fileStreamable = async function(filePath, $fileStats) {
  const fileStats = await getFileStats(filePath, $fileStats)
  const contentType = mime.lookup(filePath)

  return {
    toStream: () =>
      resolve(fileReadStream(filePath, fileStats)),

    toByteRangeStream: (start, end) =>
      resolve(byteRangeFileStream(filePath,
        { fileStats, start, end })),

    toFilePath: () =>
      resolve(filePath),

    toNodeStream: () =>
      resolve(nodeFileReadStream(filePath)),

    reusable: true,
    offMemory: true,
    contentLength: fileStats.size,
    contentType: mime.lookup(filePath)
  }
}


/*
 * Temp file streamable is non-reusable but has file path.
 * Only either toStream() or toFilePath() can be called once.
 * If toStream() is called the temp file is deleted at the end
 * of pipe stream. If toFilePath() is called, it is the caller's
 * responsibility to check for streamable.tempFile flag and delete
 * the file after use.
 */
export const tempFileStreamable = async function(filePath, $fileStats) {
  const fileStats = await getFileStats(filePath, $fileStats)
  if(isDirectory(fileStats))
    throw error(404, 'path is directory')

  let opened = false
  const openStream = () => {
    if(opened)
      throw error(500, 'streamable can only be opened once')

    opened = true
  }

  return {
    reusable: false,
    tempFile: true,
    offMemory: true,
    contentLength: fileStats.size,
    contentType: mime.lookup(filePath),

    async toStream() {
      openStream()
      return tempFileReadStream(filePath, fileStats)
    },

    async toByteRangeStream(start, end) {
      openStream()
      return byteRangeFileStream(filePath, { fileStats, start, end })
    },

    async toFilePath() {
      openStream()
      return filePath
    },

    async toNodeStream() {
      openStream()
      return nodeFileReadStream(filePath)
    }
  }
}

export const streamableToFile = async function(streamable, getTempPath) {
  if(streamable.toFilePath) {
    const filePath = await streamable.toFilePath()
    const isTemp = streamable.tempFile || false
    return [filePath, isTemp]
  }

  const [ readStream, tempPath ] = await Promise.all(
    [streamable.toStream(), getTempPath()])

  await streamToFile(readStream, tempPath)
  return [tempPath, true]
}

/*
 * Obtain either original or converted streamable that
 * guaranteed to have filepath attribute. A temp file streamable
 * is created if the original streamable has no filePath.
 */
export const toFileStreamable = async function(streamable, getTempPath) {
  if(streamable.toFilePath) return streamable

  const [ filePath ] = await streamableToFile(streamable, getTempPath)

  return tempFileStreamable(filePath)
}
