import lustre
import lustre/attribute
import lustre/element
import lustre/element/html

pub fn main() {
  let app =
    lustre.element(
      html.div([], [
        html.h1([], [element.text("Hello, world!")]),
        html.figure([], [
          html.img([attribute.src("https://cataas.com/cat")]),
          html.figcaption([], [element.text("A cat!")]),
        ]),
      ]),
    )
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}
