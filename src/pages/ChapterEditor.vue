<template>
  <div>
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
                <b-field label="Volume">
                  <b-input v-model="chapter.volume"></b-input>
                </b-field>
                <b-field label="Group name">
                  <b-input v-model="groupName"></b-input>
                </b-field>
                <b-field>
                  <b-checkbox v-model="isImgur">
                    Imgur
                  </b-checkbox>
                </b-field>
                <b-field v-if="isImgur" label="Imgur album ID">
                  <b-input v-model="pages"></b-input>
                </b-field>
                <div v-else>
                  <b-field label="List of image URLs">
                    <b-input v-model="pages" type="textarea"></b-input>
                  </b-field>
                  <b-button type="is-primary" @click="parseReddit">Parse Reddit post</b-button>
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

export default {
  name: 'ChapterEditor',
  components: {
    BButton
  },
  data: function () {
    return {
      isImgur: Groups.isImgur(this.chapter.groups),
      pages: Groups.getPages(this.chapter.groups),
      groupName: Groups.getGroupName(this.chapter.groups)
    }
  },
  beforeMount() {
  },
  methods: {
    discard() {
      this.$emit('discard');
    },
    save() {
      this.chapter.setLastUpdated(new Date());
      this.chapter.groups = Groups.getGroups(this.groupName, this.pages, this.isImgur);
      this.$emit('save', this.chapterKey, this.chapter);
    },
    parseReddit() {
      if (Reddit.isRedditUrl(this.pages)) {
        this.$emit('loading', 'Getting data from Reddit');
        Reddit.getImgArray(this.pages).then(value => {
          this.pages = value.join('\n');
          this.$emit('loaded');
        })
        .catch(() => {
          this.$emit('loaded');
          this.$buefy.toast.open({message: 'Failed to parse Reddit URL! Please try again later.', type: 'is-danger'});
        });
      } else {
        this.$buefy.toast.open({message: 'URL is not a valid Reddit URL!', type: 'is-warning'});
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
