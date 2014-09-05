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
var $__fs__,
    $__quiver_45_stream_45_util__,
    $__quiver_45_error__,
    $__quiver_45_promise__;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var $__4 = fs,
    nodeFileReadStream = $__4.createReadStream,
    nodeFileWriteStream = $__4.createWriteStream,
    statFileAsync = $__4.stat,
    unlinkFile = $__4.unlink;
var $__1 = ($__quiver_45_stream_45_util__ = require("quiver-stream-util"), $__quiver_45_stream_45_util__ && $__quiver_45_stream_45_util__.__esModule && $__quiver_45_stream_45_util__ || {default: $__quiver_45_stream_45_util__}),
    nodeToQuiverReadStream = $__1.nodeToQuiverReadStream,
    nodeToQuiverWriteStream = $__1.nodeToQuiverWriteStream,
    pipeStream = $__1.pipeStream;
var error = ($__quiver_45_error__ = require("quiver-error"), $__quiver_45_error__ && $__quiver_45_error__.__esModule && $__quiver_45_error__ || {default: $__quiver_45_error__}).error;
var $__3 = ($__quiver_45_promise__ = require("quiver-promise"), $__quiver_45_promise__ && $__quiver_45_promise__.__esModule && $__quiver_45_promise__ || {default: $__quiver_45_promise__}),
    promisify = $__3.promisify,
    resolve = $__3.resolve;
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
  var $__5,
      $__6;
  var options = arguments[1] !== (void 0) ? arguments[1] : {};
  var $__4 = options,
      fileStats = $__4.fileStats,
      start = ($__5 = $__4.start) === void 0 ? 0 : $__5,
      end = ($__6 = $__4.end) === void 0 ? -1 : $__6;
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
  if (streamable.toFilePath)
    return resolve(streamable);
  return Promise.all([streamable.toStream(), getTempPath()]).then((function($__5) {
    var $__6 = $__5,
        readStream = $__6[0],
        tempPath = $__6[1];
    return streamToFile(readStream, tempPath).then((function() {
      return tempFileStreamable(tempPath);
    }));
  }));
});
