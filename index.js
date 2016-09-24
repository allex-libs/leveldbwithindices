function libMain(execlib) {
  return execlib.loadDependencies('client', ['allex:leveldb:lib', 'allex:buffer:lib'], libLoader.bind(null, execlib));
}

function libLoader(execlib, leveldblib, bufferlib) {
  return execlib.lib.q(require('./libcreator')(execlib, leveldblib, bufferlib));
};

module.exports = libMain;
