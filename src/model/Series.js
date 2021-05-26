import Chapter from "@/model/Chapter";

export default class Series {
  title;
  description;
  artist;
  author;
  cover;
  chapters;

  constructor(title, description, artist, author, cover, chapters) {
    this.title = title ?? '';
    this.description = description ?? '';
    this.artist = artist ?? '';
    this.author = author ?? '';
    this.cover = cover ?? '';
    this.chapters = chapters ?? {};
  }

  static fromJson(o) {
    return new Series(o.title, o.description, o.artist, o.author, o.cover, Chapter.fromJson(o.chapters))
  }
}