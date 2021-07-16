<template>
  <div id="app" class="container">
    <b-loading is-full-page v-model="loading">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <b-icon
                pack="fas"
                icon="sync-alt"
                custom-class="fa-spin">
            </b-icon>
            {{ loadingStatus }}
          </div>
        </div>
      </div>
    </b-loading>
    <div class="section">
      <div class="column">
        <h1 class="title">facaccimo</h1>
        <h2 class="subtitle">easy cubari.moe sources</h2>
      </div>
    </div>
    <HomePage v-if="page === HOME_PAGE" v-on:finished="cloneRepo" v-on:loading="displayLoader"
              v-on:loaded="finishLoader"/>
    <SeriesManager ref="manager" v-if="page === SERIES_MANAGER_PAGE" :series="series" v-on:series="goToSeries"
                   v-on:delete="deleteSeries" v-on:show="showUrl" v-on:loading="displayLoader"
                   v-on:loaded="finishLoader"/>
    <ChapterManager v-if="page === CHAPTER_MANAGER_PAGE" :name="fileName" :series="selectedSeries"
                    v-on:discard="discardSeries" v-on:save="saveSeries" v-on:chapter="goToChapter"
                    v-on:loading="displayLoader" v-on:loaded="finishLoader"/>
    <ChapterEditor v-if="page === CHAPTER_EDITOR_PAGE" :chapterKey="chapterKey" :chapter="chapter"
                   v-on:discard="discardChapter" v-on:save="saveChapter" v-on:loading="displayLoader"
                   v-on:loaded="finishLoader"/>
  </div>
</template>

<script>

import HomePage from "@/pages/HomePage";
import SeriesManager from "@/pages/SeriesManager";
import ChapterManager from "@/pages/ChapterManager";
import GitHubUtils from "@/GitHubUtils";
import Series from "@/model/Series";
import ChapterEditor from "@/pages/ChapterEditor";
import GitIO from "@/GitIO";

