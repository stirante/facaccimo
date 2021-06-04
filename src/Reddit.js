const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/[a-z]+\/comments\/[a-z0-9]+\/[a-z0-9_]+\/?/;

export default class Reddit {
  static isRedditUrl(url) {
    return url.split('\n').every(value => {
      return URL_REGEX.test(value.toLowerCase())
    })
  }
  static getImgArray(url) {
    let urls = url.split('\n');
    let output = [];
    let promises = [];
    for (let i = 0; i < urls.length; i++) {
      let inner = [];
      output.push(inner);
      let u = urls[i];
      if (!u.toLowerCase().startsWith('http')) {
        u = "https://" + u;
      }
      promises.push(fetch("https://cors.stirante.com/" + u + ".json").then(value => {
        return value.text();
      }).then(value => {
        let data = JSON.parse(value);
        inner.push(data[0].data.children[0].data.gallery_data.items.map(function (item) {
          return "https://i.redd.it/" + item.media_id + "." + data[0].data.children[0].data.media_metadata[item.media_id].m.replace('image/', '');
        }));
      }));
    }
    return Promise.all(promises).then(() => {
      return output.flat(2);
    })
  }
}