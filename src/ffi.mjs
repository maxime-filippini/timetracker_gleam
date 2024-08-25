import { Ok, Error } from "./gleam.mjs";

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
