var Path = require('path');
function createDBHandlerWithIndices(execlib, leveldblib, bufferlib, leveldbext) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    DBHandler = leveldblib.LevelDBHandler;

  function codecElementProducer (elemdesc) {
    if (elemdesc && elemdesc.hasOwnProperty && elemdesc.hasOwnProperty('type') ) {
      return elemdesc.type;
    }
    console.log(elemdesc, 'has no property type');
    return 'String';
  }

  function DBHandlerWithIndices (prophash) {
    var sd, mysd;
    if (!prophash.indices) {
      throw new lib.JSONizingError('NO_INDEX_DESCRIPTORS', prophash, 'No `indices` in:');
    }
    if (!prophash.path) {
      throw new lib.JSONizingError('NO_PATH', prophash, 'No `path` in:');
    }
    sd = prophash.starteddefer || q.defer();
    prophash.outerstarteddefer = sd;
    mysd = q.defer();
    prophash.starteddefer = mysd;
    prophash.dbname = Path.join(prophash.path, 'storage');
    prophash.dbcreationoptions = prophash.dbcreationoptions || {};
    this.codecNames = prophash.indices.map(codecElementProducer);
    console.log('codecNames', this.codecNames);
    prophash.dbcreationoptions.keyEncoding = bufferlib.makeCodec(this.codecNames, 'dbhwi_'+lib.uid());
    mysd.promise.then(
      this.createIndices.bind(this, prophash),
      sd.reject.bind(sd)
    )
    this.indexmap = new lib.Map();
    this.dbwithindices = [this];
    DBHandler.call(this,prophash);
  }
  lib.inherit(DBHandlerWithIndices, DBHandler);
  DBHandlerWithIndices.prototype.destroy = function () {
    DBHandler.prototype.destroy.call(this);
    if (this.dbwithindices) {
      this.dbwithindices.shift();
      lib.arryDestroyAll(this.dbwithindices);
    }
    this.dbwithindices = null;
    if (this.indexmap) {
      this.indexmap.destroy();
    }
    this.indexmap = null;
  };
  DBHandlerWithIndices.prototype.indexCreator = function (prophash, indexname, ordinal) {
    var d = q.defer();
    new leveldbext.DBIndex({
      dbname: Path.join(prophash.path, 'index_'+ordinal+'_'+indexname),
      starteddefer: d,
      indexedElementBufferUserName: ['Logic', [this.codecNames]]
    });
    d.promise.then(this.onIndexCreated.bind(this, indexname, ordinal));
    return d.promise;
  }
  DBHandlerWithIndices.prototype.onIndexCreated = function (indexname, ordinal, index) {
    this.indexmap.add(indexname.name || indexname, ordinal);
    this.dbwithindices[ordinal+1] = index;
  };
  DBHandlerWithIndices.prototype.createIndices = function (prophash) {
    var self = this;
    q.all(prophash.indices.map(this.indexCreator.bind(this, prophash))).then(
      function () {
        prophash.outerstarteddefer.resolve(self);
        self = null;
        prophash = null;
      },
      function (reason) {
        prophash.outerstarteddefer.reject(reason);
        self = null;
        prophash = null;
      }
    );
  };
  function obj2arry(obj, val, name) {
    var ordinal = obj.map.get(name);
    if (!lib.isNumber(ordinal)) {
      return;
    }
    obj.count++;
    obj.kswd[ordinal] = val;
  }
  DBHandlerWithIndices.prototype.keySemgentObj2KeySegments = function (keysegmentobj) {
    var keysegments = [], obj2arryobj={map: this.indexmap, kswd: keysegments, count: 0};
    lib.traverseShallow(keysegmentobj, obj2arry.bind(null, obj2arryobj));
    if (obj2arryobj.count !== this.dbwithindices.length-1) {
      obj2arryobj = null;
      throw new lib.JSONizingError('INVALID_KEY_STRUCTURE_ON_KEYSEGMENT_OBJECT', keysegmentobj, 'Number of properties not '+this.dbwithindices.length-1+' on:');
    }
    obj2arryobj = null;
    return keysegments;
  }
  DBHandlerWithIndices.prototype.compositePut = function (keysegmentobj, value) {
    var keysegments;
    try {
      keysegments = this.keySemgentObj2KeySegments(keysegmentobj);
    } catch (e) {
      return q.reject(e);
    }
    return leveldbext.storeWithIndices(this.dbwithindices, [keysegments, value], {keybuilder: leveldbext.verbatimArray});
  };
  DBHandlerWithIndices.prototype.originalUpsert = function (key, processorfunc, defaultrecord) {
    return DBHandler.prototype.upsert.call(this, key, processorfunc, defaultrecord);
  };
  DBHandlerWithIndices.prototype.upsert = function (keysegmentobj, processorfunc, defaultrecord) {
    var keysegments;
    try {
      keysegments = this.keySemgentObj2KeySegments(keysegmentobj);
    } catch (e) {
      return q.reject(e);
    }
    //this is an overkill, indices need not be notified at all...
    return leveldbext.storeWithIndices(this.dbwithindices, [keysegments, processorfunc, defaultrecord], {keybuilder: leveldbext.verbatimArray, putmethod:'originalUpsert'});
  };

  return DBHandlerWithIndices;

}

module.exports = createDBHandlerWithIndices;
