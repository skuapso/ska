-module(ska_group).

-export([model/0]).
-export([parse/1]).

-include_lib("logger/include/log.hrl").

model() -> {objects, groups}.

parse(Args) ->
  alert("returning same args"),
  Args.
