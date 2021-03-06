-module(ska_sup).

-behaviour(supervisor).

%% API
-export([start_link/0]).

%% Supervisor callbacks
-export([init/1]).

%% Helper macro for declaring children of supervisor
-define(CHILD(I, Type), {I, {I, start_link, []}, permanent, 5000, Type, [I]}).

%% ===================================================================
%% API functions
%% ===================================================================

start_link() ->
    supervisor:start_link({local, ?MODULE}, ?MODULE, []).

%% ===================================================================
%% Supervisor callbacks
%% ===================================================================

init([]) ->
  Event = {ska_event
          ,{ska_event, start_link, []}
          ,permanent
          ,5000
          ,worker
          ,[ska_event]
          },
  Session = {ska_session
            ,{ska_session, start_link, []}
            ,permanent
            ,5000
            ,worker
            ,[ska_session]
            },
  {ok, {{one_for_one, 5, 10}, [Event, Session]}}.
