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
    <HomePage v-if="page === HOME_PAGE" v-on:finished="cloneRepo"/>
    <SeriesManager ref="manager" v-if="page === SERIES_MANAGER_PAGE" :series="series" v-on:series="goToSeries"
                   v-on:delete="deleteSeries" v-on:show="showUrl"/>
    <ChapterManager v-if="page === CHAPTER_MANAGER_PAGE" :name="fileName" :series="selectedSeries"
                    v-on:discard="discardSeries" v-on:save="saveSeries" v-on:chapter="goToChapter"/>
    <ChapterEditor v-if="page === CHAPTER_EDITOR_PAGE" :chapterKey="chapterKey" :chapter="chapter"
                   v-on:discard="discardChapter" v-on:save="saveChapter" v-on:loading="displayLoader" v-on:loaded="finishLoader"/>
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
      let target = this;
      target.loading = true;
      target.loadingStatus = 'Cloning repo';
      GitHubUtils.cloneRepo(this.repoName).then(value => {
        target.fs = value;
        target.loadingStatus = 'Parsing data';
        target.parseData();
      });
    },
    parseData() {
      this.series = [];
      this.fs.readdir('/', {}, (err, files) => {
        files.forEach(file => {
          if (file.endsWith('.json')) {
            this.fs.promises.readFile('/' + file, {}).then(data => {
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
            })
          }
        });
        this.loading = false;
        this.page = this.SERIES_MANAGER_PAGE;
      });
    },
    deleteSeries(fileName) {
      this.loadingStatus = 'Deleting ' + fileName;
      this.loading = true;
      let target = this;
      GitHubUtils.deleteSeries(fileName, this.username, this.pat, this.fs).then(() => {
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
      GitHubUtils.addSeries(name, series, this.username, this.pat, this.fs).then(() => {
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
