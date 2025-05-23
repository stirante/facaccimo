<template>
  <div>
    <div>
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              Overview
            </p>
            <div class="buttons">
              <b-button type="is-danger" @click="discard">Discard</b-button>
              <b-button type="is-success" @click="save">Save</b-button>
            </div>
          </header>
          <div class="card-content">
            <div class="content">
              <section>
                <b-field label="Title">
                  <b-input v-model="series.title"></b-input>
                </b-field>
                <b-field grouped>
                  <b-field label="Artist" expanded>
                    <b-input v-model="series.artist"></b-input>
                  </b-field>
                  <b-field label="Author" expanded>
                    <b-input v-model="series.author"></b-input>
                  </b-field>
                </b-field>
                <b-field label="Description">
                  <b-input v-model="series.description" type="textarea"></b-input>
                </b-field>
                <b-field label="Cover URL">
                  <b-input v-model="series.cover"></b-input>
                </b-field>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              Chapters
            </p>
          </header>
          <div class="card-content">
            <div class="content">
              <div class="has-text-right">
                <b-button type="is-primary"
                          :disabled="checkedRows.length === 0"
                          @click="groupEdit()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="pen">Group edit volume
                </b-button>
                <b-button type="is-primary"
                          @click="addNewChapter()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="plus">Add new chapter
                </b-button>
              </div>
            <table>
              <thead>
                <tr>
                  <th>Chapter number</th>
                  <th>Title</th>
                  <th>Volume</th>
                  <th>Last updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="chapter in sortedChapters" :key="chapter.name">
                  <td>{{ chapter }}</td>
                  <td>{{ series.chapters[chapter].title }}</td>
                  <td>{{ series.chapters[chapter].volume }}</td>
                  <td>{{ ''+new Date(series.chapters[chapter].getLastUpdated()).toLocaleDateString() }}</td>
                  <td>
                    <div class="buttons">
                      <b-button type="is-primary"
                                @click="editChapter(chapter)"
                                icon-pack="fas"
                                icon-right="pen"/>
                      <b-button type="is-danger"
                                @click="confirmDelete(chapter)"
                                icon-pack="fas"
                                icon-right="trash"/>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
              <div v-if="sortedChapters.length === 0" class="has-text-centered">No chapters</div>
              <div class="has-text-right">
                <b-button type="is-primary"
                          :disabled="checkedRows.length === 0"
                          @click="groupEdit()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="pen">Group edit volume
                </b-button>
                <b-button type="is-primary"
                          @click="addNewChapter()"
                          icon-pack="fas"
                          class="m-1"
                          icon-left="plus">Add new chapter
                </b-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import Series from "@/model/Series";
import {BButton} from "buefy/src/components/button";
import Vue from "vue";
import Chapter from "@/model/Chapter";
import Groups from "@/model/Groups";
import GDrive from "@/GDrive";

export default {
  name: 'ChapterManager',
  components: {
    BButton
  },
  data: function () {
    return {
      currentPage: 1,
      checkedRows: []
    }
  },
  computed: {
    sortedChapters() {
      return Object.keys(this.series.chapters).sort(this.compareChapterNames);
    }
  },
  methods: {
    groupEdit() {
      let target = this;
      this.$buefy.dialog.prompt({
        message: `Set the volume for selected chapters`,
        trapFocus: true,
        onConfirm: (value) => {
          target.checkedRows.forEach(e => {
            target.series.chapters[e].volume = value;
          });
          target.$buefy.toast.open('Volume set!');
        }
      })
    },
    deleteChapter(number) {
      Vue.delete(this.series.chapters, number);
      // delete this.series.chapters[number];
      this.$buefy.toast.open('Chapter deleted!')
    },
    confirmDelete(number) {
      this.$buefy.dialog.confirm({
        title: 'Deleting chapter ' + number,
        message: 'Are you sure you want to <b>delete</b> this chapter?',
        confirmText: 'Delete',
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => this.deleteChapter(number)
      })
    },
    editChapter(number) {
      let lastVolume = '';
      let lastGroup = '';
      let keys = Object.keys(this.series.chapters);
      if (keys.length > 0) {
        let lastChapter = this.series.chapters[keys[keys.length - 1]];
        lastVolume = lastChapter.volume;
        lastGroup = Groups.getGroupName(lastChapter.groups);
      }
      this.$emit('chapter', number, this.series.chapters[number] ?? new Chapter(number, lastVolume, null, Groups.getImagesGroup(lastGroup, '')));
    },
    addNewChapter() {
      let key = '';
      let keys = this.sortedChapters;
      if (keys.length > 0) {
        let lastKey = keys[0];
        if (!isNaN(+lastKey)) {
          key = +lastKey + 1;
        }
      }
      this.$buefy.dialog.prompt({
        message: `Provide chapter number`,
        inputAttrs: {
          placeholder: 'e.g. 1',
          value: key + '',
          type: 'number',
          step: "any"
        },
        trapFocus: true,
        onConfirm: (value) => this.editChapter(value)
      })
    },
    discard() {
      this.$emit('discard');
    },
    save() {
      this.$emit('save', this.name, this.series);
    },
    fixOldGDriveUrls() {
      let target = this;
      this.$buefy.dialog.confirm({
        title: 'Fixing Google Drive links',
        message: 'Are you sure you want to fix all Google Drive links?',
        confirmText: 'Fix',
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => {
          let counter = 0;
          let keys = Object.keys(target.series.chapters);
          keys.forEach(e => {
            let chapter = target.series.chapters[e];
            let groups = Object.keys(chapter.groups);
            for (let i = 0; i < groups.length; i++) {
              let group = chapter.groups[groups[i]];
              for (let j = 0; j < group.length; j++) {
                if (GDrive.isOldGDriveUrl(group[j])) {
                  group[j] = GDrive.updateOldUrl(group[j]);
                  counter++;
                }
              }
            }
          });
          target.$buefy.toast.open(counter + ' old Google Drive links fixed!');
        }
      })
    },
    compareChapterNames(a, b, isAsc = false) {
      if (a === b || isNaN(+a) || isNaN(+b)) {
        return 0;
      }
      if (isAsc) {
        return (+a) - (+b);
      }
      return (+b) - (+a);
    }
  },
  props: {
    series: Series,
    name: String
  }
}
</script>

<style scoped>

</style>
