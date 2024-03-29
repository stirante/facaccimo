<template>
  <div>
    <b-modal
        v-model="isImporting"
        has-modal-card
        :destroy-on-hide="false"
        aria-role="dialog"
        aria-label="Import"
        aria-modal>
      <template #default="props">
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">Import</p>
          </header>
          <section class="modal-card-body">
            <div v-if="importType === IMPORT_TYPE_REDDIT">
              Paste URL to Reddit Post
              <p class="is-italic">You can include multiple posts by pasting multiple URLs in separate lines</p>
            </div>
            <div v-else-if="importType === IMPORT_TYPE_GDRIVE">
              Paste URL to Google Drive shared image
              <p class="is-italic">You can include multiple images by pasting multiple URLs in separate lines</p>
            </div>
            <b-field>
              <b-input v-model="importContent" type="textarea"></b-input>
            </b-field>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <b-button @click="props.close">Cancel</b-button>
            <b-button type="is-primary" @click="finishImport(props.close)">Import</b-button>
          </footer>
        </div>
      </template>
    </b-modal>
    <div>
      <div class="column">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              Chapter
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
                  <b-input v-model="chapter.title"></b-input>
                </b-field>
                <b-field grouped>
                  <b-field label="Volume" expanded>
                    <b-input ref="volume" type="number" v-model="chapter.volume"></b-input>
                  </b-field>
                  <b-field label="Last updated" expanded>
                    <b-datetimepicker
                        icon-pack="fas"
                        icon="calendar"
                        v-model="datetime"
                        horizontal-time-picker>
                      <template #left>
                        <b-button
                            label="Now"
                            type="is-primary"
                            icon-left="clock"
                            @click="datetime = new Date()" />
                      </template>
                    </b-datetimepicker>
                  </b-field>
                </b-field>
                <b-field label="Group name">
                  <b-input v-model="groupName"></b-input>
                </b-field>
                <b-field>
                  <b-checkbox v-model="isProxy">
                    Proxy
                  </b-checkbox>
                </b-field>
                <div v-if="isProxy">
                  <b-field label="Chapter URL">
                    <b-input v-model="pages" @input="onProxyUrlChange"></b-input>
                  </b-field>
                  Paste MangaDex/MangaSee/Imgur/MangaKatana URL above and it should be automatically turned into <pre style="display: inline; padding: 0.5rem">/proxy/api/</pre> URL
                </div>
                <div v-else>
                  <b-field label="List of image URLs">
                    <b-input v-model="pages" type="textarea"></b-input>
                  </b-field>
                  <div class="has-text-right">
                    <b-dropdown aria-role="list">
                      <template #trigger="{ active }">
                        <b-button
                            label="Import"
                            type="is-primary"
                            icon-pack="fas"
                            :icon-right="active ? 'caret-up' : 'caret-down'"/>
                      </template>
                      <b-dropdown-item aria-role="listitem" @click="openRedditDialog">Reddit Gallery</b-dropdown-item>
                      <b-dropdown-item aria-role="listitem" @click="openGDriveDialog">Google Drive</b-dropdown-item>
                    </b-dropdown>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import {BButton} from "buefy/src/components/button";
import Chapter from "@/model/Chapter";
import Groups from "@/model/Groups";
import Reddit from "@/Reddit";
import GDrive from "@/GDrive";
import Proxy from "@/model/Proxy";

export default {
  name: 'ChapterEditor',
  components: {
    BButton
  },
  data: function () {
    return {
      IMPORT_TYPE_REDDIT: 'reddit',
      IMPORT_TYPE_GDRIVE: 'gdrive',
      isProxy: Groups.isProxy(this.chapter.groups),
      pages: Groups.getPages(this.chapter.groups),
      groupName: Groups.getGroupName(this.chapter.groups),
      datetime: this.chapter.getLastUpdated(),
      isImporting: false,
      importType: null,
      importContent: ''
    }
  },
  beforeMount() {
  },
  methods: {
    discard() {
      this.$emit('discard');
    },
    save() {
      if (!this.$refs.volume.isValid) {
        return;
      }
      this.chapter.setLastUpdated(this.datetime);
      this.chapter.groups = Groups.getGroups(this.groupName, this.pages, this.isProxy);
      this.$emit('save', this.chapterKey, this.chapter);
    },
    openRedditDialog() {
      this.importType = this.IMPORT_TYPE_REDDIT;
      this.importContent = '';
      this.isImporting = true;
    },
    openGDriveDialog() {
      this.importType = this.IMPORT_TYPE_GDRIVE;
      this.importContent = '';
      this.isImporting = true;
    },
    finishImport(close) {
      if (this.importType === this.IMPORT_TYPE_REDDIT) {
        this.parseReddit(this.importContent, close);
      } else if (this.importType === this.IMPORT_TYPE_GDRIVE) {
        this.parseGDrive(this.importContent, close);
      }
    },
    parseGDrive(urls, close) {
      if (GDrive.isGDriveUrl(urls)) {
        close();
        this.isImporting = false;
        this.pages += (this.pages.length === 0 ? '' : '\n') + GDrive.getImgArray(urls).join('\n');
      } else {
        this.$buefy.toast.open({message: 'URLs are not a valid Google Drive URLs!', type: 'is-warning'});
      }
    },
    parseReddit(urls, close) {
      if (Reddit.isRedditUrl(urls)) {
        close();
        this.isImporting = false;
        this.$emit('loading', 'Getting data from Reddit');
        Reddit.getImgArray(urls).then(value => {
          this.pages += (this.pages.length === 0 ? '' : '\n') + value.join('\n');
          this.$emit('loaded');
        })
            .catch(() => {
              this.$emit('loaded');
              this.$buefy.toast.open({
                message: 'Failed to parse Reddit Galleries! Please try again later.',
                type: 'is-danger'
              });
            });
      } else {
        this.$buefy.toast.open({message: 'URLs are not a valid Reddit Posts!', type: 'is-warning'});
      }
    },
    onProxyUrlChange() {
      let proxy = Proxy.getProxyByUrl(this.pages);
      if (proxy) {
        this.pages = proxy.getProxyUrl(this.pages);
      }
    }

  },
  props: {
    chapter: Chapter,
    chapterKey: String
  }
}
</script>

<style scoped>

</style>
