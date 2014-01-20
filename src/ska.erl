-module(ska).

-compile(export_all).

-include_lib("logger/include/log.hrl").

start() ->
	application:start(ranch),
	application:start(cowlib),
	application:start(cowboy),
	application:start(ska).

init(Type, Req, Opts) ->
  debug("transport is ~p", [Type]),
  debug("request is ~p", [Req]),
  debug("options is ~p", [Opts]),
  {ok, Req, []}.

handle(Req, State) ->
  debug("request is ~p", [Req]),
  debug("state is ~p", [State]),
  {ok, Req, State}.

terminate(Reason, Req, State) ->
  debug("reason is ~p", [Reason]),
  debug("request is ~p", [Req]),
  debug("state is ~p", [State]),
  ok.
