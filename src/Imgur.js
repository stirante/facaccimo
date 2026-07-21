import CorsProxy from "./CorsProxy";

const URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?imgur\.com\/(?:a|gallery)\/([-\d\w]+)\/?$/;
const CLIENT_ID = 'd70305e7c3ac5c6';

export default class Imgur {
  static isImgurUrl(url) {
    return url.split('\n').every(value => {
      return URL_REGEX.test(value)
    })
  }

  static getAlbumId(url) {
    let exec = URL_REGEX.exec(url);
    if (!exec) {
      return null;
    }
    // Newer imgur URLs may contain a title slug (imgur.com/a/some-title-PNBfVYP),
    // the actual album ID is the last dash-separated segment
    let parts = exec[1].split('-');
    return parts[parts.length - 1];
  }

  static getImgArray(url) {
    let urls = url.split('\n');
    return Promise.all(urls.map(u => {
      let id = Imgur.getAlbumId(u);
      return CorsProxy.get('https://api.imgur.com/post/v1/albums/' + id + '?client_id=' + CLIENT_ID + '&include=media%2Cadconfig%2Caccount%2Ctags')
          .then(value => {
            if (!value.ok) {
              throw new Error('Failed to fetch imgur album: ' + value.status);
            }
            return value.json();
          })
          .then(value => {
            if (!value.media || value.media.length === 0) {
              throw new Error('Imgur album contains no images');
            }
            return value.media.map(item => item.url);
          });
    })).then(arrays => arrays.flat());
  }
}
