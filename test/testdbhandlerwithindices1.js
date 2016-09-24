
function printfirst (caption, item) {
  console.log(caption, item);
}

function upserter (record) {
  console.log('how to upsert', record, '?');
  return record+1;
}

function useDBHWI (execlib, leveldblib, bufferlib, leveldbext, dbhwi) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  qlib.promise2console(dbhwi.compositePut({name: 'luka', product: 1+(~~(Math.random()*10))}, 1).then(
    dbhwi.upsert.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, upserter, 0)
  ).then(
    dbhwi.inc.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, null, 3, {defaultrecord:0})
  ).then(
    dbhwi.dec.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, null, 3, {defaultrecord:0})
  ).then(
    function (res) {
      console.log('ok', res);
      return dbhwi.traverse(printfirst.bind(null, 'storage'));
    }
  ).then(
    function (res) {
      console.log('ok', res);
      return dbhwi.dbwithindices[1].traverse(printfirst.bind(null, 'nameindex'));
    }
  ), 'put');
}

function createDBHWI (execlib, leveldblib, bufferlib, leveldbext) {
  'use strict';
  var q = execlib.lib.q;

  var sd = q.defer(), dbhwi = new leveldbext.DBHandlerWithIndices({
    starteddefer: sd,
    indices: ['name', {name: 'product', type: 'UInt32LE'}],
    path: 'test.db',
    dbcreationoptions: {
      valueEncoding: leveldblib.Int32LECodec
    }
  });
  sd.promise.then(useDBHWI.bind(null, execlib, leveldblib, bufferlib, leveldbext));
}

module.exports = function testDBHandlerWIndices1(execlib) {
  return execlib.loadDependencies('client', ['allex:leveldb:lib', 'allex:buffer:lib', 'allex:leveldbext:lib'], createDBHWI.bind(null, execlib));
};
