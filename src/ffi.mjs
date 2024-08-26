import { Ok, Error, CustomType, Empty } from "./gleam.mjs";

export class LocalStorage extends CustomType {
  constructor(count, workItems) {
    super();
    this.count = count;
    this.workItems = workItems;
  }
}

export function writeToLocalStorage(key, value) {
  window.localStorage.setItem(key, String(value));
}

export function readFromLocalStorage(key) {
  let out = window.localStorage.getItem(key);
  return out ? new Ok(out) : new Error(undefined);
}

export function addClassToElement(elementId, classToAdd) {
  let elt = document.getElementById(elementId);

  if (elt) {
    elt.classList.add(classToAdd);
  }
}

export function removeClassFromElement(elementId, classToRemove) {
  let elt = document.getElementById(elementId);

  if (elt) {
    elt.classList.remove(classToRemove);
  }
}

export function readModelInfoFromLocalStorage() {
  let count = window.localStorage.getItem("count");
  let workItems = window.localStorage.getItem("work_items");

  count = count ? JSON.parse(count) : 0;
  workItems = workItems ? JSON.parse(workItems) : [];

  let out = JSON.stringify({ count: count, work_items: workItems });
  return out;
}

function linkedListToArray(list) {
  if (list instanceof Empty) {
    return [];
  } else {
    return [list.head].concat(linkedListToArray(list.tail));
  }
}

export function writeWorkItemsToLocalStorage(lst) {
  // Make a javascript list out of the gleam list
  let js_lst = linkedListToArray(lst);
  window.localStorage.setItem("work_items", JSON.stringify(js_lst));
}

export function focusInput(id) {
  window.setTimeout(() => document.getElementById(id).focus(), 0);
}
