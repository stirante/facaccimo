import * as GitHub from "github-api";
import * as git from "isomorphic-git"
import * as http from "isomorphic-git/http/node"
import LightningFS from "@isomorphic-git/lightning-fs"
import Requestable from "github-api/dist/components/Requestable";

// Simple flag for testing
const DRY_RUN = false;

export default class GitHubUtils {
    static createGH(username, pat) {
        return new GitHub({
            username: username,
            password: pat
        });
    }

    static getRepoList(username, pat) {
        let gh = this.createGH(username, pat);
        return gh.getUser().listRepos();
    }

  static createPages(username, repo, branch, pat) {
    return new RepositoryExtension(repo, {
      username: username,
      password: pat
    }).createPages(branch, null, null);
  }

    static getEmail(username, pat) {
        let gh = this.createGH(username, pat);
        return gh.getUser().getEmails().then(value => {
            for (const email of value.data) {
                if (email.primary) {
                    return email.email;
                }
            }
            return value.data[0].email;
        });
    }

    static createRepo(username, pat, repoName) {
        let gh = this.createGH(username, pat);
        return gh.getUser().createRepo({
            name: repoName,
            description: 'Automatically created repository for cubari.moe'
        });
    }

    static cloneRepo(fullName) {
        const fs = new LightningFS('fs', {wipe: true});
        return git.clone({
            fs: fs,
            http: http,
            dir: '/',
            url: 'https://github.com/' + fullName,
            corsProxy: 'https://cors.isomorphic-git.org'
        })
            .then(() => {
                return fs;
            });
    }

    static commit(promise, fs, message, email) {
        return promise
            .then(() => {
                return git.commit({
                    fs: fs,
                    dir: '/',
                    author: {
                        name: 'Facaccimo',
                        email: email
                    },
                    message: message
                });
            });
    }

    static push(promise, fs, username, pat) {
        if (DRY_RUN) {
            return promise.then(() => {
                console.log('Not pushing, because DRY_RUN');
            })
        } else {
            return promise
                .then(() => {
                    return git.push({
                        fs: fs,
                        dir: '/',
                        http: http,
                        onAuth: () => ({username: username, password: pat})
                    });
                });
        }
    }

    static addSeries(name, series, username, pat, fs, email) {
        return this.push(
            this.commit(
                fs.promises.writeFile('/' + name, JSON.stringify(series, null, 2))
                    .then(() => {
                        return git.add({
                            fs: fs,
                            dir: '/',
                            filepath: name
                        })
                    }), fs, 'Update ' + name, email),
            fs, username, pat);
    }

    static deleteSeries(name, username, pat, fs, email) {
        return this.push(
            this.commit(
                fs.promises.unlink('/' + name, {})
                    .then(() => {
                        return git.remove({
                            fs: fs,
                            dir: '/',
                            filepath: name
                        });
                    }), fs, 'Delete ' + name, email),
            fs, username, pat);
    }

    static rename(oldName, newName, fs) {
        return Promise.all([
            git.remove({
                fs: fs,
                dir: '/',
                filepath: oldName
            }),
            git.add({
                fs: fs,
                dir: '/',
                filepath: newName
            })
        ]);
    }

    static getCurrentBranch(repo, fs) {
        return git.currentBranch({
            fs: fs,
            dir: '/'
        });
    }

    static getSeriesUrl(name, branch, repo) {
        return 'https://raw.githubusercontent.com/' + repo + '/' + branch + '/' + name;
    }

    static getTopics(repo, username, pat) {
        return new RepositoryExtension(repo, {
            username: username,
            password: pat
        }).getTopics(null);
    }

    static setTopics(topics, repo, username, pat) {
        return new RepositoryExtension(repo, {
            username: username,
            password: pat
        }).setTopics(topics, null);
    }
}

// eslint-disable-next-line no-unused-vars
class RepositoryExtension extends Requestable {
    /**
     * Create a RepositoryExtension.
     * @param {string} fullname - the full name of the repository
     * @param {Requestable.auth} [auth] - information required to authenticate to Github
     */
    constructor(fullname, auth) {
        super(auth, null, "mercy-preview");
        this.__fullname = fullname;
    }

    /**
     * Get all repository topics
     * @see https://docs.github.com/en/rest/reference/repos#get-all-repository-topics
     * @param {Requestable.callback} cb - will receive the comparison
     * @return {Promise} - the promise for the http request
     */
    getTopics(cb) {
        return this._request('GET', `/repos/${this.__fullname}/topics`, null, cb);
    }

    /**
     * Replace all repository topics
     * @see https://docs.github.com/en/rest/reference/repos#replace-all-repository-topics
     * @param {array<string>} topics - An array of topics to add to the repository. Pass one or more topics to replace the set of existing topics. Send an empty array ([]) to clear all topics from the repository. Note: Topic names cannot contain uppercase letters.
     * @param {Requestable.callback} cb - will receive the comparison
     * @return {Promise} - the promise for the http request
     */
    setTopics(topics, cb) {
        return this._request('PUT', `/repos/${this.__fullname}/topics`, {names: topics}, cb);
    }

  /**
   * Configures a GitHub Pages site
   * @see https://docs.github.com/en/rest/reference/repos#create-a-github-pages-site
   * @param {string} branch - The repository branch used to publish your site's source files
   * @param {string|null} path - The repository directory that includes the source files for the Pages site
   * @param {Requestable.callback} cb - will receive the comparison
   * @return {Promise} - the promise for the http request
   */
  createPages(branch, path, cb) {
    return this._request('POST', `/repos/${this.__fullname}/pages`, {source: {branch: branch, path: path ?? '/'}}, cb);
  }
}