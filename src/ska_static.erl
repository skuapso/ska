-module(ska_static).

-compile(export_all).

init(_Type, _Req, _Opts) ->
  lager:debug("upgrading"),
  {upgrade, protocol, cowboy_static}.

rest_init(Req, Opts) ->
  lager:debug("rest init"),
  {ok, Req, Opts}.

charsets_provided(Req, State) ->
  lager:debug("setting charsets"),
  {[<<"utf-8">>], Req, State}.
