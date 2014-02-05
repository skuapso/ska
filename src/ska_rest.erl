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
  PathPretty = pretty_uri(Path),
  [<<>> | Args] = re:split(PathPretty, "/"),
  debug("path is ~w", [Args]),
  Answer = erlang:apply(?MODULE, json, Args),
  debug("answer"),
  {Answer, Req, State}.

json(<<"items">>) ->
  sql(select, {ui, items_tree, []}).

sql(Req, Data) ->
  case psql:execute(Req, Data, infinity) of
    [] -> <<>>;
    [[{json, Vals}]] -> Vals
  end.

json(<<"object">>, Id, <<"track">>, FromDateTime, ToDateTime) ->
  Query = "select st_asGeoJSON(s1.track) as json "
            "from ("
              "select S.object_id,st_makeline(s.location) as track "
              "from ("
                "select object_id,location::geometry "
                "from events.data "
                "where valid and location is not null "
                "and object_id=$1 and time>=($2::timestamptz) and time<=($3::timestamptz) "
                "order by object_id,time desc"
              ") s group by object_id"
            ") s1",
  sql(execute, {Query, [
                        binary_to_integer(Id),
                        ska:to_datetime(FromDateTime),
                        ska:to_datetime(ToDateTime)]}).

pretty_uri(Path) -> pretty_uri(<<>>, Path).
pretty_uri(Result, <<$%, A, B, Rest/binary>>) when A >= $0, A =< $F, B >= $0, B =< $F ->
  Symbol = typextfun:from_hex(<<A, B>>),
  pretty_uri(<<Result/binary, Symbol/binary>>, Rest);
pretty_uri(Result, <<S, Rest/binary>>) ->
  pretty_uri(<<Result/binary, S>>, Rest);
pretty_uri(Result, <<>>) -> Result.
