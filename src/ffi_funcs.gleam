import gleam/io
import lustre/effect

@external(javascript, "./ffi.mjs", "addClassToElement")
pub fn do_add_class_to_element(id: String, class: String) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "removeClassFromElement")
pub fn do_remove_class_from_element(id: String, class: String) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "writeToLocalStorage")
pub fn do_write(key: String, value: String) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "readFromLocalStorage")
pub fn do_read(key: String) -> Result(String, Nil) {
  Error(Nil)
}

@external(javascript, "./ffi.mjs", "readModelInfoFromLocalStorage")
pub fn read_model_info_from_local_storage() -> String {
  ""
}

@external(javascript, "./ffi.mjs", "focusInput")
pub fn focus_input(id: String) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "every")
pub fn do_every(interval: Int, cb: fn() -> Nil) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "stop")
pub fn stop_interval(id: String) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "wait")
fn do_wait(ms: Int) -> Nil {
  Nil
}
