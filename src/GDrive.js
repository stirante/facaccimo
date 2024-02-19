const URL_REGEX = /(?:https:\/\/)?drive.google.com\/file\/d\/([^/]+).+/;
const OLD_URL_REGEX = /(?:https:\/\/)?drive\.google\.com\/uc\?id=([^&]+).+/;

export default class GDrive {
  static isGDriveUrl(url) {
    return url.split('\n').every(value => {
      return URL_REGEX.test(value.toLowerCase());
    })
  }
  static getImgArray(url) {
    let urls = url.split('\n');
    let output = [];
    for (let i = 0; i < urls.length; i++) {
      output.push("https://drive.usercontent.google.com/download?id=" + URL_REGEX.exec(urls[i])[1]);
    }
    return output;
  }
  static isOldGDriveUrl(url) {
    return url.split('\n').every(value => {
      return OLD_URL_REGEX.test(value.toLowerCase());
    })
  }
  static updateOldUrl(url) {
    let urls = url.split('\n');
    let output = [];
    for (let i = 0; i < urls.length; i++) {
      output.push("https://drive.usercontent.google.com/download?id=" + OLD_URL_REGEX.exec(urls[i])[1]);
    }
    return output.join('\n');
  }
}