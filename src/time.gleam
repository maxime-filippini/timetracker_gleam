import gleam/int
import gleam/string
import lustre/element.{type Element}
import lustre/element/html

pub type Time {
  Time(hours: Int, minutes: Int, seconds: Int)
}

pub fn from_seconds(s: Int) -> Time {
  let seconds = s % 60
  let minutes = { s / 60 } % 60
  let hours = s / 60 / 60

  Time(hours:, minutes:, seconds:)
}

pub fn to_string(t: Time) -> String {
  let hours = case t.hours {
    0 -> ""
    h -> int.to_string(h) <> ":"
  }

  let minutes = case t.minutes, t.hours {
    0, 0 -> ""
    m, 0 -> int.to_string(m) <> ":"
    m, _ -> string.pad_left(int.to_string(m), to: 2, with: "0") <> ":"
  }

  let seconds = case t.seconds, t.minutes {
    s, 0 -> int.to_string(s)
    s, _ -> string.pad_left(int.to_string(s), to: 2, with: "0")
  }

  hours <> minutes <> seconds
}
