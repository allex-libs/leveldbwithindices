function libMain(execlib) {
  return execlib.loadDependencies('client', ['allex_leveldblib', 'allex_bufferlib'], libLoader.bind(null, execlib));
}

function libLoader(execlib, leveldblib, bufferlib) {
  return execlib.lib.q(require('./libcreator')(execlib, leveldblib, bufferlib));
};

module.exports = libMain;
