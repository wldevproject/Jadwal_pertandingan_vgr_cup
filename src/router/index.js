import { createRouter, createWebHistory } from 'vue-router';
import ResultsView from '../views/ResultsView.vue';
import ScheduleView from '../views/ScheduleView.vue';
import GroupsView from '../views/GroupsView.vue';

const routes = [
  {
    path: '/',
    redirect: { name: 'results', params: { categorySlug: 'putra' } },
  },
  {
    path: '/results/:categorySlug?',
    name: 'results',
    component: ResultsView,
    meta: { title: 'Hasil Pertandingan' },
  },
  {
    path: '/schedule/:categorySlug?',
    name: 'schedule',
    component: ScheduleView,
    meta: { title: 'Jadwal Pertandingan' },
  },
  {
    path: '/groups/:categorySlug?',
    name: 'groups',
    component: GroupsView,
    meta: { title: 'Klasemen Grup' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'results', params: { categorySlug: 'putra' } },
  },
];

export const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
