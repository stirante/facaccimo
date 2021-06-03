<template>
  <div class="section">
    <div class="column">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <div v-if="step === 0">
              <p>I made this site to make managing cubari.moe repos easier to manage. This site is
                static and the code is
                open source.</p>
              <p>The source code is available on <a href="https://github.com/stirante/facaccimo">GitHub</a></p>
              <p>Additionally you can contact me on Discord (stirante#0001) or Reddit (u/stiranteee)</p>
            </div>
            <p v-if="step === 1">Do you have a GitHub account?</p>
            <p v-if="step === 2">Create an account <a href="https://github.com/" target="_blank">here</a></p>
            <p v-if="step === 3">Do you have a Personal Access Token?</p>
            <p v-if="step === 4">Create a Personal Access Token (or use existing one if already created) <a
                href="https://github.com/settings/tokens/new?scopes=repo,user:email&description=facaccimo"
                target="_blank">here</a>
            </p>
            <div v-if="step === 5">
              <p>Fill your GitHub username and Personal Access Token</p>
              <b-field label="Username">
                <b-input v-model="username" required validation-message="This field is required!"></b-input>
              </b-field>
              <b-field label="Personal Access Token">
                <b-input v-model="pat" required validation-message="This field is required!"></b-input>
              </b-field>
            </div>
            <p v-if="step === 6">Do you have a repository already?</p>
            <div v-if="step === 7">
              <p>Set the repository name</p>
              <b-field label="Repository name">
                <b-input v-model="repoName" required validation-message="This field is required!"></b-input>
              </b-field>
            </div>

            <div v-if="step === 8">
              <p>Select repository from the list</p>
              <RepoList :username="username" :pat="pat" v-on:repo-selected="onRepoSelected"/>
            </div>
            <p v-if="step === 9">Do you want to save Personal Access Token and repository name for the future (using
              browser's Local Storage)?</p>
          </div>
        </div>
        <footer class="card-footer">
          <a v-if="step === 0 && saved" href="#" @click="goToManager()" class="card-footer-item">Load saved</a>
          <a v-if="actionType === ACTION_BEGIN" href="#" @click="nextStep()" class="card-footer-item"
             :class="canContinue ? '' : 'disabled'">Begin</a>
          <a v-if="actionType === ACTION_NEXT" href="#" @click="nextStep()" class="card-footer-item">Next</a>
          <a v-if="actionType === ACTION_YES_NO" href="#" @click="nextStep(false)" class="card-footer-item">No</a>
          <a v-if="actionType === ACTION_YES_NO" href="#" @click="nextStep(true)" class="card-footer-item">Yes</a>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>

import RepoList from "@/components/RepoList";
import GitHubUtils from "@/GitHubUtils";

export default {
  name: 'HomePage',
  components: {RepoList},
  data: function () {
    return {
      ACTION_BEGIN: 'begin',
      ACTION_YES_NO: 'yes_no',
      ACTION_NEXT: 'next',
      ACTION_NONE: 'none',
      step: 0,
      actionType: 'begin',
      repoName: '',
      username: '',
      pat: '',
      email: '',
      saved: false
    }
  },
  computed: {
    canContinue: function () {
      if (this.step === 5) {
        return this.pat && this.username && this.pat !== '' && this.username !== '';
      }
      if (this.step === 7) {
        return this.repoName && this.repoName !== '';
      }
      return true;
    }
  },
  beforeMount() {
    if (window.localStorage.getItem('pat') && window.localStorage.getItem('username') && window.localStorage.getItem('repo')) {
      this.pat = window.localStorage.getItem('pat');
      this.username = window.localStorage.getItem('username');
      this.repoName = window.localStorage.getItem('repo');
      this.email = window.localStorage.getItem('email') ?? '';
      this.saved = true;
    }
  },
  methods: {
    nextStep: function (value) {
      if (!this.canContinue) return;
      if (this.step === 0) {
        this.actionType = this.ACTION_YES_NO;
        this.step = 1;
        this.pat = '';
        this.username = '';
        this.repoName = '';
      } else if (this.step === 1) {
        if (value) {
          this.step = 3;
          this.actionType = this.ACTION_YES_NO;
        } else {
          this.step = 2;
          this.actionType = this.ACTION_NEXT;
        }
      } else if (this.step === 2) {
        this.step = 3;
        this.actionType = this.ACTION_YES_NO;
      } else if (this.step === 3) {
        if (value) {
          this.step = 5;
          this.actionType = this.ACTION_NEXT;
        } else {
          this.step = 4;
          this.actionType = this.ACTION_NEXT;
        }
      } else if (this.step === 4) {
        this.step = 5;
        this.actionType = this.ACTION_NEXT;
      } else if (this.step === 5) {
        let target = this;
        this.$emit('loading', 'Checking token');
        GitHubUtils.getEmail(this.username, this.pat).then(email => {
          target.email = email;
          this.$emit('loaded');
          target.step = 6;
          target.actionType = this.ACTION_YES_NO;
        }).catch(() => {
          // We can't get user's email. Let's check whether token is valid at all. If we get repo list, then we just don't have email permission.
          GitHubUtils.getRepoList(this.username, this.pat)
              .then(() => {
                this.$emit('loaded');
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
                      target.step = 6;
                      target.actionType = this.ACTION_YES_NO;
                      close();
                    } else {
                      this.$buefy.toast.open({message: 'Invalid email!', type: 'is-danger'});
                    }
                  }
                })
              })
              .catch(() => {
                this.$emit('loaded');
                this.$buefy.toast.open({message: 'Invalid credentials!', type: 'is-danger'});
              })
        })
      } else if (this.step === 6) {
        if (value) {
          this.step = 8;
          this.actionType = this.ACTION_NONE;
        } else {
          this.step = 7;
          this.actionType = this.ACTION_NEXT;
        }
      } else if (this.step === 7 || this.step === 8) {
        if (this.step === 7) {
          let target = this;
          this.$emit('loading', 'Creating repo');
          GitHubUtils.createRepo(this.username, this.pat, this.repoName).then(value1 => {
            target.repoName = value1.data.full_name;
            this.$emit('loaded');
            this.step = 9;
            this.actionType = this.ACTION_YES_NO;
          });
        } else {
          this.step = 9;
          this.actionType = this.ACTION_YES_NO;
        }
      } else if (this.step === 9) {
        if (value) {
          window.localStorage.setItem('pat', this.pat);
          window.localStorage.setItem('username', this.username);
          window.localStorage.setItem('repo', this.repoName);
          window.localStorage.setItem('email', this.email);
        }
        this.goToManager();
      }
    },
    onRepoSelected: function (repo) {
      this.repoName = repo.full_name;
      this.actionType = this.ACTION_NEXT;
    },
    goToManager() {
      this.$emit('finished', {pat: this.pat, username: this.username, repoName: this.repoName, email: this.email});
    }
  },
  props: {}
}
</script>

<style scoped>

</style>
