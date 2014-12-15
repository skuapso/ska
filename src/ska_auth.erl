-module(ska_auth).

-export([execute/2]).

-include_lib("logger/include/log.hrl").

execute(Req, State) ->
  '_trace'("ska_auth ~w", [State]),
  case cowboy_req:parse_header(<<"authorization">>, Req) of
    {ok, Auth, Req1} when Auth =/= undefined ->
      authenticated(Auth, Req1, State);
    _ ->
      case cowboy_req:cookie(<<"skuapso-session">>, Req) of
        {Val, Req1} when Val =/= undefined, Val =/= <<>> ->
          '_debug'("cookie ~w", [Val]),
          authenticated({cookie, Val}, Req1, State);
        _ ->
          unauthenticated(Req, State)
      end
  end.

unauthenticated(Req, _State) ->
  set_auth_header(Req).

authenticated(Auth, Req, State) ->
  check_authorization(ska_session:link(Auth), Auth, Req, State).

check_authorization(ok, Auth, Req, State) ->
  '_trace'("authorized"),
  Req1 = upsert_cookie(Auth, Req),
  {ok, Req1, State};
check_authorization(Reply, Auth, Req, _State)
  when
    Reply =:= {error, invalid_password};
    Reply =:= {error, not_related_cookie}
    ->
  '_warning'("authorization failed ~w", [Reply]),
  Req1 = delete_cookie(Auth, Req),
  set_auth_header(Req1);
check_authorization(Reply, Auth, Req, _State) ->
  '_alert'("auth check failed: ~w", [{Auth, Reply}]),
  {error, 500, Req}.

set_auth_header(Req) ->
  '_trace'("setting auth header"),
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

upsert_cookie(Auth, Req) ->
  '_trace'("upserting cookie"),
  case cowboy_req:cookie(<<"skuapso-session">>, Req) of
    {Val, Req1} when Val =:= undefined; Val =:= <<>> -> set_cookie(Auth, Req1);
    {Val, Req1} ->
      ska_session:set_cookie(Auth, Val),
      '_trace'("returning from upsert"),
      Req1
  end.

set_cookie(Auth, Req) ->
  '_trace'("setting cookie"),
  Val = '_':to_hex(term_to_binary(erlang:now())),
  ska_session:set_cookie(Auth, Val),
  cowboy_req:set_resp_cookie(<<"skuapso-session">>, Val, [{path, "/"}], Req).

delete_cookie(Auth, Req) ->
  '_trace'("deleting cookie"),
  ska_session:delete_cookie(Auth),
  cowboy_req:set_resp_cookie(<<"skuapso-session">>, <<>>, [{path, "/"}, {max_age, 0}], Req).
