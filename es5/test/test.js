"use strict";
require('traceur');
var $__0 = $traceurRuntime.assertObject(require('../lib/file-stream.js')),
    fileReadStream = $__0.fileReadStream,
    fileWriteStream = $__0.fileWriteStream,
    tempFileReadStream = $__0.tempFileReadStream,
    streamToFile = $__0.streamToFile,
    byteRangeFileStream = $__0.byteRangeFileStream,
    fileStreamable = $__0.fileStreamable,
    tempFileStreamable = $__0.tempFileStreamable,
    toFileStreamable = $__0.toFileStreamable;
var $__0 = $traceurRuntime.assertObject(require('quiver-stream-util')),
    streamToText = $__0.streamToText,
    pipeStream = $__0.pipeStream;
var $__0 = $traceurRuntime.assertObject(require('fs')),
    readFile = $__0.readFile,
    readFileSync = $__0.readFileSync;
var $__0 = $traceurRuntime.assertObject(require('quiver-promise')),
    promisify = $__0.promisify,
    resolve = $__0.resolve;
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
    return Promise.all([fileReadStream(testFilePath), fileWriteStream(testWritePath)]).then((function($__0) {
      var readStream = $__0[0],
          writeStream = $__0[1];
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
      should.equal(streamable.reusable, true);
      should.equal(streamable.toFilePath(), testFilePath);
      should.equal(streamable.contentLength, expectedContent.length);
    }));
  }));
  it('temp file streamable test', (function() {
    var getTempPath = (function() {
      return resolve(testTempPath);
    });
    fileReadStream(testFilePath).then((function(readStream) {
      var streamable = {toStream: (function() {
          return resolve(readStream);
        })};
      return toFileStreamable(streamable, getTempPath).then((function(streamable) {
        should.exist(streamable.toStream);
        should.exist(streamable.toByteRangeStream);
        should.exist(streamable.toFilePath);
        should.equal(streamable.reusable, false);
        should.equal(streamable.tempFile, true);
        should.equal(streamable.toFilePath(), testTempPath);
        should.equal(streamable.contentLength, expectedContent.length);
      }));
    }));
  }));
}));
