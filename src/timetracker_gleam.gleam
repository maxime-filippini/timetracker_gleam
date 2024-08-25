import gleam/dynamic.{type Dynamic, DecodeError}
import gleam/float
import gleam/int
import gleam/io
import gleam/list
import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element
import lustre/element/html
import lustre/event
import modem

pub type Route {
  Tracker
  WorkItems
  Analytics
}

type WorkItem {
  WorkItem(id: String, label: String)
}

type Model {
  Model(
    current_route: Route,
    count: Int,
    current_task: String,
    task_options: List(#(String, String)),
    work_items: List(WorkItem),
  )
}

pub type LocalStorageData {
  LocalStorageData(count: Int)
}

pub opaque type Msg {
  UserIncrementedCount
  UserDecrementedCount
  UserResetCount
  OnRouteChange(Route)
  UserClickedAddWorkItem
  ModalOpened
  UserCancelledAddWorkItem
}

/// Routing
/// 
fn on_route_change(uri: Uri) -> Msg {
  case uri.path_segments(uri.path) {
    ["work-items"] -> OnRouteChange(WorkItems)
    ["analytics"] -> OnRouteChange(Analytics)
    _ -> OnRouteChange(Tracker)
  }
}

/// This initializes the model
/// 
fn init(_flags) -> #(Model, effect.Effect(Msg)) {
  // Read the count from local storage
  // If there is any kind of failure to read, we set the count to 0 for now
  let count = case do_read("count") {
    Ok(count_str) ->
      case int.parse(count_str) {
        Ok(val) -> val
        _ -> 0
      }
    _ -> 0
  }

  let init_work_items = [
    WorkItem("hi", "Hi"),
    WorkItem("bye", "Bye"),
    WorkItem("ciao", "Ciao"),
  ]

  let my_effect = effect.batch([modem.init(on_route_change)])

  #(
    Model(
      current_route: Tracker,
      count:,
      current_task: "",
      task_options: [],
      work_items: init_work_items,
    ),
    my_effect,
  )
}

fn write_model_to_local_storage(model: Model) -> Nil {
  let s_count = int.to_string(model.count)
  io.debug("Writing model to local storage: count=" <> s_count)
  do_write("count", s_count)
}

fn close_modal() {
  do_remove_class_from_element("modal-add-work-item", "block")
  do_remove_class_from_element("modal-add-work-item", "opacity-90")
  do_add_class_to_element("modal-add-work-item", "hidden")
  do_add_class_to_element("modal-add-work-item", "opacity-100")
}

/// This updates the model based on a received message
/// 
fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  let model = case msg {
    UserIncrementedCount -> Model(..model, count: model.count + 1)
    UserDecrementedCount ->
      case model.count > 1 {
        True -> Model(..model, count: model.count - 1)
        False -> Model(..model, count: 0)
      }
    UserResetCount -> Model(..model, count: 0)
    UserClickedAddWorkItem -> model
    OnRouteChange(route) -> {
      io.println("On route change triggered")
      Model(..model, current_route: route)
    }
    ModalOpened -> model
    UserCancelledAddWorkItem -> model
  }

  let persist_model = fn(_) { write_model_to_local_storage(model) }

  let effect = case msg {
    UserIncrementedCount -> effect.from(persist_model)
    UserDecrementedCount -> effect.from(persist_model)
    UserResetCount -> effect.from(persist_model)
    UserClickedAddWorkItem ->
      effect.from(fn(dispatch) {
        io.debug("Modal opened")
        dispatch(ModalOpened)
      })
    OnRouteChange(_route) -> effect.none()
    ModalOpened ->
      effect.from(fn(_) {
        do_remove_class_from_element("modal-add-work-item", "hidden")
        do_add_class_to_element("modal-add-work-item", "block")
        do_add_class_to_element("modal-add-work-item", "opacity-90")
      })
    UserCancelledAddWorkItem -> effect.from(fn(_) { close_modal() })
  }

  #(model, effect)
}

/// Static component
/// 
fn header() {
  html.div([], [
    html.h1([attribute.class("text-3xl")], [element.text("Time tracker")]),
    html.p([], [
      element.text("A small app to track your time spent on work items."),
    ]),
  ])
}

fn horizontal_bar() {
  html.div([attribute.class("border-b-2 border-b-surface-0")], [])
}

fn nav_bar(items: List(NavItem)) -> element.Element(Msg) {
  html.div([attribute.class("w-full h-8 flex flex-col justify-center")], [
    html.nav([attribute.class("w-full")], [
      html.ul(
        [attribute.class("flex w-full")],
        items
          |> list.map(fn(item: NavItem) {
            html.li([attribute.class("mx-auto")], [
              html.a([attribute.href(item.url)], [html.text(item.title)]),
            ])
          }),
      ),
    ]),
  ])
}

