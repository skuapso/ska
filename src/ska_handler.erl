-module(ska_handler).

-export([execute/2]).
-export([run_cowboy_handler/3]).

-include_lib("logger/include/log.hrl").

execute(Req, State) ->
  debug("req: ~w", [Req]),
  debug("state: ~w", [State]),
  Socket = element(2, Req),
  CHPid = spawn_link(?MODULE, run_cowboy_handler, [self(), Req, State]),
  gen_tcp:controlling_process(Socket, CHPid),
  CHPid ! execute,
  Mref = erlang:monitor(process, CHPid),
  receive
    {CHPid, Reply} ->
      erlang:demonitor(Mref),
      Reply;
    {'DOWN', Mref, process, CHPid, _Reason} ->
      {error, 500, Req}
  end.

run_cowboy_handler(From, Req, State) ->
  Socket = element(2, Req),
  {ok, Req1, State1} = ska_auth:execute(Req, State),
  Reply = receive
            execute ->
              Reply1 = cowboy_handler:execute(Req1, State1),
              gen_tcp:controlling_process(Socket, From),
              Reply1
          end,
  From ! {self(), Reply}.
