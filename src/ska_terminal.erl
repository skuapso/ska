-module(ska_terminal).

-export([model/0]).
-export([parse/1]).
-export([read/1]).

model() -> {terminals, data}.

parse(Args) ->
  parse(Args, []).

parse([{Attr, Val} | Args], Parsed)
  when
    Attr =:= id;
    Attr =:= uin;
    Attr =:= serial_no;
    Attr =:= period;
    Attr =:= model_id;
    Attr =:= deleted
  ->
  parse(Args, [{Attr, Val} | Parsed]);
parse([_ | Args], Parsed) ->
  parse(Args, Parsed);
parse([], Parsed) ->
  Parsed.

read([IdBin]) ->
  Id = binary_to_integer(IdBin),
  ska:sql(select, {terminals, data, [{id, Id}], [json]}).
