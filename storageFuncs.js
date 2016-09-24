function createStoreFuncs (execlib, leveldblib, bufferlib, leveldbext) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    _zeroString = String.fromCharCode(0),
    stringArrayCodec;

  function keyJoinerWithZeroString(keysegmentarry) {
    return keysegmentarry.join(_zeroString);
  }

  function keyJoiner2ByteArray (keysegmentarry) {
    if (!stringArrayCodec) {
      stringArrayCodec = bufferlib.makeCodec([['Array',['String']]], 'storageFuncStringArray');
    }
    return stringArrayCodec.encode([keysegmentarry]);
  }

  function verbatimArray (arry) {
    return arry;
  }

  function arrayToArrayOfStrings (arry) {
    return arry.map(function(item) {return item+'';});
  }

  //store to dbHandler
  function equalizer(key, elem) {
    return lib.isEqual(key, elem);
  }

  function adderToArray (key, valarry) {
    //console.log('input arry for index save', valarry, 'key is', key);
    if (!valarry[0].some(equalizer.bind(null, key))) {
      valarry[0].push(key);
    }
    //console.log('arry for index save', valarry);
    return valarry;
  }

  function saveIndices(dbwithindices, keysegmentarry, key, result) {
    var i, promises = [];
    for (i=1; i<dbwithindices.length; i++) {
      promises.push(dbwithindices[i].upsert(keysegmentarry[i-1], adderToArray.bind(null, key), [[]]));
    }
    return q.all(promises).then(
      qlib.returner(result)
    );
  }

  function storeWithIndices(dbwithindices, keysegmentswithdata, options) {
    var keybuildingfunc, keysegmentarry, key, storagedb, method;
    if (!lib.isArray(dbwithindices)) {
      return q.reject(new lib.Error('DBWITHINDICIES_NOT_AN_ARRAY','dbwithindices must be an array'));
    }
    if (!lib.isArray(keysegmentswithdata)) {
      return q.reject(new lib.Error('KEYSEGMENTSWITHDATA_NOT_AN_ARRAY','keysegmentswithdata must be an array'));
    }
    if (keysegmentswithdata.length < 2) { //index 0 => keysegments, index 1 => data, index 2 => extra param, ...
      return q.reject(new lib.Error('KEYSEGMENTSWITHDATA_LENGTH_IS_NOT_2','keysegmentswithdata should have at least 2 params'));
    }
    keysegmentarry = keysegmentswithdata[0];
    if (!lib.isArray(keysegmentarry)) {
      return q.reject(new lib.Error('KEYSEGMENT_FIRST_ELEM_NOT_AN_ARRAY','First elem of keysegmentswithdata must be an array'));
    }
    if (dbwithindices.length !== keysegmentarry.length+1) {
      return q.reject(new lib.Error('LENGTHS_DO_NOT_MATCH','dbwithindices length must be equal to keysegmentarry (first elem of keysegmentswithdata) length plus 1'));
    }
    if (keysegmentarry.length < 1) {
      return q.reject(new lib.Error('KEYSEGMENTARRY_EMPTY','keysegmentarry (first elem of keysegmentswithdata) must be non-empty array'));
    }
    storagedb = dbwithindices[0];
    options = options || {};
    keybuildingfunc = options.keybuilder || keyJoinerWithZeroString;
    key = keybuildingfunc(keysegmentarry);
    method = storagedb[options.putmethod || 'put'];
    return method.apply(storagedb, [key].concat(keysegmentswithdata.slice(1))).then(
      saveIndices.bind(null, dbwithindices, keysegmentarry, key)
    );
  }
  //store to dbHandler end

  //push to dbArray
  function pushWithIndices(dbwithindices, keysegmentswithdata, options) {
    //console.log('pushWithIndices', keysegmentswithdata);
    var keybuildingfunc, keysegmentarry, key, dbarry;
    if (!lib.isArray(dbwithindices)) {
      return q.reject(new lib.Error('DBWITHINDICIES_NOT_AN_ARRAY','First param dbwithindices must be an array'));
    }
    if (!lib.isArray(keysegmentswithdata)) {
      return q.reject(new lib.Error('KEYSEGMENTSWITHDATA_NOT_AN_ARRAY','Second param keysegmentswithdata must be an array'));
    }
    if (keysegmentswithdata.length !== 2) { //index 0 => keysegments, index 1 => data
      return q.reject(new lib.Error('KEYSEGMENTSWITHDATA_LENGTH_IS_NOT_2','keysegmentarry length must be 2'));
    }
    keysegmentarry = keysegmentswithdata[0];
    if (!lib.isArray(keysegmentarry)) {
      return q.reject(new lib.Error('KEYSEGMENT_FIRST_ELEM_NOT_AN_ARRAY','First elem of keysegmentswithdata must be an array'));
    }
    if (dbwithindices.length !== keysegmentarry.length+1) {
      return q.reject(new lib.Error('LENGTHS_DO_NOT_MATCH','dbwithindices length must be equal keysegmentarry (first elem of keysegmentswithdata) length plus 1'));
    }
    if (keysegmentarry.length < 1) {
      return q.reject(new lib.Error('KEYSEGMENTARRY_EMPTY','keysegmentarry (first elem of keysegmentswithdata) must be non-empty array'));
    }
    dbarry = dbwithindices[0];
    options = options || {};
    return dbarry.push(keysegmentswithdata[1]).then(
      saveIndicesAfterPush.bind(null, dbwithindices, keysegmentarry)
    );
  }

  function saveIndicesAfterPush(dbwithindices, keysegmentarry, result) {
    var i, promises = [], key = result[0];
    console.log('da li se zna koji je key?', result);
    for (i=1; i<dbwithindices.length; i++) {
      console.log('a segment', keysegmentarry[i-1], '?');
      promises.push(dbwithindices[i].upsert(keysegmentarry[i-1], adderToArray.bind(null, key), [[]]));
    }
    return q.all(promises).then(
      qlib.returner(result)
    );
  }
  //push to dbArray end

  leveldbext.storeWithIndices = storeWithIndices;
  leveldbext.pushWithIndices = pushWithIndices;
  leveldbext.keyJoinerWithZeroString = keyJoinerWithZeroString;
  leveldbext.keyJoiner2ByteArray = keyJoiner2ByteArray;
  leveldbext.verbatimArray = verbatimArray;
  leveldbext.arrayToArrayOfStrings = arrayToArrayOfStrings;
}

module.exports = createStoreFuncs;
