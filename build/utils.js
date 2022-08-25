const path = require('path');

function padZero(value) {
  const str = `${value}`;
  if (str.length > 1) {
    return str;
  }
  return `0${str}`;
}

function getCurrentTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = date.getDate();
  const hour = padZero(date.getHours());
  const minute = padZero(date.getMinutes());
  const second = padZero(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function ignoredFiles(appSrc) {
  return new RegExp(
    `^(?!${escape(
      path.normalize(`${appSrc}/`).replace(/[\\]+/g, '/'),
    )}).+`,
    'g',
  );
}

module.exports = {
  getCurrentTime,
  ignoredFiles
};
