-module(ska_group).

-export([update/1]).

-include_lib("logger/include/log.hrl").

update([IdBin, Args]) ->
  Id = binary_to_integer(IdBin),
  debug("updating ~w with ~w", [Id, Args]),
  ska:sql(update, {objects, groups, {Args, [{id, Id}]}}),
  true.