fn start_button() {
  html.button(
    [
      attribute.class(
        "rounded-full h-4/5 aspect-square bg-green-500 hover:bg-green-600 duration-200 border-[3px] border-green-900 flex items-center justify-center",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "ml-2 border-t-[15px] border-t-transparent border-b-transparent w-0 h-0 border-b-[15px] border-l-[25px] border-white",
          ),
        ],
        [],
      ),
    ],
  )
}

fn view_tracker(model: Model) {
  html.div([], [
    html.div([attribute.class("flex gap-4")], [
      html.button([event.on_click(UserIncrementedCount)], [element.text("+")]),
      element.text(int.to_string(model.count)),
      html.button([event.on_click(UserDecrementedCount)], [element.text("-")]),
    ]),
    html.div([attribute.class("w-full")], [
      html.button([event.on_click(UserResetCount)], [element.text("Reset")]),
    ]),
    html.div(
      [
        attribute.class(
          "w-full h-32 rounded-lg bg-surface-0 flex px-8 py-2 items-center",
        ),
      ],
      [
        html.div([attribute.class("mx-auto flex-col")], [
          html.form([attribute.class("flex flex-col")], [
            html.div([attribute.class("flex gap-2")], [
              html.label([attribute.for("work-item")], [html.text("Work item")]),
              html.select(
                [
                  attribute.name("selected-work-item"),
                  attribute.id("work-item"),
                  attribute.class("text-bg"),
                ],
                ["A", "B", "C"]
                  |> list.map(fn(x) { html.option([attribute.value(x)], x) }),
              ),
            ]),
          ]),
        ]),
        start_button(),
      ],
    ),
  ])
}

fn work_items_table(model: Model) {
  let headers =
    ["ID", "Label", "Action"]
    |> list.map(fn(label) { html.th([], [html.text(label)]) })

  let rows =
    model.work_items
    |> list.index_map(fn(wi, ix) {
      let tr_cls = case ix % 2 == 0 {
        True -> ""
        False -> "bg-surface-1"
      }

      html.tr([attribute.class(tr_cls)], [
        html.td([attribute.class("text-center")], [html.text(wi.id)]),
        html.td([attribute.class("text-center")], [html.text(wi.label)]),
        html.td([attribute.class("text-center")], [html.text("")]),
      ])
    })

  html.table([attribute.class("w-full table-auto rounded-md")], [
    html.thead([attribute.class("rounded-md")], [
      html.tr([attribute.class("bg-surface-1 text-white rounded-md")], headers),
    ]),
    html.tbody([], rows),
  ])
}

fn work_item_modal(model: Model) {
  html.div(
    [
      attribute.id("modal-add-work-item"),
      attribute.class(
        "bg-bg transition-opacity ease-in opacity-100 duration-500 absolute top-0 left-0 w-screen h-screen overflow-hidden hidden z-1 flex flex-col",
      ),
    ],
    [
      html.div([attribute.class("w-full h-full relative")], [
        html.div(
          [
            attribute.class(
              "max-w-5xl w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-1 rounded-lg flex flex-col p-4",
            ),
          ],
          [
            html.h2([attribute.class("text-xl font-semibold")], [
              html.text("Add new work item"),
            ]),
            html.div([attribute.class("h-64")], []),
            html.button(
              [
                attribute.class("h-8 rounded-lg bg-red-400 text-bg"),
                event.on_click(UserCancelledAddWorkItem),
              ],
              [html.text("Cancel")],
            ),
          ],
        ),
      ]),
    ],
  )
}

fn view_work_items(model: Model) {
  html.div([attribute.class("flex flex-col gap-4")], [
    work_items_table(model),
    html.button(
      [
        attribute.class("bg-catp-green w-full h-8 rounded-lg text-bg"),
        event.on_click(UserClickedAddWorkItem),
      ],
      [html.text("Add new item")],
    ),
  ])
}

fn view_analytics(model: Model) {
  html.div([], [])
}

type NavItem {
  NavItem(url: String, title: String, route: Route)
}

/// This is the UI of our app
/// 
fn view(model: Model) -> element.Element(Msg) {
  let nav_items = [
    NavItem(url: "/", title: "Tracker", route: Tracker),
    NavItem(url: "/work-items", title: "Work Items", route: WorkItems),
    NavItem(url: "/analytics", title: "Analytics", route: Analytics),
  ]

  let page_content = case model.current_route {
    Tracker -> view_tracker(model)
    WorkItems -> view_work_items(model)
    Analytics -> view_analytics(model)
  }

  html.div(
    [
      attribute.class(
        "text-white container mx-auto max-w-5xl mt-8 flex flex-col gap-4",
      ),
    ],
    [
      header(),
      horizontal_bar(),
      nav_bar(nav_items),
      horizontal_bar(),
      page_content,
      work_item_modal(model),
    ],
  )
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub type Error {
  NotAValidInteger
  NotFoundInLocalStorage
}

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
