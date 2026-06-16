// Trimmed from GranblueParty (https://github.com/Minimalist3/GranblueParty)
'use strict'

// Usage: filterObject(obj, ([key, value]) => value > 1);
const filterObject = (obj, predicate) => Object.fromEntries(Object.entries(obj).filter(predicate));

// Deep clone of a plain (JSON-serializable) value. Used by the Bullets
// calculator to copy the bullet-stock map and item entries before mutating
// them while resolving components (src/pages/CalcBullets.vue).
const copy = (obj) => JSON.parse(JSON.stringify(obj));

class LocalStorageMgt {
  constructor(page) {
    this.page = page;
  }

  setValue(name, obj) {
    if (typeof name !== "string") {
      throw "name is not a String!"
    }
    localStorage.setItem(this.page + '-' + name, JSON.stringify(obj[name]));
  }

  // Only set the value if it exists
  getValue(obj, name) {
    if (typeof name !== "string") {
      throw "name is not a String!"
    }
    const tmpValue = localStorage.getItem(this.page + '-' + name);
    if (tmpValue) {
      obj[name] = JSON.parse(tmpValue);
    }
  }
}

export default {
  filterObject,
  copy,
  LocalStorageMgt,
}
