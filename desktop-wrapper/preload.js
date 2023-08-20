const electron = require("electron");

const filter = {
  urls: ['*://*.reddit.com/*', '*://*.github.com/*']
};
const session = electron.remote.session
session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
  details.requestHeaders['Origin'] = null;
  details.headers['Origin'] = null;
  callback({ requestHeaders: details.requestHeaders })
});



window.isElectron = true;