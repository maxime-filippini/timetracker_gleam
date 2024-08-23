import gleam/int
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event

pub type Model =
  Int

pub type Msg {
  Increment
  Decrement
  Reset
}

/// This initializes the model
/// 
fn init(_flags) -> Model {
  0
}

/// This updates the model based on a received message
/// 
pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Increment -> model + 1
    Decrement -> model - 1
    Reset -> 0
  }
}

/// Static component
/// 
fn header() {
  html.div([], [
    html.h1([attribute.class("text-3xl")], [element.text("Time tracker")]),
  ])
}

/// This is the UI of our app
/// 
pub fn view(model: Model) -> element.Element(Msg) {
  let count = int.to_string(model)

  html.div(
    [
      attribute.class(
        "text-white container mx-auto max-w-5xl mt-8 flex flex-col gap-4",
      ),
    ],
    [
      header(),
      html.div([attribute.class("flex gap-4")], [
        html.button([event.on_click(Increment)], [element.text("+")]),
        element.text(count),
        html.button([event.on_click(Decrement)], [element.text("-")]),
      ]),
      html.div([attribute.class("w-full")], [
        html.button([event.on_click(Reset)], [element.text("Reset")]),
      ]),
    ],
  )
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}
