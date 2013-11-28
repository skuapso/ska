-module(ska).

-compile(export_all).

init(Type, Req, Opts) ->
  lager:debug("transport is ~p", [Type]),
  lager:debug("request is ~p", [Req]),
  lager:debug("options is ~p", [Opts]),
  {ok, Req, []}.

handle(Req, State) ->
  lager:debug("request is ~p", [Req]),
  lager:debug("state is ~p", [State]),
  {ok, Req, State}.

terminate(Reason, Req, State) ->
  lager:debug("reason is ~p", [Reason]),
  lager:debug("request is ~p", [Req]),
  lager:debug("state is ~p", [State]),
  ok.
