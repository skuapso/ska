-module(ska_static).

-compile(export_all).

-include_lib("logger/include/log.hrl").

init(_Type, _Req, _Opts) ->
  '_debug'("upgrading"),
  {upgrade, protocol, cowboy_static}.

rest_init(Req, Opts) ->
  '_debug'("rest init"),
  {ok, Req, Opts}.

charsets_provided(Req, State) ->
  '_debug'("setting charsets"),
  {[<<"utf-8">>], Req, State}.
