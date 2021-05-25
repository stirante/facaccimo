export default class Groups {
  static getImgurProxyGroup(groupName, url) {
    let result = {};
    let re = /(?:https?:\/\/)?imgur.com\/a\/([a-zA-Z0-9]+)/;
    let id = url;
    if (re.test(url)) {
      id = re.exec(url)[1];
    }
    result[groupName] = '/proxy/api/imgur/chapter/' + id + '/';
    return result;
  }
  static getImagesGroup(groupName, urls) {
    let result = {};
    result[groupName] = urls.split('\n');
    return result;
  }
  static getGroups(groupName, pages, isImgur) {
    if (isImgur) {
      return this.getImgurProxyGroup(groupName, pages);
    } else {
      return this.getImagesGroup(groupName, pages);
    }
  }
  static getGroupName(groups) {
    return Object.keys(groups)[0] ?? '';
  }
  static isImgur(groups) {
    let imgs = groups[this.getGroupName(groups)] ?? [];
    return typeof imgs === "string";
  }
  static getPages(groups) {
    let imgs = groups[this.getGroupName(groups)] ?? [];
    if (typeof imgs === "string") {
      return imgs.replace('/proxy/api/imgur/chapter/', '').replace('/', '') ?? '';
    }
    return imgs.join('\n');
  }
}