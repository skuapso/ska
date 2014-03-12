-module(ska_json).

-export([init/3]).
-export([rest_init/2]).
-export([allowed_methods/2]).
-export([content_types_accepted/2]).
-export([content_types_provided/2]).
-export([charsets_provided/2]).

-export([parse/2]).
-export([route/3]).
-export([sql/2]).

-record(state, {}).

-include_lib("logger/include/log.hrl").

init(_Type, _Req, _Opts) ->
  {upgrade, protocol, cowboy_rest}.

rest_init(Req, _Opts) ->
  {ok, Req, #state{}}.

allowed_methods(Req, State) ->
  {[<<"GET">>, <<"HEAD">>, <<"OPTIONS">>, <<"POST">>], Req, State}.

content_types_accepted(Req, State) ->
  {[{{<<"application">>, <<"json">>, '*'}, parse}], Req, State}.

content_types_provided(Req, State) ->
  {[{<<"application/json">>, parse}], Req, State}.

charsets_provided(Req, State) ->
  {[<<"utf-8">>], Req, State}.

%languages_provided(Req, State) ->
%  {[<<"ru">>, <<"en">>], Req, State}.

parse(Req, State) ->
  debug("request is ~w", [Req]),
  [Path, MethodBin] = cowboy_req:get([path, method], Req),
  Method = method(MethodBin),
  [<<>>, Object | GetArgs] = re:split(Path, "/"),
  {Args, ReqN} = if
           Method =:= read -> {GetArgs, Req};
           true ->
             {ok, PostData, Req2} = cowboy_req:body(Req),
             debug("decoding ~w", [PostData]),
             DecodedData = decode(PostData),
             debug("decoded ~w", [DecodedData]),
             {GetArgs ++ [DecodedData], Req2}
         end,
  debug("path is ~w", [Args]),
  Answer = route(Object, Method, Args),
  {Answer, ReqN, State}.

sql(Req, Data) ->
  debug("query is ~w: ~w", [Req, Data]),
  case psql:execute(Req, Data, infinity) of
    [] -> [];
    [[{json, null}]] -> [];
    [[{json, Vals}]] -> Vals;
    Vals -> Vals
  end.

route(<<"items">>, read, []) ->
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

route(<<"object">>, Method, Args) ->
  ska_object:Method(Args);
route(<<"group">>, Method, Args) ->
  ska_group:Method(Args).

method(<<"GET">>) -> read;
method(<<"POST">>) -> update;
method(<<"HEAD">>) -> read;
method(M) -> err("unhandled method ~w", [M]), unhandled.

decode(Data) -> binary_to_term(typextfun:from_hex(Data), [safe]).
