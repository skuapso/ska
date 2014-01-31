-module(ska_rest).

-compile(export_all).

-record(state, {}).

-include_lib("logger/include/log.hrl").

init(_Type, _Req, _Opts) ->
  {upgrade, protocol, cowboy_rest}.

rest_init(Req, _Opts) ->
  {ok, Req, #state{}}.

content_types_provided(Req, State) ->
  {[{<<"application/json">>, json}], Req, State}.

charsets_provided(Req, State) ->
  {[<<"utf-8">>], Req, State}.

%languages_provided(Req, State) ->
%  {[<<"ru">>, <<"en">>], Req, State}.

json(Req, State) ->
  debug("request is ~w", [Req]),
  [Path] = cowboy_req:get([path], Req),
  debug("path is ~w", [Path]),
  Answer = json(Path, Req, State),
  debug("answer"),
  {Answer, Req, State}.

json(<<"/track/", _/binary>>, Req, _) ->
  trace("getting track"),
  error_logger:info_msg("req: ~p", [Req]),
  [Object] = cowboy_req:get([bindings], Req),
  debug("getting track for ~w", [Object]),
  sql(select, {ui, track, Object});
json(<<"/tracks">>, _, _) ->
  sql(select, {ui, tracks, []});
json(<<"/items">>, _, _) ->
  sql(select, {ui, items_tree, []});
json(Path, _, _) ->
  emerg("unknown path ~w", [Path]).


sql(Req, Data) ->
  [JSON] = psql:execute(Req, Data, infinity),
  proplists:get_value(json, JSON).
