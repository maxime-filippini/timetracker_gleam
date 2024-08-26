import decoders
import gleam/dynamic
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/result
import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/event
import model.{type Model, Model}
import modem
import router

pub type LocalStorageData {
  LocalStorageData(count: Int, work_items: List(model.WorkItem))
}

pub opaque type Msg {
  UserIncrementedCount
  UserDecrementedCount
  UserResetCount
  OnRouteChange(router.Route)
  UserOpenedNewItemModal
  UserClosedNewItemModal
  UserUpdatedInputOfNewWorkItemId(id: String)
  UserUpdatedInputOfNewWorkItemLabel(label: String)
  UserAttemptedToAddNewItem(id: String, label: String)
  UserDeletedWorkItem(work_item: model.WorkItem)
  UserPressedKey(key: String, route: router.Route)
}

fn on_url_change(uri: Uri) -> Msg {
  router.on_route_change(uri) |> OnRouteChange()
}

/// This initializes the model
/// 
fn init(_flags) -> #(Model, effect.Effect(Msg)) {
  let assert Ok(local_storage_model) =
    decoders.local_storage_from_json(read_model_info_from_local_storage())

  let my_effect = effect.batch([modem.init(on_url_change)])

  #(
    model.Model(
      current_route: router.init(),
      count: local_storage_model.count,
      current_task: "",
      task_options: [],
      work_items: local_storage_model.work_items,
      new_work_item_id: "",
      new_work_item_label: "",
      new_work_item_modal_open: False,
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
  do_add_class_to_element("modal-add-work-item", "hidden")
}

