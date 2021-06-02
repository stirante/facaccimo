export default class Reddit {
  static isRedditUrl(url) {
    return /(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/[a-z]+\/comments\/[a-z0-9]+\/[a-z0-9_]+\/?/g.test(url);
  }
  static getImgArray(url) {
    if (!url.startsWith('http')) {
      url = "https://" + url;
    }
    url = "https://cors.stirante.com/" + url + ".json";
    return fetch(url).then(value => {
      return value.text();
    }).then(value => {
      let data = JSON.parse(value);
      return data[0].data.children[0].data.gallery_data.items.map(function (item) {
        return "https://i.redd.it/" + item.media_id + "." + data[0].data.children[0].data.media_metadata[item.media_id].m.replace('image/', '');
      });
    });
  }
}