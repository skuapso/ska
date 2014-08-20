-module(ska).

-export([start/0]).
-export([init/3]).
-export([handle/2]).
-export([terminate/3]).
-export([to_atom/1]).
-export([to_date/1]).
-export([to_time/1]).
-export([to_datetime/1]).
-export([sql/2]).
-export([decode/1]).

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

to_atom(<<"badarg">>) -> {ok, badarg};
to_atom(Str) when is_binary(Str) ->
  case binary_to_existing_atom(Str, latin1) of
    badarg -> {error, badarg};
    Result -> {ok, Result}
  end.

to_datetime(DateTime) when is_binary(DateTime) ->
  [Date, Time] = re:split(DateTime, " "),
  {to_date(Date), to_time(Time)}.

to_date(Date) when is_binary(Date) ->
  [Y, M, D] = re:split(Date, "-"),
  {binary_to_integer(Y), binary_to_integer(M), binary_to_integer(D)}.

to_time(Time) when is_binary(Time) ->
  [H, M, SBin] = case re:split(Time, ":") of
                [HH] -> [HH, <<"0">>, <<"0.0">>];
                [HH, MM] -> [HH, MM, <<"0.0">>];
                [_, _, _] = V -> V
              end,
  S = case catch binary_to_float(SBin) of
        {'EXIT', {badarg, []}} ->
          binary_to_integer(SBin);
        F when is_float(F) -> F
      end,
  {binary_to_integer(H), binary_to_integer(M), S}.

sql(Req, Data) ->
  debug("getting ~w", [{Req, Data}]),
  case ska_session:get({psql, {Req, Data}}, infinity) of
    [] -> [];
    [[{json, null}]] -> [];
    [[{json, Vals}]] -> Vals;
    Vals -> Vals
  end.

decode(Data) ->
  Opts = case application:get_env(ska, safe_decode) of
           {ok, false}-> [];
           _          -> [safe]
         end,
  decode(Data, Opts).

decode(Data, Opts) when Opts =/= [safe] ->
  alert("should be safe"),
  decode1(binary_to_term(typextfun:from_hex(Data), Opts));
decode(Data, Opts) ->
  decode1(binary_to_term(typextfun:from_hex(Data), Opts)).

decode1(null) -> [];
decode1(L) when is_list(L) -> L.
