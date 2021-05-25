export default class Chapter {
  title;
  volume;
  last_updated;
  groups;

  constructor(title, volume, last_updated, groups) {
    this.volume = volume ?? '';
    this.last_updated = last_updated ?? Math.floor((+new Date()) / 1000) + '';
    this.groups = groups ?? {};
    this.title = title ?? '';
  }

  getLastUpdated() {
    return new Date(+this.last_updated * 1000);
  }

  setLastUpdated(date) {
    this.last_updated = Math.floor((+date) / 1000) + '';
  }

  static fromJson(o) {
    let chapters = {};
    for (const key of Object.keys(o)) {
      let c = o[key];
      chapters[key] = new Chapter(c.title, c.volume, c.last_updated, c.groups);
    }
    return chapters;
  }

}