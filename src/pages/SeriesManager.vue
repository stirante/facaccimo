<template>
  <div class="section">
    <div class="column">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <b-table :data="series"
                     default-sort="name"
                     :sort-icon="sortIcon"
                     hoverable
                     :sort-icon-size="sortIconSize">

              <b-table-column field="name" label="File name" v-slot="props" sortable>
                {{ props.row.name }}
              </b-table-column>

              <b-table-column field="title" label="Title" v-slot="props" sortable>
                {{ props.row.data.title }}
              </b-table-column>

              <b-table-column field="chapters" label="Chapters" v-slot="props" sortable>
                {{ Object.keys(props.row.data.chapters).length }}
              </b-table-column>

              <b-table-column field="last_chapter" label="Last Chapter" v-slot="props" sortable>
                {{
                  props.row.data.chapters[Object.keys(props.row.data.chapters)[Object.keys(props.row.data.chapters).length - 1]].title
                }}
              </b-table-column>

              <b-table-column field="actions" label="Actions" v-slot="props">
                <div class="buttons">
                  <b-button type="is-primary"
                            @click="showUrl(props.row.name)"
                            icon-pack="fas"
                            icon-right="link"/>
                  <b-button type="is-primary"
                            @click="goToSeries(props.row.name)"
                            icon-pack="fas"
                            icon-right="pen"/>
                  <b-button type="is-danger"
                            @click="confirmDelete(props.row.name)"
                            icon-pack="fas"
                            icon-right="trash"/>
                </div>
              </b-table-column>

              <template #empty>
                <div class="has-text-centered">No files</div>
              </template>

              <template #footer>
                <div class="has-text-right">
                  <b-button type="is-primary"
                            @click="addNewSeries()"
                            icon-pack="fas"
                            icon-left="plus">Add new series
                  </b-button>
                </div>
              </template>

            </b-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import {BTable} from "buefy/src/components/table";
import {BButton} from "buefy/src/components/button";

export default {
  name: 'SeriesManager',
  components: {
    BTable,
    BButton
  },
  data: function () {
    return {
      sortIcon: 'arrow-up',
      sortIconSize: 'is-small',
    }
  },
  computed: {},
  beforeMount() {
  },
  methods: {
    confirmDelete(fileName) {
      this.$buefy.dialog.confirm({
        title: 'Deleting ' + fileName,
        message: 'Are you sure you want to <b>delete</b> this series?',
        confirmText: 'Delete',
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => this.$emit('delete', fileName)
      })
    },
    showUrl(fileName) {
      this.$emit('show', fileName);
    },
    addNewSeries() {
      this.$buefy.dialog.prompt({
        message: `Provide file name`,
        inputAttrs: {
          placeholder: 'e.g. MangaName.json'
        },
        trapFocus: true,
        onConfirm: (value) => this.goToSeries(value)
      })
    },
    goToSeries(name) {
      if (!name.toLowerCase().endsWith('.json')) {
        name = name + '.json';
      }
      this.$emit('series', name);
    }
  },
  props: {
    series: Array
  }
}
</script>

<style scoped>

</style>
