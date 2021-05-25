export default class GitIO {
// POST 'https://git.io/create' --data-raw 'url=https%3A%2F%2Fraw.githubusercontent.com%2FKojoZero%2Fcolored-manga-guya%2Fmain%2Fbleach.json'
  static create(url) {
    let data = new FormData();
    data.append('url', url);
    return fetch('https://cors.stirante.com/https://git.io/create', {
      method: 'POST',
      body: data
    }).then(value => {
      return value.text();
    });
  }
}