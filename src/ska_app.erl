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
        {env, [{dispatch, dispatch_rules()}]}
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
          {"/static/[...]", cowboy_static, {priv_dir, ska, "static",
                                [{mimetypes, cow_mimetypes, web}]
          }},
          {<<"/ws/[...]">>, bullet_handler, [{handler, ska_ws}]},
          {'_', ska_json, []}
          ]}]).
