import ffi_funcs
import gleam/dynamic
import gleam/json
import router.{type Route}
import time

pub type WorkItem {
  WorkItem(id: String, label: String)
}

pub type Record {
  Record(time: time.Time, work_item_id: String, description: String)
}

pub type Model {
  Model(current_route: Route, work_items: List(WorkItem), records: List(Record))
}

type LocalStorageModel {
  LocalStorageModel(
    count: Int,
    work_items: List(WorkItem),
    records: List(Record),
  )
}

pub type NavItem {
  NavItem(url: String, title: String, route: router.Route)
}

fn local_storage_model() {
  let work_item =
    dynamic.decode2(
      WorkItem,
      dynamic.field("id", dynamic.string),
      dynamic.field("label", dynamic.string),
    )

  let time_decoder =
    dynamic.decode3(
      time.Time,
      dynamic.field("hours", dynamic.int),
      dynamic.field("minutes", dynamic.int),
      dynamic.field("seconds", dynamic.int),
    )

  let record =
    dynamic.decode3(
      Record,
      dynamic.field("time", time_decoder),
      dynamic.field("work_item_id", dynamic.string),
      dynamic.field("description", dynamic.string),
    )

  dynamic.decode3(
    LocalStorageModel,
    dynamic.field("count", dynamic.int),
    dynamic.field("work_items", dynamic.list(work_item)),
    dynamic.field("records", dynamic.list(record)),
  )
}

pub fn init() {
  let str_local_storage = ffi_funcs.read_model_info_from_local_storage()
  let assert Ok(local_storage_model) =
    json.decode(from: str_local_storage, using: local_storage_model())

  Model(
    current_route: router.init(),
    work_items: local_storage_model.work_items,
    records: local_storage_model.records,
  )
}

pub fn new_route(model: Model, route: Route) {
  Model(..model, current_route: route)
}

@external(javascript, "../ffi.mjs", "writeWorkItemsToLocalStorage")
pub fn write_work_items_to_local_storage(_lst: List(WorkItem)) -> Nil {
  Nil
}

@external(javascript, "../ffi.mjs", "writeRecordsToLocalStorage")
pub fn write_records_to_local_storage(_lst: List(Record)) -> Nil {
  Nil
}
