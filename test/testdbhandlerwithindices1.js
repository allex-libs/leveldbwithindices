
function printfirst (caption, item) {
  console.log(caption, item);
}

function upserter (record) {
  console.log('how to upsert', record, '?');
  return record+1;
}

function remover (record) {
  if (Math.random() > 0.5) {
    return record;
  }
}

function useDBHWI (execlib, leveldblib, bufferlib, leveldbwindices, dbhwi) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib;

  qlib.promise2console(dbhwi.compositePut({name: 'luka', product: 1+(~~(Math.random()*10))}, 1).then(
    dbhwi.upsert.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, upserter, 0)
  /*
  ).then(
    dbhwi.inc.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, null, 3, {defaultrecord:0})
  ).then(
    dbhwi.dec.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, null, 3, {defaultrecord:0})
    */
  ).then(
    dbhwi.upsert.bind(dbhwi, {name: 'luka', product: 1+(~~(Math.random()*10))}, remover, 0)
  ).then(
    function (res) {
      console.log('ok', res);
      return dbhwi.traverse(printfirst.bind(null, 'storage'));
    }
  ).then(
    function (res) {
      console.log('ok', res);
      return dbhwi.traverseByIndex('name', 'luka', console.log.bind(console, 'storage for luka'));
    }
  ), 'test');
}

function createDBHWI (execlib, leveldblib, bufferlib, leveldbwindices) {
  'use strict';
  var q = execlib.lib.q;

  var sd = q.defer(), dbhwi = new leveldbwindices.DBHandlerWithIndices({
    starteddefer: sd,
    indices: ['name', {name: 'product', type: 'UInt32LE'}],
    path: 'test.db',
    dbcreationoptions: {
      valueEncoding: leveldblib.UInt32LECodec
    }
  });
  sd.promise.then(useDBHWI.bind(null, execlib, leveldblib, bufferlib, leveldbwindices));
}

module.exports = function testDBHandlerWIndices1(execlib) {
  return execlib.loadDependencies('client', ['allex_leveldblib', 'allex_bufferlib', 'allex_leveldbwithindiceslib'], createDBHWI.bind(null, execlib));
};
