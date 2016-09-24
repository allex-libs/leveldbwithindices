function libCreator (execlib, leveldblib, bufferlib) {
  var ret = {
    DBIndex: require('./dbindexcreator')(execlib, leveldblib, bufferlib),
  };
  ret.DBHandlerWithIndices = require('./dbhandlerwithindicescreator')(execlib, leveldblib, bufferlib, ret);
  require('./storageFuncs')(execlib, leveldblib, bufferlib, ret);
  return ret;
}

module.exports = libCreator;
