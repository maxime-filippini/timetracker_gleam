import gleam/dynamic
import gleam/int
import gleam/io
import gleam/list
import gleam/result
import gleam/string
import lustre/element.{type Element}
import lustre/element/html

pub type Time {
  Time(hours: Int, minutes: Int, seconds: Int)
}

pub type Error {
  MalformedTimeString
}

pub fn from_seconds(s: Int) -> Time {
  let seconds = s % 60
  let minutes = { s / 60 } % 60
  let hours = s / 60 / 60

  Time(hours:, minutes:, seconds:)
}

pub fn to_string(t: Time, simple: Bool) -> String {
  let hours = case t.hours, simple {
    0, True -> ""
    h, _ -> int.to_string(h) <> ":"
  }

  let minutes = case t.minutes, t.hours, simple {
    0, 0, True -> ""
    m, 0, True -> int.to_string(m) <> ":"
    m, _, _ -> string.pad_left(int.to_string(m), to: 2, with: "0") <> ":"
  }

  let seconds = case t.seconds, t.minutes, simple {
    s, 0, True -> int.to_string(s)
    s, _, _ -> string.pad_left(int.to_string(s), to: 2, with: "0")
  }

  hours <> minutes <> seconds
}

pub fn from_string(s: String) -> Result(Time, Error) {
  let split = string.split(s, on: ":")

  let ints =
    split
    |> list.map(fn(x) {
      case int.parse(x) {
        Ok(v) -> Ok(v)
        Error(_) -> Error(MalformedTimeString)
      }
    })

  case ints {
    [Ok(hours), Ok(minutes), Ok(seconds)] ->
      Ok(Time(hours:, minutes:, seconds:))
    [Ok(minutes), Ok(seconds)] -> Ok(Time(hours: 0, minutes:, seconds:))
    [Ok(seconds)] -> Ok(Time(hours: 0, minutes: 0, seconds:))
    _ -> Error(MalformedTimeString)
  }
}

pub fn decoder(v: dynamic.Dynamic) -> Result(Time, List(dynamic.DecodeError)) {
  use string <- result.try(dynamic.string(v))

  case string.split(string, on: ":") {
    [hours, minutes, seconds] -> {
      use hours <- result.try(int.parse(hours))
      use minutes <- result.try(int.parse(minutes))
      use seconds <- result.try(int.parse(seconds))
      Ok(Time(hours:, minutes:, seconds:))
    }
    [minutes, seconds] -> {
      use minutes <- result.try(int.parse(minutes))
      use seconds <- result.try(int.parse(seconds))
      Ok(Time(hours: 0, minutes:, seconds:))
    }
    [seconds] -> {
      use seconds <- result.try(int.parse(seconds))
      Ok(Time(hours: 0, minutes: 0, seconds:))
    }
    _ -> Error(Nil)
  }
  |> result.replace_error([
    dynamic.DecodeError(expected: "A time", found: "", path: []),
  ])
}
