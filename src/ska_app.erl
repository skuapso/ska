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
          {<<"/">>,
           cowboy_static, [
              {directory, {priv_dir, ska, [<<"static">>]}},
              {file, <<"index.html">>},
              {charset, <<"utf-8">>},
              {mimetypes, {fun mimetypes:path_to_mimes/2, default}}
          ]},
          {<<"/favicon.ico">>,
           cowboy_static, [
              {directory, {priv_dir, ska, [<<"static">>]}},
              {file, <<"favicon.ico">>},
              {mimetypes, {fun mimetypes:path_to_mimes/2, default}}
          ]},
          {<<"/static/[...]">>,
           cowboy_static, [
              {directory, {priv_dir, ska, [<<"static">>]}},
              {charset, <<"utf-8">>},
              {mimetypes, {fun mimetypes:path_to_mimes/2, default}}
          ]},
          {<<"/ws/[...]">>, bullet_handler, [{handler, ska_ws}]},
%          {<<"/:v1[/:v2[/:v3[/:v4]]]">>, ska_rest, []},
          {<<"/track/:object_id">>, ska_rest, []},
          {'_', ska_rest, []}
          ]}]).
