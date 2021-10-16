export default class Groups {

    static getProxyGroup(groupName, url) {
        let result = {};
        result[groupName] = url;
        return result;
    }

    static getImagesGroup(groupName, urls) {
        let result = {};
        result[groupName] = urls.split('\n');
        return result;
    }

    static getGroups(groupName, pages) {
        if (typeof pages === "string") {
            return this.getProxyGroup(groupName, pages);
        } else {
            return this.getImagesGroup(groupName, pages);
        }
    }

    static getGroupName(groups) {
        return Object.keys(groups)[0] ?? '';
    }

    static isProxy(groups) {
        return typeof (groups[this.getGroupName(groups)] ?? []) === "string";
    }

    static getPages(groups) {
        let imgs = groups[this.getGroupName(groups)] ?? [];
        if (typeof imgs === "string") {
            return imgs;
        }
        return imgs.join('\n');
    }

}
