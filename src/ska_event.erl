%%%-------------------------------------------------------------------
%%% @author Ilya Ashchepkov
%%% @copyright 2014 NskAvd
%%% @doc
%%%
%%% @end
%%%-------------------------------------------------------------------

-module(ska_event).

-behaviour(gen_server).

%% API
-export([start_link/0]).
-export([notify/4]).
-export([notify/5]).
-export([subscribe/1]).
-export([unsubscribe/1]).

%% gen_server callbacks
-export([init/1]).
-export([handle_call/3]).
-export([handle_cast/2]).
-export([handle_info/2]).
-export([terminate/2]).
-export([code_change/3]).

-record(state, {}).

-include_lib("logger/include/log.hrl").

%%%===================================================================
%%% API
%%%===================================================================
notify(From, Object, Data, _Timeout) ->
  gen_server:cast(?MODULE, {event, From, Object, Data}).

notify(_From, Event, Who, Object, _Timeout) ->
  gen_server:cast(?MODULE, {Event, Who, Object}).

subscribe(Object) ->
  gen_server:cast(?MODULE, {subscribe, self(), Object}).

unsubscribe(Object) ->
  gen_server:cast(?MODULE, {unsubscribe, self(), Object}).
%%--------------------------------------------------------------------
%% @doc
%% Starts the server
%%
%% @spec start_link() -> {ok, Pid} | ignore | {error, Error}
%% @end
%%--------------------------------------------------------------------
start_link() ->
  gen_server:start_link({local, ?MODULE}, ?MODULE, [], []).

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
  ets:new(?MODULE, [named_table, ordered_set, protected]),
  hooks:install(ui, 10, fun ?MODULE:notify/4),
  hooks:install({ui, unsubscribe}, 10, fun ?MODULE:notify/5),
  process_flag(trap_exit, true),
  {ok, #state{}}.

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
handle_cast({event, _From, Object, _Data} = Event, State) ->
  debug("event ~w", [Event]),
  Subscribed = subscribed(Object),
  lists:map(fun(Pid) ->
                Pid ! Event
            end, Subscribed),
  {noreply, State};
handle_cast({subscribe, Pid, Object}, State) ->
  trace("subscribing ~w to ~w", [Pid, Object]),
  alert("should check permissions to view ~w", [Object]),
  link(Pid),
  Subscribed = subscribed(Object),
  ets:insert(?MODULE, {Object, [Pid | Subscribed]}),
  {noreply, State};
handle_cast({unsubscribe, Pid, all}, State) ->
  Objects = lists:flatten(ets:match(?MODULE, {'$1', '_'})),
  lists:map(fun(X) ->
                handle_cast({unsubscribe, Pid, X}, State)
            end, Objects),
  unlink(Pid),
  {noreply, State};
handle_cast({unsubscribe, Pid, Object}, State) when is_pid(Pid) ->
  trace("unsubscribing ~w from ~w", [Pid, Object]),
  Subscribed = subscribed(Object),
  debug("subscribed: ~w", [Subscribed]),
  ets:insert(?MODULE, {Object, lists:delete(Pid, Subscribed)}),
  debug("new subscribed ~w", [subscribed(Object)]),
  {noreply, State};
handle_cast({unsubscribe, {user, User}, Object}, State) ->
  trace("unsubscribing user ~w from ~w", [User, Object]),
  Pids = lists:flatten(ets:match(?MODULE, {{user, User}, '$2'})),
  [handle_cast({unsubscribe, Pid, Object}, State) || Pid <- Pids],
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
handle_info({'EXIT', Pid, _Reason}, State) ->
  debug("cleaning ~w", [Pid]),
  handle_cast({unsubscribe, Pid, all}, State);
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
  warning("terminating with reason ~w", [_Reason]),
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

subscribed(Object) ->
  lists:flatten(ets:match(?MODULE, {Object, '$1'})).

%% vim: ft=erlang
