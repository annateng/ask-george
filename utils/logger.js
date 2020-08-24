const info = (...params) => {
  console.log(...params); // eslint-disable-line
};

const error = (...params) => {
  console.error(...params);
};

module.exports = {
  info, error,
};
