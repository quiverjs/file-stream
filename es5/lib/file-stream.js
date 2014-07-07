"use strict";
Object.defineProperties(exports, {
  fileReadStream: {get: function() {
      return fileReadStream;
    }},
  fileWriteStream: {get: function() {
      return fileWriteStream;
    }},
  tempFileReadStream: {get: function() {
      return tempFileReadStream;
    }},
  streamToFile: {get: function() {
      return streamToFile;
    }},
  byteRangeFileStream: {get: function() {
      return byteRangeFileStream;
    }},
  fileStreamable: {get: function() {
      return fileStreamable;
    }},
  tempFileStreamable: {get: function() {
      return tempFileStreamable;
    }},
  toFileStreamable: {get: function() {
      return toFileStreamable;
    }},
  __esModule: {value: true}
});
var $__0 = $traceurRuntime.assertObject(require('fs')),
    nodeFileReadStream = $__0.createReadStream,
    nodeFileWriteStream = $__0.createWriteStream,
    statFileAsync = $__0.stat,
    unlinkFile = $__0.unlink;
var $__0 = $traceurRuntime.assertObject(require('quiver-stream-util')),
    nodeToQuiverReadStream = $__0.nodeToQuiverReadStream,
    nodeToQuiverWriteStream = $__0.nodeToQuiverWriteStream,
    pipeStream = $__0.pipeStream;
var error = $traceurRuntime.assertObject(require('quiver-error')).error;
var $__0 = $traceurRuntime.assertObject(require('quiver-promise')),
    promisify = $__0.promisify,
    resolve = $__0.resolve;
var fs = require('fs');
var statFile = promisify(statFileAsync);
var isFile = (function(fileStats) {
  if (typeof(fileStats.isFile) == 'function')
    return fileStats.isFile();
  return fileStats.isFile;
});
var isDirectory = (function(fileStats) {
  if (typeof(fileStats.isDirectory) == 'function')
    return fileStats.isDirectory();
  return fileStats.isDirectory;
});
var getFileStats = (function(filePath, fileStats) {
  return (fileStats ? resolve(fileStats) : statFile(filePath)).then((function(fileStats) {
    if (!isFile(fileStats))
      return reject(error(404, 'file path is not a regular file'));
    return fileStats;
  }));
});
var fileReadStream = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function() {
    return nodeToQuiverReadStream(nodeFileReadStream(filePath));
  }));
});
var fileWriteStream = (function(filePath) {
  return resolve(nodeToQuiverWriteStream(nodeFileWriteStream(filePath)));
});
var tempFileReadStream = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function() {
    var nodeStream = nodeFileReadStream(filePath);
    var deleted = false;
    var deleteFile = (function() {
      if (deleted)
        return;
      deleted = true;
      unlinkFile(filePath, (function(err) {}));
    });
    nodeStream.on('end', deleteFile);
    nodeStream.on('error', deleteFile);
    return nodeToQuiverReadStream(nodeStream);
  }));
});
var streamToFile = (function(readStream, filePath) {
  return fileWriteStream(filePath).then((function(writeStream) {
    return pipeStream(readStream, writeStream);
  }));
});
var byteRangeFileStream = (function(filePath) {
  var $__1;
  var options = arguments[1] !== (void 0) ? arguments[1] : {};
  var $__0 = $traceurRuntime.assertObject(options),
      fileStats = $__0.fileStats,
      start = ($__1 = $__0.start) === void 0 ? 0 : $__1,
      end = ($__1 = $__0.end) === void 0 ? -1 : $__1;
  return getFileStats(filePath, fileStats).then((function(fileStats) {
    var fileSize = fileStats.size;
    if (end == -1)
      end = fileSize;
    if (fileSize < end)
      return reject(error(416, 'out of range'));
    return nodeToQuiverReadStream(nodeFileReadStream(filePath, {
      start: start,
      end: end - 1
    }));
  }));
});
var fileStreamable = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function(fileStats) {
    return ({
      toStream: (function() {
        return resolve(fileReadStream(filePath, fileStats));
      }),
      toByteRangeStream: (function(start, end) {
        return resolve(byteRangeFileStream(filePath, {
          fileStats: fileStats,
          start: start,
          end: end
        }));
      }),
      toFilePath: (function() {
        return resolve(filePath);
      }),
      reusable: true,
      offMemory: true,
      contentLength: fileStats.size
    });
  }));
});
var tempFileStreamable = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function(fileStats) {
    if (isDirectory(fileStats))
      return reject(error(404, 'path is directory'));
    var opened = false;
    var wrap = (function(fn) {
      return (function() {
        if (opened)
          return reject(error(500, 'streamable can only be opened once'));
        opened = true;
        return resolve(fn());
      });
    });
    return {
      toStream: wrap((function() {
        return tempFileReadStream(filePath, fileStats);
      })),
      toByteRangeStream: wrap((function() {
        return byteRangeFileStream(filePath, {
          fileStats: fileStats,
          start: start,
          end: end
        });
      })),
      toFilePath: wrap((function() {
        return filePath;
      })),
      reusable: false,
      tempFile: true,
      offMemory: true,
      contentLength: fileStats.size
    };
  }));
});
var toFileStreamable = (function(streamable, getTempPath) {
  if (streamable.filePath)
    return resolve(streamable);
  return Promise.all([streamable.toStream(), getTempPath()]).then((function($__0) {
    var readStream = $__0[0],
        tempPath = $__0[1];
    return streamToFile(readStream, tempPath).then((function() {
      return tempFileStreamable(tempPath);
    }));
  }));
});
