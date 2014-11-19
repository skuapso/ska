-module(ska_object).

-export([model/0]).
-export([parse/1]).
-export([read/1]).

-include_lib("logger/include/log.hrl").

model() -> {objects, data}.

parse(Args) ->
  parse(Args, []).

parse([{Attr, Val} | Args], Parsed)
  when
    Attr =:= id;
    Attr =:= group_id;
    Attr =:= no;
    Attr =:= model_id;
    Attr =:= specialization_id;
    Attr =:= deleted
  ->
  parse(Args, [{Attr, Val} | Parsed]);
parse([_ | Args], Parsed) ->
  parse(Args, Parsed);
parse([], Parsed) ->
  Parsed.

read([ObjectId, <<"data">>, FromDateTime, ToDateTime]) ->
  DataJson = ska:sql(function, {object, data,
                                  [
                                   binary_to_integer(ObjectId),
                                   ska:to_datetime(FromDateTime),
                                   ska:to_datetime(ToDateTime)]}),
  debug("tracks: ~w", [DataJson]),
  ska:answer({array, DataJson});

read([ObjectId, <<"summory">>, FromDateTime, ToDateTime]) ->
  DataJson = ska:sql(function, {object, summory,
                                [
                                 binary_to_integer(ObjectId),
                                 ska:to_datetime(FromDateTime),
                                 ska:to_datetime(ToDateTime)]}),
  ska:answer({array, DataJson}).
