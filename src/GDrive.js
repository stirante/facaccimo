const URL_REGEX = /(?:https:\/\/)?drive.google.com\/file\/d\/([^/]+).+/;

export default class Reddit {
  static isGDriveUrl(url) {
    return url.split('\n').every(value => {
      return URL_REGEX.test(value.toLowerCase());
    })
  }
  static getImgArray(url) {
    let urls = url.split('\n');
    let output = [];
    for (let i = 0; i < urls.length; i++) {
      output.push("https://drive.google.com/uc?export=view&id=" + URL_REGEX.exec(urls[i])[1]);
    }
    return output;
  }
}