export default class Proxy {

    static PROXIES = [
        new Proxy('mangadex', 'MangaDex', /^https:\/\/mangadex.org\/chapter\/([\d\w-]+)\/?$/),
        new Proxy('imgur', 'Imgur', /^https:\/\/imgur.com\/(?:a|gallery)\/([\d\w]+)\/?$/),
        new Proxy('mangasee', 'MangaSee', /^https:\/\/mangasee123.com\/read-online\/([\d\w-]+)-page-[\d]+\.html$/),
        new Proxy('mangakatana', 'MangaKatana', /^https:\/\/mangakatana.com\/manga\/([\d\w-.]+)\/c([\d]+)\/?$/, function (name, exec) {
            return '/proxy/api/' + name + '/chapter/' + btoa(exec[0]) + '/';
        })
    ]
    static PROXY_REGEX = /^\/proxy\/api\/([\w]+)\/chapter\/([\d\w-=]+)\/?/
    _name;
    _niceName;
    urlRegex;
    urlConstructor;


    constructor(name, niceName, urlRegex, urlConstructor) {
        this.urlRegex = urlRegex;
        this._name = name;
        this._niceName = niceName;
        this.urlConstructor = urlConstructor ?? function (name, exec) {
            return '/proxy/api/' + name + '/chapter/' + exec[1];
        };
    }

    static getProxyByProxyUrl(url) {
        let exec = Proxy.PROXY_REGEX.exec(url);
        if (exec) {
            for (const proxy of Proxy.PROXIES) {
                if (proxy.name === exec[1]) {
                    return proxy;
                }
            }
        }
        return null;
    }

    static getProxyByUrl(url) {
        for (const proxy of Proxy.PROXIES) {
            if (proxy.urlRegex.test(url)) {
                return proxy;
            }
        }
        return null;
    }

    getProxyUrl(url) {
        let exec = this.urlRegex.exec(url);
        if (exec) {
            return this.urlConstructor(this.name, exec);
        }
    }

    get name() {
        return this._name;
    }

    get niceName() {
        return this._niceName;
    }
}