fn validate_new_item(id: String, label: String) {
  todo
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
    OnRouteChange(route) -> {
      io.println("On route change triggered")
      Model(..model, current_route: route)
    }
    UserOpenedNewItemModal -> Model(..model, new_work_item_modal_open: True)
    UserClosedNewItemModal ->
      Model(
        ..model,
        new_work_item_modal_open: False,
        new_work_item_id: "",
        new_work_item_label: "",
      )
    UserUpdatedInputOfNewWorkItemId(id) -> Model(..model, new_work_item_id: id)
    UserUpdatedInputOfNewWorkItemLabel(label) ->
      Model(..model, new_work_item_label: label)
    UserAttemptedToAddNewItem(id, label) -> {
      let new_work_item = model.WorkItem(id: id, label: label)

      Model(..model, work_items: list.append(model.work_items, [new_work_item]))
    }
    UserDeletedWorkItem(work_item) ->
      Model(
        ..model,
        work_items: model.work_items
          |> list.filter(fn(wi) { wi.id != work_item.id }),
      )
    UserPressedKey(key, route) -> model
  }

  let persist_model = fn(_) { write_model_to_local_storage(model) }

  let effect = case msg {
    UserIncrementedCount -> effect.from(persist_model)
    UserDecrementedCount -> effect.from(persist_model)
    UserResetCount -> effect.from(persist_model)
    OnRouteChange(_route) -> effect.none()
    UserOpenedNewItemModal -> effect.from(fn(_) { focus_input("id-work-item") })
    UserClosedNewItemModal ->
      effect.from(fn(_) {
        io.debug(model.current_route)
        Nil
      })
    UserUpdatedInputOfNewWorkItemId(id) -> effect.none()
    UserUpdatedInputOfNewWorkItemLabel(label) -> effect.none()
    UserAttemptedToAddNewItem(id, label) ->
      effect.from(fn(dispatch) {
        write_work_items_to_local_storage(model.work_items)
        dispatch(UserClosedNewItemModal)
      })
    UserDeletedWorkItem(work_item) ->
      effect.from(fn(_) { write_work_items_to_local_storage(model.work_items) })
    UserPressedKey(key, route) ->
      effect.from(fn(dispatch) {
        io.debug("user pressed " <> key)

        case route {
          router.WorkItems ->
            case key {
              "N" | "n" -> dispatch(UserOpenedNewItemModal)

              _ -> Nil
            }
          _ -> Nil
        }
      })
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
    html.div(
      [
        attribute.class(
          "w-full h-32 rounded-lg bg-surface-0 flex px-8 py-2 items-center",
        ),
      ],
      [
        html.div([attribute.class("mx-auto flex-col w-full px-8")], [
          html.form([attribute.class("flex flex-col gap-4 w-full")], [
            html.div([attribute.class("flex gap-2")], [
              html.label(
                [attribute.for("work-item"), attribute.class("min-w-32")],
                [html.text("Work item")],
              ),
              html.select(
                [
                  attribute.name("selected-work-item"),
                  attribute.id("work-item"),
                  attribute.class("text-bg pl-2 grow rounded-md"),
                ],
                model.work_items
                  |> list.map(fn(work_item) {
                    html.option(
                      [attribute.value(work_item.id)],
                      work_item.label,
                    )
                  }),
              ),
            ]),
            html.div([attribute.class("flex gap-2")], [
              html.label(
                [attribute.for("work-item"), attribute.class("min-w-32")],
                [html.text("Description")],
              ),
              html.input([
                attribute.name("task-description"),
                attribute.id("task-description"),
                attribute.class("text-bg pl-2 grow rounded-md"),
              ]),
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
    |> list.map(fn(label) {
      html.th([attribute.class("w-1/3")], [html.text(label)])
    })

  let rows =
    model.work_items
    |> list.index_map(fn(wi, ix) {
      let tr_cls = case ix % 2 == 0 {
        True -> ""
        False -> "bg-surface-0"
      }

      html.tr([attribute.class(tr_cls)], [
        html.td([attribute.class("text-center")], [html.text(wi.id)]),
        html.td([attribute.class("text-center")], [html.text(wi.label)]),
        html.td([attribute.class("text-center")], [
          html.div([attribute.class("")], [
            html.button(
              [
                attribute.class(
                  "px-4 py-1 my-3 hover:bg-red-700 bg-red-500 text-white duration-300 rounded-full",
                ),
                event.on_click(UserDeletedWorkItem(wi)),
              ],
              [html.text("Delete")],
            ),
          ]),
        ]),
      ])
    })

  html.table([attribute.class("w-full table-auto rounded-md")], [
    html.thead([attribute.class("")], [
      html.tr([attribute.class("bg-surface-2 text-white")], headers),
    ]),
    html.tbody([], rows),
  ])
}

fn work_item_modal(model: Model) {
  let #(modal_display_cls, modal_size) = case model.new_work_item_modal_open {
    True -> #("block", "")
    False -> #("hidden", "scale-75")
  }

  let actual_modal =
    html.div(
      [
        attribute.id("modal-add-work-item"),
        attribute.class(
          "max-w-5xl w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-1 opacity-100 rounded-lg flex flex-col gap-4 p-4 z-999 duration-2000 transition "
          <> modal_size,
        ),
      ],
      [
        html.h2([attribute.class("text-xl font-semibold")], [
          html.text("Add new work item"),
        ]),
        html.form(
          [
            attribute.class("flex flex-col gap-4"),
            event.on_submit(UserAttemptedToAddNewItem(
              id: model.new_work_item_id,
              label: model.new_work_item_label,
            )),
          ],
          // TODO CHANGE EVENT
          [
            html.div([attribute.class("flex justify-center gap-4")], [
              html.label([attribute.class("mb-1 mt-1 min-w-32")], [
                html.text("ID:"),
              ]),
              html.input([
                attribute.id("id-work-item"),
                attribute.type_("text"),
                attribute.class("text-bg rounded-md grow py-1"),
                attribute.value(model.new_work_item_id),
                event.on_input(UserUpdatedInputOfNewWorkItemId),
              ]),
            ]),
            html.div([attribute.class("flex justify-center gap-4")], [
              html.label([attribute.class("mb-1 mt-1 min-w-32")], [
                html.text("Label:"),
              ]),
              html.input([
                attribute.id("label-work-item"),
                attribute.type_("text"),
                attribute.class("text-bg rounded-md grow px-4 py-1"),
                attribute.value(model.new_work_item_label),
                event.on_input(UserUpdatedInputOfNewWorkItemLabel),
              ]),
            ]),
            html.div([attribute.class("flex w-full gap-4")], [
              html.input([
                attribute.class(
                  "h-8 rounded-lg bg-teal-300 text-bg w-1/2 cursor-pointer",
                ),
                attribute.type_("submit"),
                attribute.value("Save"),
              ]),
              html.button(
                [
                  attribute.class("h-8 rounded-lg bg-red-400 text-bg w-1/2"),
                  event.on_click(UserClosedNewItemModal),
                  attribute.type_("button"),
                ],
                [html.text("Cancel")],
              ),
            ]),
          ],
        ),
      ],
    )

  let background =
    html.div(
      [
        attribute.id("modal-bg"),
        attribute.class("bg-bg opacity-90 w-screen h-screen z-990"),
        event.on_click(UserClosedNewItemModal),
      ],
      [],
    )

  html.div(
    [
      attribute.id("modal-add-work-item-container"),
      attribute.class(
        "absolute top-0 left-0 w-screen h-screen overflow-hidden z-1 flex flex-col "
        <> modal_display_cls,
      ),
    ],
    [
      html.div([attribute.class("w-full h-full relative")], [
        background,
        actual_modal,
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
        event.on_click(UserOpenedNewItemModal),
      ],
      [html.text("Add new item")],
    ),
  ])
}

fn view_analytics(model: Model) {
  html.div([], [])
}

type NavItem {
  NavItem(url: String, title: String, route: router.Route)
}

/// This is the UI of our app
/// 
fn view(model: Model) -> element.Element(Msg) {
  let nav_items = [
    NavItem(url: "/", title: "Tracker", route: router.Tracker),
    NavItem(url: "/work-items", title: "Work Items", route: router.WorkItems),
    NavItem(url: "/analytics", title: "Analytics", route: router.Analytics),
  ]

  let page_content = case model.current_route {
    router.Tracker -> view_tracker(model)
    router.WorkItems -> view_work_items(model)
    router.Analytics -> view_analytics(model)
  }

  html.body([event.on_keypress(UserPressedKey(_, model.current_route))], [
    html.div(
      [
        attribute.class(
          "text-white container p-4 mx-auto max-w-5xl sm:mt-8 mt-4 flex flex-col gap-4",
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
    ),
  ])
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

@external(javascript, "./ffi.mjs", "readModelInfoFromLocalStorage")
fn read_model_info_from_local_storage() -> String {
  todo
}

@external(javascript, "./ffi.mjs", "writeWorkItemsToLocalStorage")
fn write_work_items_to_local_storage(lst: List(model.WorkItem)) -> Nil {
  Nil
}

@external(javascript, "./ffi.mjs", "focusInput")
fn focus_input(id: String) -> Nil {
  Nil
}
