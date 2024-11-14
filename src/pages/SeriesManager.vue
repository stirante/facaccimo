<template>
  <div class="section">
    <div class="column">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <table>
              <thead>
                <tr>
                  <th>File name</th>
                  <th>Title</th>
                  <th>Chapters</th>
                  <th>Last Chapter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="series in series" :key="series.name">
                  <td>{{ series.name }}</td>
                  <td>{{ series.data.title }}</td>
                  <td>{{ Object.keys(series.data.chapters).length }}</td>
                  <td>
                    {{ Object.keys(series.data.chapters).length !== 0
                      ? series.data.chapters[
                          Object.keys(series.data.chapters)[
                            Object.keys(series.data.chapters).length - 1
                          ]
                        ].title
                      : "N/A" }}
                  </td>
                  <td>
                    <div class="buttons">
                      <b-button
                        type="is-primary"
                        @click="showUrl(series.name)"
                        icon-pack="fas"
                        icon-right="link"
                      />
                      <b-button
                        type="is-primary"
                        @click="goToSeries(series.name)"
                        icon-pack="fas"
                        icon-right="pen"
                      />
                      <b-button
                        type="is-danger"
                        @click="confirmDelete(series.name)"
                        icon-pack="fas"
                        icon-right="trash"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="series.length === 0" class="has-text-centered">No files</div>
            <div class="has-text-right">
              <b-button type="is-primary"
                        @click="addNewSeries()"
                        icon-pack="fas"
                        icon-left="plus">Add new series
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { BButton } from "buefy/src/components/button";

export default {
  name: "SeriesManager",
  components: {
    BButton,
  },
  data: function() {
    return {
      sortIcon: "arrow-up",
      sortIconSize: "is-small",
    };
  },
  computed: {},
  beforeMount() {},
  methods: {
    confirmDelete(fileName) {
      this.$buefy.dialog.confirm({
        title: "Deleting " + fileName,
        message: "Are you sure you want to <b>delete</b> this series?",
        confirmText: "Delete",
        type: "is-danger",
        hasIcon: true,
        onConfirm: () => this.$emit("delete", fileName),
      });
    },
    showUrl(fileName) {
      this.$emit("show", fileName);
    },
    addNewSeries() {
      this.$buefy.dialog.prompt({
        message: `Provide file name`,
        inputAttrs: {
          placeholder: "e.g. MangaName.json",
        },
        trapFocus: true,
        onConfirm: (value) => this.goToSeries(value),
      });
    },
    goToSeries(name) {
      if (!name.toLowerCase().endsWith(".json")) {
        name = name + ".json";
      }
      this.$emit("series", name);
    },
  },
  props: {
    series: Array,
  },
};
</script>

<style scoped></style>
