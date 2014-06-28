import {
  createReadStream as nodeFileReadStream,
  createWriteStream as nodeFileWriteStream,
  stat as statFileAsync,
} from fs

import {
  nodeToQuiverReadStream, nodeToQuiverWriteStream, pipeStream
} from 'quiver-stream-util'

import { error } from 'quiver-error'
import { promisify, resolve } from 'quiver-promise'

var statFile = promisify(statFileAsync)

var getFileStats = (filePath, fileStats) =>
  fileStats ? resolve(fileStats) : statFile(filePath)

export var fileReadStream = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(() =>
    nodeToQuiverReadStream(nodeFileReadStream(filePath)))

export var fileWriteStream = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(() =>
    nodeToQuiverWriteStream(nodeFileWriteStream(filePath)))

export var streamToFile = (readStream, filePath) =>
  createFileWriteStream(filePath).then(writeStream =>
    pipeStream(readStream, writeStream))

export var byteRangeFileStream = (filePath, options={}) => {
  var { fileStats, start=0, end=-1 } = options

  return getFileStats(filePath, fileStats).then(fileStats => {
    var fileSize = fileStats.size
    if(end == -1) end = fileSize

    if(fileSize < end) return reject(error(416, 'out of range'))

    return nodeToQuiverReadStream(nodeFileReadStream(filePath, {
      start: start,
      end: end-1
    }))
  })
}

export var fileStreamable = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(fileStats => {
    if(fileStats.isDirectory()) return reject(error(404, 'path is directory'))

    return {
      toStream: () => fileReadStream(filePath, fileStats),
      toByteRangeStream: (start, end) =>
        byteRangeFileStream(filePath, { fileStats, start, end }),
      filePath: filePath,
      reusable: true,
      offMemory: true,
      contentLength: fileStats.size
    }
  })

export var streamableToFilePath = (streamable, getTempPath) => {
  if(streamable.filePath) return resolve(streamable.filePath)

  return Promise.all([streamable.toStream(), getTempPath()])
  .then(([readStream, tempPath]) =>
    streamToFile(readStream, tempPath).then(() => {
      streamable.filePath = tempPath

      return tempPath
    }))
}
