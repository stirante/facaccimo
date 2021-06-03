import * as GitHub from "github-api";
import * as git from "isomorphic-git"
import * as http from "isomorphic-git/http/node"
import LightningFS from "@isomorphic-git/lightning-fs"

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

  static getSeriesUrl(name, repo, fs) {
    return git.currentBranch({
      fs: fs,
      dir: '/'
    })
      .then(value => {
        return 'https://raw.githubusercontent.com/' + repo + '/' + value + '/' + name;
      })
  }
}