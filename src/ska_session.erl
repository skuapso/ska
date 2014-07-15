%%%-------------------------------------------------------------------
%%% @author Ilya Ashchepkov
%%% @copyright 2014 NskAvd
%%% @doc
%%%
%%% @end
%%%-------------------------------------------------------------------
-module(ska_session).

-behaviour(gen_server).

%% API
-export([start_link/0]).
-export([link/1]).
-export([get/2]).
-export([get_user/0]).
-export([set_cookie/2]).
-export([delete_cookie/1]).

-export([ets/0]).

%% gen_server callbacks
-export([init/1]).
-export([handle_call/3]).
-export([handle_cast/2]).
-export([handle_info/2]).
-export([terminate/2]).
-export([code_change/3]).

-record(state, {
          host,
          port,
          database,
          ssl,
          ssl_opts,
          timeout = 5000,
          max_connections = 5,
          queue_size = 15
         }).

-include_lib("logger/include/log.hrl").

-define(InvalidPass, {{{badmatch,{error,invalid_password}},_L},_L1}).

%-define(link(X), erlang:monitor(process, X)).
-define(link(X), erlang:link(X)).
%%%===================================================================
%%% API
%%%===================================================================

%%--------------------------------------------------------------------
%% @doc
%% Starts the server
%%
%% @spec start_link() -> {ok, Pid} | ignore | {error, Error}
%% @end
%%--------------------------------------------------------------------
start_link() ->
  gen_server:start_link({local, ?MODULE}, ?MODULE, [], []).

link(Pid) when is_pid(Pid) ->
  gen_server:call(?MODULE, {link, self(), Pid});
link(Auth) ->
  gen_server:call(?MODULE, {link, self(), Auth}).

get({psql, Request}, Timeout) ->
  [[Auth]] = ets:match(?MODULE, {{worker, self()}, '$1'}),
  [[PoolPid]] = ets:match(?MODULE, {{pool, Auth}, '$1'}),
  psql_pool:request(PoolPid, Request, Timeout).

get_user() ->
  debug("ets: ~w",[ets:match(?MODULE, '$1')]),
  [[{<<"basic">>, {User, _}}]] = ets:match(?MODULE, {{worker, self()}, '$1'}),
  {ok, User}.

set_cookie(Auth, _Cookie) when element(1, Auth) =:= cookie -> ok;
set_cookie(Auth, Cookie) ->
  gen_server:cast(?MODULE, {set_cookie, Auth, Cookie}).

delete_cookie(Cookie) ->
  gen_server:cast(?MODULE, {delete_cookie, Cookie}).

ets() ->
  ets:match(?MODULE, '$1').
%%%===================================================================
%%% gen_server callbacks
%%%===================================================================

%%--------------------------------------------------------------------
%% @private
%% @doc
%% Initializes the server
%%
%% @spec init(Args) -> {ok, State} |
%%                     {ok, State, Timeout} |
%%                     ignore |
%%                     {stop, Reason}
%% @end
%%--------------------------------------------------------------------
init([]) ->
  trace("init"),
  process_flag(trap_exit, true),
  Opts = application:get_all_env(psql),
  debug("parsing options ~w", [Opts]),
  Host = proplists:get_value(host, Opts),
  Port = proplists:get_value(port, Opts),
  DB = proplists:get_value(database, Opts),
  SSL = proplists:get_value(ssl, Opts),
  SSLOpts = proplists:get_value(ssl_options, Opts),
  Timeout = proplists:get_value(timeout, Opts, 5000),
  MaxConnections = proplists:get_value(max_connections, Opts, 5),
  QueueSize = proplists:get_value(queue_size, Opts, 15),
  ets:new(?MODULE, [named_table, protected, ordered_set]),
  {ok, #state{
          host = Host,
          port = Port,
          database = DB,
          ssl = SSL,
          ssl_opts = SSLOpts,
          timeout = Timeout,
          max_connections = MaxConnections,
          queue_size = QueueSize
         }}.

%%--------------------------------------------------------------------
%% @private
%% @doc
%% Handling call messages
%%
%% @spec handle_call(Request, From, State) ->
%%                                   {reply, Reply, State} |
%%                                   {reply, Reply, State, Timeout} |
%%                                   {noreply, State} |
%%                                   {noreply, State, Timeout} |
%%                                   {stop, Reason, Reply, State} |
%%                                   {stop, Reason, State}
%% @end
%%--------------------------------------------------------------------
handle_call({link, ParentPid, Pid}, _From, State) when is_pid(Pid) ->
  erlang:monitor(process, Pid),
  Reply = case ets:match(?MODULE, {{worker, ParentPid}, '$1'}) of
            [[Auth]] ->
              debug("linking ~w to ~w", [Pid, Auth]),
              ets:insert(?MODULE, {{worker, Pid}, Auth}),
              ok;
            Else ->
              alert("linking pid ~w to ~w: wrong ets:match ~w", [Pid, ParentPid, Else]),
              failed
          end,
  {reply, Reply, State};
handle_call({link, Pid, {cookie, Cookie}}, From, State) ->
  case lists:flatten(ets:match(?MODULE, {{cookie, '$1'}, Cookie})) of
    [] -> {reply, {error, not_related_cookie}, State};
    [Auth] -> handle_call({link, Pid, Auth}, From, State)
  end;
