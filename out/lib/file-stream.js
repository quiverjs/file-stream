"use strict";
Object.defineProperties(exports, {
  statFile: {get: function() {
      return statFile;
    }},
  fileExists: {get: function() {
      return fileExists;
    }},
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
  streamableToFile: {get: function() {
      return streamableToFile;
    }},
  toFileStreamable: {get: function() {
      return toFileStreamable;
    }},
  __esModule: {value: true}
});
var $__fs__,
    $__quiver_45_error__,
    $__quiver_45_promise__,
    $__quiver_45_stream_45_util__;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var error = ($__quiver_45_error__ = require("quiver-error"), $__quiver_45_error__ && $__quiver_45_error__.__esModule && $__quiver_45_error__ || {default: $__quiver_45_error__}).error;
var $__2 = ($__quiver_45_promise__ = require("quiver-promise"), $__quiver_45_promise__ && $__quiver_45_promise__.__esModule && $__quiver_45_promise__ || {default: $__quiver_45_promise__}),
    async = $__2.async,
    promisify = $__2.promisify,
    resolve = $__2.resolve,
    createPromise = $__2.createPromise;
var $__3 = ($__quiver_45_stream_45_util__ = require("quiver-stream-util"), $__quiver_45_stream_45_util__ && $__quiver_45_stream_45_util__.__esModule && $__quiver_45_stream_45_util__ || {default: $__quiver_45_stream_45_util__}),
    nodeToQuiverReadStream = $__3.nodeToQuiverReadStream,
    nodeToQuiverWriteStream = $__3.nodeToQuiverWriteStream,
    pipeStream = $__3.pipeStream;
let $__4 = fs,
    nodeFileReadStream = $__4.createReadStream,
    nodeFileWriteStream = $__4.createWriteStream,
    unlinkFile = $__4.unlink,
    existsAsync = $__4.exists;
let statFile = promisify(fs.stat);
let isFile = (function(fileStats) {
  if (typeof(fileStats.isFile) == 'function')
    return fileStats.isFile();
  return fileStats.isFile;
});
let isDirectory = (function(fileStats) {
  if (typeof(fileStats.isDirectory) == 'function')
    return fileStats.isDirectory();
  return fileStats.isDirectory;
});
let getFileStats = (function(filePath, fileStats) {
  return (fileStats ? resolve(fileStats) : statFile(filePath)).then((function(fileStats) {
    if (!isFile(fileStats))
      return reject(error(404, 'file path is not a regular file'));
    return fileStats;
  }));
});
let fileExists = (function(filePath) {
  return createPromise((function(resolve, reject) {
    existsAsync(resolve);
  }));
});
let fileReadStream = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function() {
    return nodeToQuiverReadStream(nodeFileReadStream(filePath));
  }));
});
let fileWriteStream = (function(filePath) {
  return resolve(nodeToQuiverWriteStream(nodeFileWriteStream(filePath)));
});
let tempFileReadStream = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function() {
    let nodeStream = nodeFileReadStream(filePath);
    let deleted = false;
    let deleteFile = (function() {
      if (deleted)
        return ;
      deleted = true;
      unlinkFile(filePath, (function(err) {}));
    });
    nodeStream.on('end', deleteFile);
    nodeStream.on('error', deleteFile);
    return nodeToQuiverReadStream(nodeStream);
  }));
});
let streamToFile = (function(readStream, filePath) {
  return fileWriteStream(filePath).then((function(writeStream) {
    return pipeStream(readStream, writeStream);
  }));
});
let byteRangeFileStream = (function(filePath) {
  var $__6,
      $__7;
  var options = arguments[1] !== (void 0) ? arguments[1] : {};
  let $__5 = options,
      fileStats = $__5.fileStats,
      start = ($__6 = $__5.start) === void 0 ? 0 : $__6,
      end = ($__7 = $__5.end) === void 0 ? -1 : $__7;
  return getFileStats(filePath, fileStats).then((function(fileStats) {
    let fileSize = fileStats.size;
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
let fileStreamable = (function(filePath, fileStats) {
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
      toNodeStream: (function() {
        return resolve(nodeFileReadStream(filePath));
      }),
      reusable: true,
      offMemory: true,
      contentLength: fileStats.size
    });
  }));
});
let tempFileStreamable = (function(filePath, fileStats) {
  return getFileStats(filePath, fileStats).then((function(fileStats) {
    if (isDirectory(fileStats))
      return reject(error(404, 'path is directory'));
    let opened = false;
    let wrap = (function(fn) {
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
      toNodeStream: wrap((function() {
        return nodeFileReadStream(filePath);
      })),
      reusable: false,
      tempFile: true,
      offMemory: true,
      contentLength: fileStats.size
    };
  }));
});
let streamableToFile = async(function*(streamable, getTempPath) {
  var $__6,
      $__7;
  if (streamable.toFilePath) {
    let filePath = yield streamable.toFilePath();
    let isTemp = streamable.tempFile || false;
    return [filePath, isTemp];
  }
  let $__5 = yield Promise.all([streamable.toStream(), getTempPath()]),
      readStream = ($__6 = $__5[$traceurRuntime.toProperty(Symbol.iterator)](), ($__7 = $__6.next()).done ? void 0 : $__7.value),
      tempPath = ($__7 = $__6.next()).done ? void 0 : $__7.value;
  yield streamToFile(readStream, tempPath);
  return [tempPath, true];
});
let toFileStreamable = (function(streamable, getTempPath) {
  if (streamable.toFilePath)
    return resolve(streamable);
  return streamableToFile(streamable, getTempPath).then((function($__5) {
    var $__7,
        $__8,
        $__9,
        $__10;
    var filePath = ($__9 = $__5[$traceurRuntime.toProperty(Symbol.iterator)](), ($__10 = $__9.next()).done ? void 0 : $__10.value);
    return tempFileStreamable(filePath);
  }));
});
