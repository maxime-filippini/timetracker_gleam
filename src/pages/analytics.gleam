import data/global
import gleam/list
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import time

pub type Model {
  Model(records: List(global.Record))
}

pub type Msg {
  Msg
}

pub fn init(global_model: global.Model) -> Model {
  Model(records: global_model.records)
}

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  #(model, effect.none())
}

pub fn view(model: Model) -> Element(Msg) {
  html.div([attribute.class("flex flex-col gap-8 mt-4")], [
    html.p([attribute.class("italic")], [
      html.text(
        "This is a work in progress. For now, this only shows the full list of records, but it will be more fleshed out at a later stage.",
      ),
    ]),
    analytics_table(model),
  ])
}

fn analytics_table(model: Model) {
  let headers =
    ["Work item ID", "Description", "Time"]
    |> list.map(fn(label) {
      html.th([attribute.class("w-1/3")], [html.text(label)])
    })

  let rows =
    model.records
    |> list.index_map(fn(rec, ix) {
      let tr_cls = case ix % 2 == 0 {
        True -> ""
        False -> "bg-surface-0"
      }

      html.tr([attribute.class(tr_cls)], [
        html.td([attribute.class("text-center")], [html.text(rec.work_item_id)]),
        html.td([attribute.class("text-center")], [html.text(rec.description)]),
        html.td([attribute.class("text-center")], [
          html.text(time.to_string(rec.time, False)),
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
