-module(ska_ws).

-export([init/4]).
-export([stream/3]).
-export([info/3]).
-export([terminate/2]).

-include_lib("logger/include/log.hrl").

init(_Transport, Req, _Opts, _Active) ->
  trace("connected"),
  {Req1, User} = case cowboy_req:parse_header(<<"authorization">>, Req) of
                   {ok, {<<"basic">>, {U, _Pass}}, R} -> {R, U}
                 end,
  ska_event:subscribe({user, User}),
  {ok, Req1, undefined_state}.

stream(<<"ping">>, Req, State) ->
  {ok, Req, State};
stream(Data, Req, State) ->
  debug("stream ~w", [ska:decode(Data)]),
  [{Event, [Object]}] = ska:decode(Data),
  ska_event:Event(Object),
  {ok, Req, State}.

info({event, _From, _Object, Data}, Req, State) ->
  trace("sending event ~w", [Data]),
  {reply, Data, Req, State};
info(Info, Req, State) ->
  alert("unhandled info ~w", [Info]),
  {ok, Req, State}.

terminate(_Req, _State) ->
  trace("disconnected"),
  ok.
