// Client-side replacement for the original SSR head mixin
const DEFAULT_TITLE = 'Raziel Ledger - Granblue Fantasy Calculators';
const DEFAULT_DESC = 'Material calculators for Granblue Fantasy Eternals and Evokers';

export default function setHead(head = {}) {
  document.title = head.title || DEFAULT_TITLE;
  document.querySelector('meta[name="title"]').setAttribute('content', head.title || DEFAULT_TITLE);
  document.querySelector('meta[name="description"]').setAttribute('content', head.desc || DEFAULT_DESC);
}
