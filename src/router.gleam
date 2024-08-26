import gleam/uri.{type Uri}

pub type Route {
  Tracker
  WorkItems
  Analytics
}

/// Routing
/// 
pub fn on_route_change(uri: Uri) -> Route {
  case uri.path_segments(uri.path) {
    ["work-items"] -> WorkItems
    ["analytics"] -> Analytics
    _ -> Tracker
  }
}

pub fn init() -> Route {
  Tracker
}
