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
var $__4 = fs,
    nodeFileReadStream = $__4.createReadStream,
    nodeFileWriteStream = $__4.createWriteStream,
    unlinkFile = $__4.unlink,
    existsAsync = $__4.exists;
var statFile = promisify(fs.stat);
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
var fileExists = (function(filePath) {
  return createPromise((function(resolve, reject) {
    existsAsync(resolve);
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
  var $__6,
      $__7;
  var options = arguments[1] !== (void 0) ? arguments[1] : {};
  var $__5 = options,
      fileStats = $__5.fileStats,
      start = ($__6 = $__5.start) === void 0 ? 0 : $__6,
      end = ($__7 = $__5.end) === void 0 ? -1 : $__7;
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
      toNodeStream: (function() {
        return resolve(nodeFileReadStream(filePath));
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
var streamableToFile = async($traceurRuntime.initGeneratorFunction(function $__8(streamable, getTempPath) {
  var filePath,
      isTemp,
      $__5,
      readStream,
      tempPath,
      $__9,
      $__10,
      $__11,
      $__12,
      $__13,
      $__14,
      $__15,
      $__16,
      $__17;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.state = (streamable.toFilePath) ? 1 : 6;
          break;
        case 1:
          $ctx.state = 2;
          return streamable.toFilePath();
        case 2:
          filePath = $ctx.sent;
          $ctx.state = 4;
          break;
        case 4:
          isTemp = streamable.tempFile || false;
          $ctx.state = 8;
          break;
        case 8:
          $ctx.returnValue = [filePath, isTemp];
          $ctx.state = -2;
          break;
        case 6:
          $__9 = Promise.all;
          $__10 = streamable.toStream;
          $__11 = $__10.call(streamable);
          $__12 = getTempPath();
          $__13 = [$__11, $__12];
          $__14 = $__9.call(Promise, $__13);
          $ctx.state = 15;
          break;
        case 15:
          $ctx.state = 11;
          return $__14;
        case 11:
          $__15 = $ctx.sent;
          $ctx.state = 13;
          break;
        case 13:
          $__5 = $__15;
          $__16 = $__5[0];
          readStream = $__16;
          $__17 = $__5[1];
          tempPath = $__17;
          $ctx.state = 17;
          break;
        case 17:
          $ctx.state = 19;
          return streamToFile(readStream, tempPath);
        case 19:
          $ctx.maybeThrow();
          $ctx.state = 21;
          break;
        case 21:
          $ctx.returnValue = [tempPath, true];
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__8, this);
}));
var toFileStreamable = (function(streamable, getTempPath) {
  if (streamable.toFilePath)
    return resolve(streamable);
  return streamableToFile(streamable, getTempPath).then((function($__5) {
    var filePath = $__5[0];
    return tempFileStreamable(filePath);
  }));
});
