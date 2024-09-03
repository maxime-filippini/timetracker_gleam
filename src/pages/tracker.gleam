import data/global
import ffi_funcs
import gleam/io
import gleam/list
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import time

pub type Model {
  Model(
    active: Bool,
    current_time: Int,
    id: String,
    description: String,
    work_items: List(global.WorkItem),
  )
}

pub type Msg {
  UserStartedTimer
  UserStoppedTimer
  UserUpdatedId(id: String)
  UserUpdatedDescription(desc: String)
  TimerUpdate
  AddRecord(record: global.Record)
}

pub fn init(global_model: global.Model) -> Model {
  let id = case global_model.work_items {
    [first, ..] -> first.id
    _ -> ""
  }

  Model(
    active: False,
    current_time: 0,
    id: id,
    description: "",
    work_items: global_model.work_items,
  )
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    TimerUpdate -> {
      #(Model(..model, current_time: model.current_time + 1), effect.none())
    }
    UserStartedTimer -> #(
      Model(..model, active: True, current_time: 0),
      effect.from(fn(dispatch) {
        ffi_funcs.do_every(1000, fn() { dispatch(TimerUpdate) })
      }),
    )
    UserStoppedTimer -> #(
      Model(..model, active: False),
      effect.from(fn(dispatch) {
        let record =
          global.Record(
            time: time.from_seconds(model.current_time),
            work_item_id: model.id,
            description: model.description,
          )

        ffi_funcs.stop_interval("__timer")

        dispatch(AddRecord(record))
      }),
    )
    AddRecord(_) -> {
      #(model, effect.none())
    }
    UserUpdatedId(id) -> {
      #(Model(..model, id: id), effect.none())
    }
    UserUpdatedDescription(desc) -> {
      #(Model(..model, description: desc), effect.none())
    }
  }
}

pub fn view(model: Model) -> Element(Msg) {
  html.div([attribute.class("grow")], [
    html.div(
      [
        attribute.class(
          "w-full sm:h-32 h-96 rounded-lg bg-surface-0 flex sm:flex-nowrap  flex-wrap sm:px-8 py-2 items-center justify-center",
        ),
      ],
      [
        html.div([attribute.class("flex-col px-8")], [
          html.form([attribute.class("flex flex-col gap-4 sm:w-full w-64")], [
            html.div(
              [
                attribute.class(
                  "flex gap-2 sm:flex-nowrap flex-wrap justify-center",
                ),
              ],
              [
                html.label(
                  [
                    attribute.for("work-item"),
                    attribute.class("sm:min-w-32 min-w-full text-center"),
                  ],
                  [html.text("Work item")],
                ),
                html.select(
                  [
                    attribute.name("selected-work-item"),
                    attribute.id("work-item"),
                    attribute.disabled(model.active),
                    attribute.class(
                      "text-bg pl-2 rounded-md sm:min-w-64 min-w-full",
                    ),
                    attribute.value(model.id),
                    event.on_input(UserUpdatedId),
                  ],
                  model.work_items
                    |> list.map(fn(work_item) {
                      html.option(
                        [attribute.value(work_item.id)],
                        work_item.label,
                      )
                    }),
                ),
              ],
            ),
            html.div(
              [
                attribute.class(
                  "flex gap-2 sm:flex-nowrap flex-wrap justify-center",
                ),
              ],
              [
                html.label(
                  [
                    attribute.for("work-item"),
                    attribute.class("sm:min-w-32 min-w-full text-center"),
                  ],
                  [html.text("Description")],
                ),
                html.input([
                  attribute.name("task-description"),
                  attribute.id("task-description"),
                  attribute.disabled(model.active),
                  attribute.class(
                    "text-bg pl-2 rounded-md sm:min-w-64 min-w-full",
                  ),
                  attribute.value(model.description),
                  event.on_input(UserUpdatedDescription),
                ]),
              ],
            ),
          ]),
        ]),
        html.div(
          [
            attribute.class(
              "sm:grow-0 sm:h-full grow flex items-center justify-center",
            ),
          ],
          [timer_button(model)],
        ),
      ],
    ),
  ])
}

fn timer_button(model: Model) {
  let start_button =
    html.button(
      [
        attribute.class(
          "rounded-full sm:h-4/5 h-32 aspect-square bg-green-500 hover:bg-green-600 duration-200 border-[3px] border-green-900 flex items-center justify-center",
        ),
        event.on_click(UserStartedTimer),
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

  let timer = time.from_seconds(model.current_time)

  let style = case timer {
    time.Time(0, 0, _) -> "text-3xl"
    time.Time(0, _, _) -> "text-2xl"
    time.Time(_, _, _) -> "text-xl"
  }

  let stop_button =
    html.button(
      [
        attribute.class(
          "rounded-full sm:h-4/5 h-32 aspect-square bg-red-500 hover:bg-red-600 duration-200 border-[3px] border-red-900 flex items-center justify-center",
        ),
        event.on_click(UserStoppedTimer),
      ],
      [
        html.div([attribute.class("text-white text-semibold " <> style)], [
          html.text(time.to_string(timer, True)),
        ]),
      ],
    )

  case model.active {
    True -> stop_button
    False -> start_button
  }
}
