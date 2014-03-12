-module(ska_ws).

-export([init/4]).
-export([stream/3]).
-export([info/3]).
-export([terminate/2]).

-include_lib("logger/include/log.hrl").

init(_Transport, Req, _Opts, _Active) ->
  trace("connected"),
  {ok, Req, undefined_state}.

stream(<<"ping">>, Req, State) ->
  {ok, Req, State}.

info(Info, Req, State) ->
  debug("info ~w", [Info]),
  {ok, Req, State}.

terminate(_Req, _State) ->
  trace("disconnected"),
  ok.
