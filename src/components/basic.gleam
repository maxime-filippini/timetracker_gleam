import lustre/attribute
import lustre/element
import lustre/element/html

pub fn horizontal_bar() {
  html.div([attribute.class("border-b-2 border-b-surface-0")], [])
}

pub fn header() {
  html.div([], [
    html.h1([attribute.class("text-3xl")], [element.text("Time tracker")]),
    html.p([], [
      element.text("A small app to track your time spent on work items."),
    ]),
  ])
}
