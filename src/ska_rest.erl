-module(ska_rest).

-export([init/3]).
-export([rest_init/2]).
-export([content_types_provided/2]).
-export([charsets_provided/2]).

-export([json_prepare/2]).
-export([json/2]).
-export([sql/2]).

-record(state, {}).

-include_lib("logger/include/log.hrl").

init(_Type, _Req, _Opts) ->
  {upgrade, protocol, cowboy_rest}.

rest_init(Req, _Opts) ->
  {ok, Req, #state{}}.

content_types_provided(Req, State) ->
  {[{<<"application/json">>, json_prepare}], Req, State}.

charsets_provided(Req, State) ->
  {[<<"utf-8">>], Req, State}.

%languages_provided(Req, State) ->
%  {[<<"ru">>, <<"en">>], Req, State}.

json_prepare(Req, State) ->
  debug("request is ~w", [Req]),
  [Path] = cowboy_req:get([path], Req),
  PathPretty = pretty_uri(Path),
  [<<>>, Object | Args] = re:split(PathPretty, "/"),
  debug("path is ~w", [Args]),
  Answer = erlang:apply(?MODULE, json, [Object, Args]),
  debug("answer"),
  {Answer, Req, State}.

sql(Req, Data) ->
  debug("query is ~w: ~w", [Req, Data]),
  case psql:execute(Req, Data, infinity) of
    [] -> [];
    [[{json, null}]] -> [];
    [[{json, Vals}]] -> Vals;
    Vals -> Vals
  end.

json(<<"items">>, []) ->
  Query =
    "select array_to_json(array_agg(row_to_json)) as json from("
      "select row_to_json(owners) from ("
        "select *,'owner' as \"type\" from owners.data"
      ") owners"
      " union all select row_to_json(groups) from ("
        "select *,'group' as \"type\" from groups.tree"
      ") groups"
      " union all select row_to_json(objects) from ("
        "select *,'object' as \"type\" from objects.data"
      ") objects"
      " union all select row_to_json(objects_models) from ("
        "select *,'object_model' as \"type\" from objects.models"
      ") objects_models"
      " union all select row_to_json(objects_specializations) from ("
        "select *,'specialization' as \"type\" from objects.specializations"
      ") objects_specializations"
    ") S",
  sql(execute, {Query, []});

json(<<"object">>, Args) ->
  ska_object:json(Args).

pretty_uri(Path) -> pretty_uri(<<>>, Path).
pretty_uri(Result, <<$%, A, B, Rest/binary>>) when A >= $0, A =< $F, B >= $0, B =< $F ->
  Symbol = typextfun:from_hex(<<A, B>>),
  pretty_uri(<<Result/binary, Symbol/binary>>, Rest);
pretty_uri(Result, <<S, Rest/binary>>) ->
  pretty_uri(<<Result/binary, S>>, Rest);
pretty_uri(Result, <<>>) -> Result.
