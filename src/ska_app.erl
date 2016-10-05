-module(ska_app).

-behaviour(application).

%% Application callbacks
-export([start/2, stop/1]).

%% ===================================================================
%% Application callbacks
%% ===================================================================

start(_StartType, StartArgs) ->
  Port = misc:get_env(ska, port, StartArgs),
  {ok, _} = cowboy:start_http(http, 1,
                              [{port, Port}],
                              [
        {env, [{dispatch, dispatch_rules()}]},
        {middlewares, [cowboy_router, ska_auth, ska_handler]}
  ]),
  ska_sup:start_link().

stop(_State) ->
    ok.

dispatch_rules() ->
  cowboy_router:compile(
    [{'_', [
            {"/", cowboy_static, {priv_file, ska, "static/index.html",
                                  [{mimetypes, cow_mimetypes, web}]
                                 }},
            {"/favicon.ico", cowboy_static, {priv_file, ska, "static/favicon.ico",
                                             [{mimetypes, cow_mimetypes, web}]
                                            }},
            {"/bullet.js", cowboy_static, {priv_file, bullet, "bullet.js",
                                           [{mimetypes, cow_mimetypes, web}]
                                          }},
            {"/libs.js", whiskey_cola, [{priv_files, ska, "static/js/lib",
                                         [
                                          "evispa-timo-jsclipper/clipper.js",
                                          "concavehull/dist/concavehull.js",
                                          "jquery/dist/jquery.js",
                                          "jQuery-contextMenu/src/jquery.contextMenu.js",
                                          "jQuery-contextMenu/src/jquery.ui.position.js",
                                          "angular/angular.js",
                                          "angular-bootstrap/ui-bootstrap-tpls.js",
                                          "bert.js/bert.js",
                                          "leaflet/dist/leaflet-src.js",
                                          "leaflet-plugins/layer/tile/Google.js",
                                          "leaflet-plugins/layer/tile/Yandex.js",
                                          "leaflet-2gis/dgis.js",
                                          "leaflet.freedraw/dist/leaflet.freedraw-src.js"
                                         ]}]},
            {"/skuapso.js", whiskey_cola, [{priv_files, ska, "static/js",
                                            [
                                             "out.js"
                                             ,"isolated-scope.js"
                                             ,"skuapso.js"
                                             ,"init.js"
                                             ,"http.js"
                                             ,"bullet.js"
                                             ,"tree.js"
                                             ,"map.js"
                                             ,"test.js"
                                             ,"object.js"
                                             ,"group.js"
                                             ,"object-model.js"
                                             ,"object-sensor.js"
                                             ,"tool.js"
                                             ,"specialization.js"
                                             ,"terminal.js"
                                             ,"terminal-model.js"
                                             ,"sensor.js"
                                             ,"geo.js"
                                             ,"locale.js"
                                            ]}
                                          ]},
            {"/ng-tpl.js", whiskey_cola, [{priv_dir, ska, "static/tpl/skuapso"},
                                       {suffix, ".tpl.html"},
                                       {preadd, {ska_ng_tpl, to_js}}]},
            {"/static/[...]", cowboy_static, {priv_dir, ska, "static",
                                              [{mimetypes, cow_mimetypes, web}]
                                             }},
            {<<"/ws/[...]">>, bullet_handler, [{handler, ska_ws}]},
            {'_', ska_route, []}
           ]}]).