export default {
  name: 'App',
  components: {
    ChapterEditor,
    ChapterManager,
    HomePage,
    SeriesManager
  },
  methods: {
    showUrl(fileName) {
      let target = this;
      target.loadingStatus = 'Creating URL';
      target.loading = true;
      GitHubUtils.getSeriesUrl(fileName, this.repoName, this.fs).then(value => {
        return GitIO.create(value);
      }).then(value => {
        target.loading = false;
        let url = 'https://cubari.moe/proxy/gist/' + value + '/';
        this.$buefy.dialog.confirm({
          title: 'Cubari URL for ' + fileName,
          message: '<a href="' + url + '" target="_blank">' + url + '</a>',
          confirmText: 'OK',
          type: 'is-primary',
          hasIcon: true
        });
      })
    },
    cloneRepo(data) {
      this.pat = data.pat;
      this.username = data.username;
      this.repoName = data.repoName;
      this.email = data.email;
      let target = this;
      if (this.email === '') {
        this.$buefy.dialog.prompt({
          message: `Provide email address that will be associated with commits (usually the same as GitHub one)`,
          inputAttrs: {
            placeholder: 'user@example.org'
          },
          closeOnConfirm: false,
          trapFocus: true,
          canCancel: false,
          onConfirm: (value, {close}) => {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (re.test(String(value).toLowerCase())) {
              target.email = value;
              window.localStorage.setItem('email', target.email);
              close();
              target.loading = true;
              target.loadingStatus = 'Cloning repo';
              GitHubUtils.cloneRepo(this.repoName).then(value => {
                target.fs = value;
                target.loadingStatus = 'Parsing data';
                target.parseData();
              });
            } else {
              this.$buefy.toast.open({message: 'Invalid email!', type: 'is-danger'});
            }
          }
        })
      } else {
        target.loading = true;
        target.loadingStatus = 'Cloning repo';
        GitHubUtils.cloneRepo(this.repoName).then(value => {
          target.fs = value;
          target.loadingStatus = 'Parsing data';
          target.parseData();
        });
      }
    },
    parseData() {
      this.series = [];
      let noExt = [];
      this.fs.readdir('/', {}, (err, files) => {
        let promises = [];
        files.forEach(file => {
          if (file.endsWith('.json')) {
            promises.push(this.fs.promises.readFile('/' + file, {}).then(data => {
              this.loadingStatus = 'Parsing ' + file;
              try {
                this.series.push({
                  name: file,
                  data: Series.fromJson(JSON.parse(new TextDecoder().decode(data)))
                });
              } catch (e) {
                this.$buefy.toast.open({
                  message: 'Failed to parse ' + file + ': ' + e.message,
                  type: 'is-danger',
                  duration: 5000
                });
              }
            }))
          } else if (file.indexOf('.') === -1) {
            promises.push(this.fs.promises.readFile('/' + file, {}).then(data => {
              this.loadingStatus = 'Parsing ' + file;
              try {
                noExt.push({
                  name: file,
                  data: Series.fromJson(JSON.parse(new TextDecoder().decode(data)))
                });
              } catch {
                // We only check whether those files potentially could be series
              }
            }))
          }
        });
        return Promise.all(promises).then(() => {
          this.loading = false;
          if (noExt.length !== 0) {
            this.$buefy.dialog.confirm({
              title: 'Found potential series with no extension',
              message: 'Found files without extension, that could be series. Do you want to rename them to include ".json" extension?<pre>' + noExt.map(value => value.name).join('\n') + '</pre>',
              confirmText: 'Rename',
              type: 'is-primary',
              hasIcon: true,
              onConfirm: () => this.renameChapters(noExt),
              onCancel: () => this.page = this.SERIES_MANAGER_PAGE
            });
          } else {
            this.page = this.SERIES_MANAGER_PAGE;
          }
          if (!window.localStorage || !window.localStorage.getItem('skipTopics')) {
            GitHubUtils.getTopics(this.repoName, this.username, this.pat).then(value => {
              let names = value.data.names;
              if (names.indexOf('cubari-source') === -1) {
                this.$buefy.dialog.confirm({
                  title: 'Add GitHub topic?',
                  message: 'Do you want to add "cubari-source" topic to the repo, so that it will be possible to discover?',
                  confirmText: 'Add',
                  type: 'is-primary',
                  hasIcon: true,
                  onConfirm: () => {
                    names.push('cubari-source');
                    GitHubUtils.setTopics(names, this.repoName, this.username, this.pat);
                  },
                  onCancel: () => {
                    window.localStorage.setItem('skipTopics', "1");
                  }
                });
              }
            })
          }
        });
      })
    },
    renameChapters(noExt) {
      let target = this;
      this.loadingStatus = "Renaming files";
      this.loading = true;
      let promises = [];
      for (const item of noExt) {
        promises.push(Promise.all([
          this.fs.promises.rename('/' + item.name, '/' + item.name + '.json'),
          GitHubUtils.rename(item.name, item.name + '.json', this.fs)
        ]));
        item.name = item.name + '.json'
        this.series.push(item);
      }
      GitHubUtils.push(GitHubUtils.commit(Promise.all(promises), this.fs, 'Add .json extensions', this.email), this.fs, this.username, this.pat).then(() => {
        target.loading = false;
        this.page = this.SERIES_MANAGER_PAGE;
      })
    },
    deleteSeries(fileName) {
      this.loadingStatus = 'Deleting ' + fileName;
      this.loading = true;
      let target = this;
      GitHubUtils.deleteSeries(fileName, this.username, this.pat, this.fs, this.email).then(() => {
        target.parseData();
        target.loading = false;
        this.$buefy.toast.open('Series deleted!')
      })
    },
    goToSeries(name) {
      this.fs.promises.readFile('/' + name, {}).then(value => {
        this.fileName = name;
        this.selectedSeries = Series.fromJson(JSON.parse(new TextDecoder().decode(value)));
        this.page = this.CHAPTER_MANAGER_PAGE;
      })
          .catch(() => {
            this.fileName = name;
            this.selectedSeries = new Series(name.replace('.json', ''));
            this.page = this.CHAPTER_MANAGER_PAGE;
          })
    },
    discardSeries() {
      this.page = this.SERIES_MANAGER_PAGE;
    },
    saveSeries(name, series) {
      this.loadingStatus = 'Saving ' + name;
      this.loading = true;
      let target = this;
      GitHubUtils.addSeries(name, series, this.username, this.pat, this.fs, this.email).then(() => {
        this.parseData();
        target.loading = false;
      });
    },
    goToChapter(key, chapter) {
      this.chapterKey = key;
      this.chapter = chapter;
      this.page = this.CHAPTER_EDITOR_PAGE;
    },
    discardChapter() {
      this.page = this.CHAPTER_MANAGER_PAGE;
    },
    saveChapter(key, chapter) {
      this.selectedSeries.chapters[key] = chapter;
      this.page = this.CHAPTER_MANAGER_PAGE;
    },
    displayLoader(msg) {
      this.loading = true;
      this.loadingStatus = msg;
    },
    finishLoader() {
      this.loading = false;
    }
  },
  mounted() {
  },
  data: function () {
    return {
      HOME_PAGE: 'home',
      SERIES_MANAGER_PAGE: 'seriesManager',
      CHAPTER_MANAGER_PAGE: 'chapterManager',
      CHAPTER_EDITOR_PAGE: 'chapterEditor',
      page: 'home',
      email: '',
      pat: '',
      username: '',
      repoName: '',
      fileName: '',
      chapterKey: '',
      chapter: null,
      saved: false,
      loading: false,
      loadingStatus: '',
      fs: null,
      series: [],
      selectedSeries: null,
    }
  }
}
</script>

<style>

</style>
