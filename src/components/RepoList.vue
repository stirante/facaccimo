<template>
  <section>
    <b-loading is-full-page v-model="loading"></b-loading>
    <b-field :disabled="!loading" label="Select a repository">
      <b-autocomplete
          v-model="repo"
          placeholder="Choose repository"
          field="full_name"
          open-on-focus
          :data="filteredDataObj"
          @select="option => $emit('repo-selected', option)"
      >
        <template #empty>No repositories found</template>
      </b-autocomplete>
    </b-field>
  </section>
</template>

<script>
import {BAutocomplete} from "buefy/src/components/autocomplete";
import GitHubUtils from "@/GitHubUtils";

export default {
  name: 'RepoList',
  components: {
    BAutocomplete
  },
  props: {
    username: String,
    pat: String
  },
  data: function () {
    return {
      repo: '',
      selected: null,
      repos: [],
      loading: true
    }
  },
  computed: {
    filteredDataObj() {
      return this.repos.filter(option => {
        return (
            option.full_name
                .toString()
                .toLowerCase()
                .indexOf(this.repo.toLowerCase()) >= 0
        )
      })
    }
  },
  beforeMount() {
    let target = this;
    GitHubUtils.getRepoList(this.username, this.pat).then(value => {
      target.repos = value.data;
      target.loading = false;
    });
  }
}
</script>

<style scoped>
</style>
