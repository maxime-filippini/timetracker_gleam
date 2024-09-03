import data/global
import ffi_funcs
import gleam/list
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

pub type Model {
  Model(
    modal_open: Bool,
    work_items: List(global.WorkItem),
    new_work_item_id: String,
    new_work_item_label: String,
  )
}

pub type Msg {
  UserOpenedNewItemModal
  UserClosedNewItemModal
  UserUpdatedInputOfNewWorkItemId(id: String)
  UserUpdatedInputOfNewWorkItemLabel(label: String)
  UserAttemptedToAddNewItem(id: String, label: String)
  UserDeletedWorkItem(work_item: global.WorkItem)
}

pub fn init(global_model: global.Model) -> Model {
  Model(
    modal_open: False,
    work_items: global_model.work_items,
    new_work_item_id: "",
    new_work_item_label: "",
  )
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserOpenedNewItemModal -> {
      #(
        Model(
          ..model,
          modal_open: True,
          new_work_item_id: "",
          new_work_item_label: "",
        ),
        effect.from(fn(_) { ffi_funcs.focus_input("id-work-item") }),
      )
    }
    UserDeletedWorkItem(wi) -> {
      let work_items =
        model.work_items
        |> list.filter(fn(wi_) { wi_.id != wi.id })
      #(
        Model(..model, work_items:),
        effect.from(fn(_) {
          global.write_work_items_to_local_storage(work_items)
        }),
      )
    }
    UserUpdatedInputOfNewWorkItemId(new_work_item_id) -> {
      #(Model(..model, new_work_item_id:), effect.none())
    }
    UserUpdatedInputOfNewWorkItemLabel(new_work_item_label) -> {
      #(Model(..model, new_work_item_label:), effect.none())
    }
    UserClosedNewItemModal -> {
      #(Model(..model, modal_open: False), effect.none())
    }
    UserAttemptedToAddNewItem(id, label) -> {
      let work_item = global.WorkItem(id:, label:)
      let work_items = list.append(model.work_items, [work_item])
      #(
        Model(..model, work_items:),
        effect.from(fn(dispatch) {
          global.write_work_items_to_local_storage(work_items)
          dispatch(UserClosedNewItemModal)
        }),
      )
    }
  }
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
  let #(modal_display_cls, modal_size) = case model.modal_open {
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
                attribute.class("text-bg rounded-md grow py-1 px-4"),
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

pub fn view(model: Model) -> Element(Msg) {
  html.div([attribute.class("flex flex-col gap-4")], [
    work_items_table(model),
    html.button(
      [
        attribute.class("bg-catp-green w-full h-8 rounded-lg text-bg"),
        event.on_click(UserOpenedNewItemModal),
      ],
      [html.text("Add new item")],
    ),
    work_item_modal(model),
  ])
}
