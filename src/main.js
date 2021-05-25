import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import 'bulmaswatch/cyborg/bulmaswatch.min.css'

Vue.use(Buefy, {
  defaultIconPack: 'fas'
})

// Few helpful links for development

// https://raw.githubusercontent.com/KojoZero/colored-manga-guya/main/bleach.json
// https://github.com/settings/tokens/new?scopes=repo&description=facaccimo
// https://www.reddit.com/r/manga/comments/mcicbp/sl_how_to_host_a_series_on_imgur_with_guyamoe/
// https://github.com/isomorphic-git/lightning-fs
// https://github.com/isomorphic-git/isomorphic-git
// https://github.com/KojoZero/colored-manga-guya
// https://cubari.moe/read/gist/JYfGI/

// https://isomorphic-git.org/docs/en/authentication.html
// https://github.com/isomorphic-git/cors-proxy
// https://isomorphic-git.org/docs/en/push
// https://docs.github.com/en/rest/reference/repos#create-a-repository-for-the-authenticated-user
// https://github-tools.github.io/github/docs/3.2.3/User.html#createRepo
// https://github.com/stirante/facaccimo-test

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
