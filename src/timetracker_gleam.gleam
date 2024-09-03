import components/basic
import data/global
import gleam/io
import gleam/list
import gleam/uri
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import modem
import pages/analytics
import pages/tracker
import pages/work_items
import router

/// The model for our app
/// 
pub type Model {
  Model(
    global: global.Model,
    tracker: tracker.Model,
    work_items: work_items.Model,
    analytics: analytics.Model,
  )
}

/// The messages that our app understands and with which it will update the model
/// 
pub type Msg {
  // Global messages
  OnRouteChange(router.Route)
  UpdatedWorkItems(work_items: List(global.WorkItem))
  AddRecord(rec: global.Record)

  // Messages stemming from specific pages
  FromTrackerPage(tracker.Msg)
  FromWorkItemPage(work_items.Msg)
  FromAnalyticsPage(analytics.Msg)
}

fn init(_flags) {
  let global_model = global.init()

  let model =
    Model(
      global: global_model,
      tracker: tracker.init(global_model),
      work_items: work_items.init(global_model),
      analytics: analytics.init(global_model),
    )

  let my_effect = effect.batch([modem.init(on_url_change)])

  #(model, my_effect)
}

/// How to deal with changes of urls
/// 
fn on_url_change(uri: uri.Uri) -> Msg {
  router.on_route_change(uri) |> OnRouteChange()
}

fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  let #(model, effect_) = case msg {
    OnRouteChange(route) -> #(
      Model(..model, global: global.Model(..model.global, current_route: route)),
      effect.none(),
    )
    FromAnalyticsPage(msg) -> {
      let #(m, e) = analytics.update(model.analytics, msg)
      #(Model(..model, analytics: m), effect.map(e, FromAnalyticsPage))
    }
    FromTrackerPage(msg) -> {
      let #(m, e) = tracker.update(model.tracker, msg)
      let e = effect.map(e, FromTrackerPage)
      let global_effect =
        effect.from(fn(dispatch) {
          case msg {
            tracker.AddRecord(rec) -> {
              dispatch(AddRecord(rec))
            }
            _ -> Nil
          }
          Nil
        })
      #(Model(..model, tracker: m), effect.batch([e, global_effect]))
    }

    FromWorkItemPage(msg) -> {
      let #(m, e) = work_items.update(model.work_items, msg)
      let e = effect.map(e, FromWorkItemPage)
      let global_effect = fn(dispatch) {
        case msg {
          work_items.UserAttemptedToAddNewItem(_, _)
          | work_items.UserDeletedWorkItem(_) -> {
            dispatch(UpdatedWorkItems(m.work_items))
          }
          _ -> Nil
        }
      }

      #(
        Model(..model, work_items: m),
        effect.batch([
          // First, we run the effect from the 
          e,
          // Then, on specific message, we update the global model with the new 
          // work items
          effect.from(global_effect),
        ]),
      )
    }

    UpdatedWorkItems(wis) -> {
      let global = global.Model(..model.global, work_items: wis)
      let tracker = tracker.Model(..model.tracker, work_items: wis)
      #(Model(..model, global: global, tracker: tracker), effect.none())
    }

    AddRecord(rec) -> {
      let recs = list.append(model.global.records, [rec])
      let global = global.Model(..model.global, records: recs)
      let analytics = analytics.Model(records: recs)
      #(
        Model(..model, global: global, analytics: analytics),
        effect.from(fn(_) { global.write_records_to_local_storage(recs) }),
      )
    }
  }

  #(model, effect_)
}

type NavItem {
  NavItem(url: String, title: String, route: router.Route)
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

fn view(model: Model) -> element.Element(Msg) {
  let nav_items = [
    NavItem(url: "/", title: "Tracker", route: router.Tracker),
    NavItem(url: "/work-items", title: "Work Items", route: router.WorkItems),
    NavItem(url: "/analytics", title: "Analytics", route: router.Analytics),
  ]

  let contents = case model.global.current_route {
    router.Tracker ->
      tracker.view(model.tracker) |> element.map(FromTrackerPage)
    router.Analytics ->
      analytics.view(model.analytics) |> element.map(FromAnalyticsPage)
    router.WorkItems ->
      work_items.view(model.work_items) |> element.map(FromWorkItemPage)
  }

  html.div(
    [
      attribute.class(
        "text-white container p-4 mx-auto max-w-5xl sm:mt-8 mt-4 flex flex-col gap-4",
      ),
    ],
    [
      basic.header(),
      basic.horizontal_bar(),
      nav_bar(nav_items),
      basic.horizontal_bar(),
      contents,
    ],
  )
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
