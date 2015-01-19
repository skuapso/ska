-module(ska_app).

-behaviour(application).

%% Application callbacks
-export([start/2, stop/1]).

%% ===================================================================
%% Application callbacks
%% ===================================================================

start(_StartType, _StartArgs) ->
  {ok, _} = cowboy:start_http(http, 1,
                              [{port, 8000}],
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
            {"/skuapso.js", ska_union, [{priv_dir, ska, "static/js"},
                                        {suffix, ".js"},
                                        {depth, 0}]},
            {"/ng-tpl.js", ska_union, [{priv_dir, ska, "static/tpl/skuapso"},
                                       {suffix, ".tpl.html"},
                                       {preadd, {ska_ng_tpl, to_js}}]},
            {"/static/[...]", cowboy_static, {priv_dir, ska, "static",
                                              [{mimetypes, cow_mimetypes, web}]
                                             }},
            {<<"/ws/[...]">>, bullet_handler, [{handler, ska_ws}]},
            {'_', ska_route, []}
           ]}]).
