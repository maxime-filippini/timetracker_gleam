// import data/global
// import gleam/dynamic
// import gleam/io
// import gleam/json

// pub type LocalStorageModel {
//   LocalStorageModel(count: Int, work_items: List(global.WorkItem))
// }

// fn work_item() {
//   dynamic.decode2(
//     global.WorkItem,
//     dynamic.field("id", dynamic.string),
//     dynamic.field("label", dynamic.string),
//   )
// }

// pub fn local_storage_model() {
//   dynamic.decode2(
//     LocalStorageModel,
//     dynamic.field("count", dynamic.int),
//     dynamic.field("work_items", dynamic.list(work_item())),
//   )
// }
