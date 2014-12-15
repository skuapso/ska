-module(ska_owner).

-export([model/0]).
-export([parse/1]).

-include_lib("logger/include/log.hrl").

model() -> {owners, data}.

parse(Args) ->
  '_alert'("returning same args"),
  Args.
