import { createRouter, createWebHashHistory } from 'vue-router';
import ResultsView from '../views/ResultsView.vue';
import ScheduleView from '../views/ScheduleView.vue';
import GroupsView from '../views/GroupsView.vue';

const routes = [
  {
    path: '/',
    redirect: { name: 'results' },
  },
  {
    path: '/results',
    name: 'results',
    component: ResultsView,
    meta: { title: 'Hasil Pertandingan' },
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: ScheduleView,
    meta: { title: 'Jadwal Pertandingan' },
  },
  {
    path: '/groups',
    name: 'groups',
    component: GroupsView,
    meta: { title: 'Klasemen Grup' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'results' },
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
