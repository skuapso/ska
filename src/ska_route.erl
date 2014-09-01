-module(ska_route).

-export([init/3]).
-export([rest_init/2]).
-export([allowed_methods/2]).
-export([content_types_accepted/2]).
-export([content_types_provided/2]).
-export([charsets_provided/2]).

-export([parse/2]).
-export([route/3]).

-record(state, {}).

-include_lib("logger/include/log.hrl").

init(_Type, _Req, _Opts) ->
  {upgrade, protocol, cowboy_rest}.

rest_init(Req, _Opts) ->
  {ok, Req, #state{}}.

allowed_methods(Req, State) ->
  {[<<"GET">>, <<"HEAD">>, <<"OPTIONS">>, <<"PATCH">>, <<"PUT">>], Req, State}.

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
  [<<>>, Target | GetArgs] = re:split(cowboy_http:urldecode(Path), "/"),
  Method = method(MethodBin),
  TargetModule = target(Target),
  {Args, ReqN} = if
           Method =:= read -> {GetArgs, Req};
           true ->
             {ok, PostData, Req2} = cowboy_req:body(Req),
             debug("decoding ~w", [PostData]),
             DecodedData = ska:decode(PostData),
             debug("decoded ~w", [DecodedData]),
             {GetArgs ++ DecodedData, Req2}
         end,
  debug("path is ~w", [Args]),
  Answer = route(TargetModule, Method, Args),
  {Answer, ReqN, State}.

route(?MODULE, read, []) ->
  ska:answer({array, ska:sql(function, {ui, items, []})});

route(_, update, [_]) -> true;
route(Target, update, [IdBin | Args]) ->
  {Schema, Table} = Target:model(),
  Id = binary_to_integer(IdBin),
  ParsedArgs = Target:parse(Args),
  debug("updating ~w: ~w", [{Schema, Table, Id}, ParsedArgs]),
  {ok, Id} =:= ska:sql(update, {Schema, Table, {ParsedArgs, [{id, Id}]}});
route(Target, create, Args) ->
  {Schema, Table} = Target:model(),
  ParsedArgs = Target:parse(Args),
  debug("creating ~w: ~w", [{Schema, Table}, ParsedArgs]),
  case ska:sql(insert, {Schema, Table, ParsedArgs}) of
    {ok, _} -> true;
    _       -> false
  end;
route(Target, Method, Args) ->
  Target:Method(Args).

method(<<"GET">>)   -> read;
method(<<"POST">>)  -> update;
method(<<"PATCH">>) -> update;
method(<<"HEAD">>)  -> read;
method(<<"PUT">>)   -> create;
method(M) -> err("unhandled method ~w", [M]), unhandled.

target(<<"items">>) -> ?MODULE;
target(<<"object">>) -> ska_object;
target(<<"group">>) -> ska_group;
target(<<"terminal">>) -> ska_terminal.
