import router.{type Route}
import time

pub type WorkItem {
  WorkItem(id: String, label: String)
}

pub type Record {
  Record(time: time.Time, work_item: WorkItem)
}

pub type Model {
  Model(
    current_route: Route,
    count: Int,
    current_task: String,
    task_options: List(#(String, String)),
    work_items: List(WorkItem),
    new_work_item_id: String,
    new_work_item_label: String,
    new_work_item_modal_open: Bool,
    current_timer: Int,
    timer_running: Bool,
    records: List(Record),
  )
}
