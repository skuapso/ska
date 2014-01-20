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
  debug("request is ~p", [Req]),
  [Path] = cowboy_req:get([path], Req),
  debug("path is ~p", [Path]),
  Answer = json(Path),
  debug("answer is ~p", [Answer]),
  {Answer, Req, State}.

json(<<"/items">>) -> sql(select, {ui, items_tree, []}).

sql(Req, Data) ->
  [JSON] = psql:execute(Req, Data),
  proplists:get_value(json, JSON).
