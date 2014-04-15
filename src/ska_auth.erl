-module(ska_auth).

-export([execute/2]).

-include_lib("logger/include/log.hrl").

execute(Req, State) ->
  debug("ska_auth ~w", [State]),
  case cowboy_req:parse_header(<<"authorization">>, Req) of
    {ok, {<<"basic">>, {<<"il">>, <<"12">>}}, Req1} ->
      unauthenticated(Req1, State);
    {ok, Auth, Req1} when Auth =/= undefined ->
      authenticated(Auth, Req1, State);
    _ ->
      unauthenticated(Req, State)
  end.

unauthenticated(Req, _State) ->
  set_auth_header(Req).

authenticated(Auth, Req, State) ->
  check_authorization(ska_session:link(Auth), Req, State).

check_authorization(ok, Req, State) ->
  trace("authorized"),
  {ok, Req, State};
check_authorization({error, invalid_password}, Req, _State) ->
  trace("authorization failed"),
  set_auth_header(Req);
check_authorization(_, Req, _State) ->
  trace("server error"),
  {error, 500, Req}.

set_auth_header(Req) ->
  trace("setting auth header"),
  Req1 = cowboy_req:set_resp_header(<<"WWW-Authenticate">>,
                                    <<
                                      "Basic realm=\"S.K.U.A.P.S.O.\""
                                    >>
                                    , Req),
%  Req2 = cowboy_req:set_resp_header(<<"WWW-Authenticate">>,
%                                    <<
%                                      "Negotiate"
%                                    >>
%                                    , Req1),
  {error, 401, Req1}.
