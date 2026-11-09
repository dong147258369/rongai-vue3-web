import { createRouter, createWebHashHistory } from 'vue-router'

import CockpitHome from '../views/cockpit/CockpitHome.vue'
import InclusiveScene from '../views/cockpit/InclusiveScene.vue'
import IepContainer from '../views/iep/IepContainer.vue'

const routes = [
  {
    path: '/',
    redirect: '/cockpit'
  },
  {
    path: '/cockpit',
    name: 'CockpitHome',
    component: CockpitHome
  },
  {
    path: '/cockpit/inclusive',
    name: 'InclusiveScene',
    component: InclusiveScene
  },
  {
    path: '/iep/:view?',
    name: 'IepPlatform',
    component: IepContainer
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
