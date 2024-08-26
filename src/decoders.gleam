import gleam/dynamic
import gleam/io
import gleam/json
import model

pub type LocalStorageModel {
  LocalStorageModel(count: Int, work_items: List(model.WorkItem))
}

fn work_item() {
  dynamic.decode2(
    model.WorkItem,
    dynamic.field("id", dynamic.string),
    dynamic.field("label", dynamic.string),
  )
}

pub fn local_storage_model() {
  dynamic.decode2(
    LocalStorageModel,
    dynamic.field("count", dynamic.int),
    dynamic.field("work_items", dynamic.list(work_item())),
  )
}

pub fn local_storage_from_json(
  json_string: String,
) -> Result(LocalStorageModel, json.DecodeError) {
  let out = json.decode(from: json_string, using: local_storage_model())
  io.debug(out)
}
