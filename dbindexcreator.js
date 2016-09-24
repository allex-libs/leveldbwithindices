function createLevelDBIndex (execlib, leveldblib, bufferlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    DBHandler = leveldblib.LevelDBHandler;

  function LevelDBIndex (prophash) {
    prophash.dbcreationoptions = prophash.dbcreationoptions || {};
    prophash.dbcreationoptions.valueEncoding = bufferlib.makeCodec(this.prepareValueEncodingUserNameArray(prophash),'leveldbindexcodec');
    DBHandler.call(this, prophash);
  }
  lib.inherit(LevelDBIndex, DBHandler);
  LevelDBIndex.prototype.destroy = function () {
    DBHandler.prototype.destroy.call(this);
  };
  LevelDBIndex.prototype.prepareValueEncodingUserNameArray = function (prophash) {
    if (!prophash.indexedElementBufferUserName) {
      throw new lib.JSONizingError('NO_INDEXED_ELEMENT_BUFFERUSER_NAME', prophash, 'indexedElementBufferUserName not present:');
    }
    return [['Array', [prophash.indexedElementBufferUserName]]];
  };
  LevelDBIndex.prototype.fetch = function (storagedb, key) {
    console.log('AHOOOj, radi li fetch?', key);
    return this.safeGet(key, null).then(
      this.onIndicesFetched.bind(this)
    ).then(
      this.processIndices.bind(this, storagedb)
    );
  };
  LevelDBIndex.prototype.onIndicesFetched = function (indicesdata) {
    if (indicesdata === null) {
      return q([]);
    }
    return this.getIndicesFromFetchedData(indicesdata[0]);
  };
  LevelDBIndex.prototype.getIndicesFromFetchedData = function (indicesdata) {
    return indicesdata;
  };
  LevelDBIndex.prototype.processIndices = function (storagedb, indices) {
    var d = q.defer();
    q.all(indices.map(singleFetcherPromise.bind(null, storagedb))).then(
      notifyOut.bind(null, d),
      d.reject.bind(d)
    );
    storagedb = null;
    return d.promise;
  };
  function singleFetcherPromise(storagedb, index) {
    return storagedb.get(index).then(
      function (record) {
        var ret = [index, record];
        index = null;
        return ret;
      }
    );
  }
  function notifyOut (defer, fetchedarray) {
    fetchedarray.forEach(defer.notify.bind(defer));
    defer.resolve(fetchedarray.length);
    defer = null;
  }

  return LevelDBIndex;
}

module.exports = createLevelDBIndex;