handle_call({link, Pid, Auth}, _From, State) ->
  Reply = case lists:flatten(ets:match(?MODULE, {{pool, Auth}, '$1'})) of
            [] ->
              trace("starting new user pool"),
              case new_pool(Auth, State) of
                {ok, PoolPid} ->
                  debug("linking ~w to ~w", [Pid, Auth]),
                  erlang:monitor(process, Pid),
                  ets:insert(?MODULE, {{pool, Auth}, PoolPid}),
                  ets:insert(?MODULE, {{worker, Pid}, Auth}),
                  ok;
                Else ->
                  Else
              end;
            [_PoolPid] ->
              trace("found pool"),
              debug("linking ~w to ~w", [Pid, Auth]),
              ?link(Pid),
              ets:insert(?MODULE, {{worker, Pid}, Auth}),
              ok
          end,
  trace("reply is ~w", [Reply]),
  {reply, Reply, State};

handle_call(_Request, _From, State) ->
  warning("unhandled call ~w from ~w", [_Request, _From]),
  {noreply, State}.

%%--------------------------------------------------------------------
%% @private
%% @doc
%% Handling cast messages
%%
%% @spec handle_cast(Msg, State) -> {noreply, State} |
%%                                  {noreply, State, Timeout} |
%%                                  {stop, Reason, State}
%% @end
%%--------------------------------------------------------------------
handle_cast({set_cookie, Auth, Cookie}, State) ->
  ets:insert(?MODULE, {{cookie, Auth}, Cookie}),
  {noreply, State};
handle_cast({delete_cookie, Cookie}, State) ->
  Auth = lists:flatten(ets:match(?MODULE, {{cookie, '$1'}, Cookie})),
  [ets:delete(?MODULE, {cookie, X}) || X <- Auth],
  {noreply, State};
handle_cast(_Msg, State) ->
  warning("unhandled cast ~w", [_Msg]),
  {noreply, State}.

%%--------------------------------------------------------------------
%% @private
%% @doc
%% Handling all non call/cast messages
%%
%% @spec handle_info(Info, State) -> {noreply, State} |
%%                                   {noreply, State, Timeout} |
%%                                   {stop, Reason, State}
%% @end
%%--------------------------------------------------------------------
handle_info({'DOWN', _, process, Pid, Reason}, State) ->
  handle_info({'EXIT', Pid, Reason}, State);
handle_info({'EXIT', Pid, _}, State) ->
  trace("died ~w", [Pid]),
  case lists:flatten(ets:match(?MODULE, {{worker, Pid}, '$1'})) of
    [_Auth | Else] = Auths ->
      emerg(Else =/= [], "worker registered to several auths: ~w", [Auths]),
      debug("unregistering worker ~w", [Pid]),
      ets:delete(?MODULE, {worker, Pid});
    [] ->
      case lists:flatten(ets:match(?MODULE, {'$1', {pool, Pid}})) of
        [] -> ok;
        [{auth, _Auth} | Rest] = Keys ->
          emerg(Keys =/= [], "pool ~w unexpected tail ~w", [Pid, Rest]),
          debug("unregistering pool ~w", [Pid]),
          [ets:delete(?MODULE, X) || X <- Keys];
        Else ->
          emerg("unexpected answer while deleting pool ~w: ~w", [Pid, Else])
      end
  end,
  {noreply, State};
handle_info(_Info, State) ->
  warning("unhandled info msg ~w", [_Info]),
  {noreply, State}.

%%--------------------------------------------------------------------
%% @private
%% @doc
%% This function is called by a gen_server when it is about to
%% terminate. It should be the opposite of Module:init/1 and do any
%% necessary cleaning up. When it returns, the gen_server terminates
%% with Reason. The return value is ignored.
%%
%% @spec terminate(Reason, State) -> void()
%% @end
%%--------------------------------------------------------------------
terminate(_Reason, _State) ->
  warning("terminating with reason ~w, ets: ~w", [_Reason, ets:match(?MODULE, '$1')]),
  ok.

%%--------------------------------------------------------------------
%% @private
%% @doc
%% Convert process state when code is changed
%%
%% @spec code_change(OldVsn, State, Extra) -> {ok, NewState}
%% @end
%%--------------------------------------------------------------------
code_change(_OldVsn, State, _Extra) ->
  notice("code change from ~w with extra ~w", [_OldVsn, _Extra]),
  {ok, State}.

%%%===================================================================
%%% Internal functions
%%%===================================================================

new_pool({<<"basic">>, {UserName, Password}},
         #state{
            host = Host,
            port = Port,
            database = DB,
            ssl = SSL,
            ssl_opts = SSLOpts,
            timeout = Timeout,
            max_connections = MaxConnections,
            queue_size = QueueSize
           }) ->
  case psql_pool:start_link([Host, Port, UserName, Password, DB, SSL, SSLOpts, Timeout, []],
                      MaxConnections,
                      QueueSize) of
    {ok, Pid} when is_pid(Pid) ->
      trace("new pool is ~w", [Pid]),
      check_authorization(Pid, Timeout);
    Else ->
      emerg("user psql pool not started: ~w", [Else]),
      {error, Else}
  end.

check_authorization(Pid, Timeout) ->
  Mref = erlang:monitor(process, Pid),
  Pid ! {'$gen_call', {self(), Mref}, {request, -1, {execute, {"select 1 as id", []}}}},
  Reply = receive
            {'EXIT', Pid, ?InvalidPass} ->
              {error, invalid_password};
            {'DOWN', Mref, process, Pid, ?InvalidPass} ->
              {error, invalid_password};
            {Mref, [[{id, 1}]]} ->
              {ok, Pid};
            {'DOWN', Mref, process, _, timeout} ->
              {error, timeout}
          after (Timeout * 2) ->
                  emerg("no answer for 2xTimeouts: ~w", [Timeout * 2]),
                  {error, timeout}
          end,
  erlang:demonitor(Mref),
  receive
    {'EXIT', Pid, _} -> ok;
    {'DOWN', Mref, process, Pid, _} -> ok
  after 0 -> ok
  end,
  Reply.

%% vim: ft=erlang
