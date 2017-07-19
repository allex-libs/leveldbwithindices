var _start = Date.now(),
  _count = 0;
function record() {
  return {nesto: _start+'_'+(++_count)};
}

function onIndexForDBHandler (execlib, leveldblib, bufferlib, leveldbext, storagedb, indices) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    dbwithindices = [storagedb].concat(indices),
    index = indices[0],
    jobs = [
      leveldbext.storeWithIndices.bind(null, dbwithindices, [['luka', 'intel_i5'], 7], {keybuilder: leveldbext.verbatimArray}),
      leveldbext.storeWithIndices.bind(null, dbwithindices, [['luka', 'nvidiaFX100'], 7], {keybuilder: leveldbext.verbatimArray}),
      leveldbext.storeWithIndices.bind(null, dbwithindices, [['pera', 'intel_i5'], 7], {keybuilder: leveldbext.verbatimArray}),
      leveldbext.storeWithIndices.bind(null, dbwithindices, [['pera', 'amd'], 7], {keybuilder: leveldbext.verbatimArray}),
      leveldbext.storeWithIndices.bind(null, dbwithindices, [['mika', 'intel_i5'], 7], {keybuilder: leveldbext.verbatimArray}),
      leveldbext.storeWithIndices.bind(null, dbwithindices, [['mika', 'nvidiaFX100'], 7], {keybuilder: leveldbext.verbatimArray}),
      indices[0].fetch.bind(indices[0], storagedb, 'luka')
    ];

  return (new qlib.PromiseChainerJob(jobs).go())
  .then(qlib.executor(index.traverse.bind(index, (item) => {console.log('name index', require('util').inspect(item,{depth:7}))})),
    null,
    console.log.bind(console, 'fetched record')
  );
}

function onStorageForDBHandler(execlib, leveldblib, bufferlib, leveldbext, storagedb) {
  'use strict';

  console.log('Dokle smo?');
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    DBIndex = leveldbext.DBIndex,
    d1 = q.defer(),
    indexname = new DBIndex({
      starteddefer: d1,
      dbname: 'test1index_index_name.db',
      indexedElementBufferUserName: ['Array', ['String']]
    }),
    d2 = q.defer(),
    indexproduct = new DBIndex({
      starteddefer: d2,
      dbname: 'test1index_index_product.db',
      indexedElementBufferUserName: ['Array', ['String']]
    });
  return q.all([d1.promise, d2.promise]).then(onIndexForDBHandler.bind(null, execlib, leveldblib, bufferlib, leveldbext, storagedb));
}

function onIndexForDBArray (execlib, leveldblib, bufferlib, leveldbext, storagedb, index) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  leveldbext.pushWithIndices([storagedb,index], [['a'], record()]).then(
    leveldbext.pushWithIndices.bind(null, [storagedb,index], [['b'], record()])
  ).then (
    index.fetch.bind(index, storagedb, 'a')
  ).then (
    qlib.executor(index.traverse.bind(index, (item) => {console.log('index', item)})),
    null,
    console.log.bind(console, 'fetched record')
  );
}

function onErrorExit (error) {
  console.error(error.stack);
  console.error(error);
  process.exit(1);
}

function goForDBArray (execlib, leveldblib, bufferlib, leveldbext) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    DBHandler = leveldblib.DBArray;

  var d = q.defer(),
    storage = new DBHandler({
      dbname: 'testindex1_array_storage.db',
      starteddefer: d,
      startfromone: true,
      dbcreationoptions: {
        valueEncoding: 'json'
      }
    });
  d.promise.then(
    onStorageForDBArray.bind(null, onIndexForDBArray , execlib, leveldblib, bufferlib, leveldbext),
    console.error.bind(console, 'aha!')
  );
}

function goForDBHandler (execlib, leveldblib, bufferlib, leveldbext) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    DBHandler = leveldblib.LevelDBHandler;

  var d = q.defer(),
    storage = new DBHandler({
      dbname: 'testindex1_assoc_storage.db',
      starteddefer: d,
      dbcreationoptions: {
        valueEncoding: 'json'
      }
    });
  qlib.promise2console(d.promise.then(
    onStorageForDBHandler.bind(null, execlib, leveldblib, bufferlib, leveldbext),
    console.error.bind(console, 'aha!')
  ), 'test');
}


module.exports = function test1(execlib) {
  return execlib.loadDependencies('client', ['allex_leveldblib', 'allex_bufferlib', 'allex_leveldbextlib'], goForDBHandler.bind(null, execlib));
};
