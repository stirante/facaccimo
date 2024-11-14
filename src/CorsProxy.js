export default class CorsProxy {

    static URL = 'https://cors.stirante.com';
    static DEV_URL = 'http://localhost:3000';

    static get(url, headers) {
        if (window.isElectron) {
            return fetch(url, {
                headers: headers
            })
        }
        if (url.startsWith('https://')) {
            url = url.replace('https://', '');
        }
        return fetch(CorsProxy.getProxyUrl() + '/' + url, {
            headers: headers
        })
    }

    static getProxyUrl() {
        if (window.isElectron) {
            return undefined;
        }
        if (process.env.NODE_ENV === 'development') {
            return CorsProxy.DEV_URL;
        }
        return CorsProxy.URL;
    }

    static isAvailable() {
        if (window.isElectron || process.env.NODE_ENV !== 'development') {
            return new Promise((resolve) => resolve(true));
        }
        return this.get('https://github.com/').then(() => true).catch(() => false);
    }
}