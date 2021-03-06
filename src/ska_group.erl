-module(ska_group).

-export([model/0]).
-export([parse/1]).

-include_lib("logger/include/log.hrl").

model() -> {objects, groups}.

parse(Args) ->
  parse(Args, []).

parse([{Attr, Val} | Args], Parsed)
  when
    Attr =:= id;
    Attr =:= title;
    Attr =:= parent_id;
    Attr =:= deleted
  ->
  parse(Args, [{Attr, Val} | Parsed]);
parse([_ | Args], Parsed) ->
  parse(Args, Parsed);
parse([], Parsed) ->
  Parsed.
