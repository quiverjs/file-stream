"use strict";
var $__traceur_64_0_46_0_46_7__,
    $__fs__,
    $___46__46__47_lib_47_file_45_stream__,
    $__quiver_45_stream_45_util__,
    $__quiver_45_promise__;
($__traceur_64_0_46_0_46_7__ = require("traceur"), $__traceur_64_0_46_0_46_7__ && $__traceur_64_0_46_0_46_7__.__esModule && $__traceur_64_0_46_0_46_7__ || {default: $__traceur_64_0_46_0_46_7__});
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var $__1 = ($___46__46__47_lib_47_file_45_stream__ = require("../lib/file-stream"), $___46__46__47_lib_47_file_45_stream__ && $___46__46__47_lib_47_file_45_stream__.__esModule && $___46__46__47_lib_47_file_45_stream__ || {default: $___46__46__47_lib_47_file_45_stream__}),
    fileReadStream = $__1.fileReadStream,
    fileWriteStream = $__1.fileWriteStream,
    tempFileReadStream = $__1.tempFileReadStream,
    streamToFile = $__1.streamToFile,
    byteRangeFileStream = $__1.byteRangeFileStream,
    fileStreamable = $__1.fileStreamable,
    tempFileStreamable = $__1.tempFileStreamable,
    toFileStreamable = $__1.toFileStreamable;
var $__2 = ($__quiver_45_stream_45_util__ = require("quiver-stream-util"), $__quiver_45_stream_45_util__ && $__quiver_45_stream_45_util__.__esModule && $__quiver_45_stream_45_util__ || {default: $__quiver_45_stream_45_util__}),
    streamToText = $__2.streamToText,
    pipeStream = $__2.pipeStream;
var $__4 = fs,
    readFile = $__4.readFile,
    readFileSync = $__4.readFileSync;
var $__3 = ($__quiver_45_promise__ = require("quiver-promise"), $__quiver_45_promise__ && $__quiver_45_promise__.__esModule && $__quiver_45_promise__ || {default: $__quiver_45_promise__}),
    promisify = $__3.promisify,
    resolve = $__3.resolve;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var should = chai.should();
readFile = promisify(readFile);
var testFilePath = 'test/test-file.txt';
var testWritePath = 'test/test-write.txt';
var testTempPath = 'test/test-temp.txt';
var expectedContent = readFileSync(testFilePath).toString();
describe('file stream test', (function() {
  it('file read stream test', (function() {
    return fileReadStream(testFilePath).then(streamToText).should.eventually.equal(expectedContent);
  }));
  it('file write stream test', (function() {
    return Promise.all([fileReadStream(testFilePath), fileWriteStream(testWritePath)]).then((function($__5) {
      var $__6 = $__5,
          readStream = $__6[0],
          writeStream = $__6[1];
      return pipeStream(readStream, writeStream).then((function() {
        readFileSync(testWritePath).toString().should.equal(expectedContent);
      }));
    }));
  }));
  it('file byte range stream test', (function() {
    var start = 128;
    var end = 512;
    var expectedSlice = expectedContent.slice(start, end);
    return byteRangeFileStream(testFilePath, {
      start: start,
      end: end
    }).then(streamToText).should.eventually.equal(expectedSlice);
  }));
  it('file streamable test', (function() {
    return fileStreamable(testFilePath).then((function(streamable) {
      should.exist(streamable.toStream);
      should.exist(streamable.toByteRangeStream);
      should.exist(streamable.toFilePath);
      streamable.toFilePath().should.eventually.equal(testFilePath);
      should.equal(streamable.reusable, true);
      should.equal(streamable.contentLength, expectedContent.length);
    }));
  }));
  it('temp file streamable test', (function() {
    var getTempPath = (function() {
      return resolve(testTempPath);
    });
    return fileReadStream(testFilePath).then((function(readStream) {
      var streamable = {toStream: (function() {
          return resolve(readStream);
        })};
      return toFileStreamable(streamable, getTempPath).then((function(streamable) {
        should.exist(streamable.toStream);
        should.exist(streamable.toByteRangeStream);
        should.exist(streamable.toFilePath);
        should.equal(streamable.reusable, false);
        should.equal(streamable.tempFile, true);
        should.equal(streamable.contentLength, expectedContent.length);
        streamable.toFilePath().should.eventually.equal(testTempPath);
        readFileSync(testTempPath).toString().should.equal(expectedContent);
      }));
    }));
  }));
}));
