-module(ska_ng_tpl).

-export([init/3]).
-export([rest_init/2]).
-export([allowed_methods/2]).
-export([content_types_provided/2]).
-export([charsets_provided/2]).
-export([last_modified/2]).
-export([compile/2]).

-record(state, {js = <<>>, mtime}).

-include_lib("kernel/include/file.hrl").

-include_lib("logger/include/log.hrl").

init(_Type, _Req, _Opts) ->
  {upgrade, protocol, cowboy_rest}.

rest_init(Req, {priv_dir, App, Path}) ->
  {ok, PrivDir, Dir} = case code:priv_dir(App) of
                Err when element(1, Err) =:= error ->
                  Err;
                PD ->
                  {ok, PD, Path}
              end,
  {JS, MTime} = add_dir(PrivDir, Dir, <<>>, undefined),
  {ok, Req, #state{js = JS, mtime = MTime}}.

allowed_methods(Req, State) ->
  {[<<"GET">>, <<"HEAD">>, <<"OPTIONS">>], Req, State}.

content_types_provided(Req, State) ->

  {[{<<"application/javascript">>, compile}], Req, State}.

charsets_provided(Req, State) ->
  {[<<"utf-8">>], Req, State}.

%languages_provided(Req, State) ->
%  {[<<"ru">>, <<"en">>], Req, State}.

last_modified(Req, #state{mtime = MTime} = State) ->
  {MTime, Req, State}.

compile(Req, #state{js = JS} = State) ->
  {JS, Req, State}.

add_dir(PrivDir, Path, Res, MaxTime) ->
  {ok, Files} = file:list_dir(PrivDir ++ "/" ++ Path),
  add_files(PrivDir, Path, Files, Res, MaxTime).

add_files(PrivDir, Path, [File | Files], Res, MaxTime) ->
  {ok, #file_info{type = Type, mtime = Time}} = file:read_file_info(
                                                  PrivDir ++ "/" ++ Path ++ "/" ++ File),
  case Type of
    directory ->
      add_dir(PrivDir, Path ++ "/" ++ File, Res, Time);
    regular ->
      Res1 = case list_to_binary('_':reverse(File)) of
               <<"lmth.lpt.", _/binary>> ->
                 add_file(PrivDir, Path, File, Res);
               _ ->
                 Res
             end,
      add_files(PrivDir, Path, Files, Res1, lists:max([MaxTime, Time]))
  end;
add_files(_, _, [], Res, MaxTime) ->
  {Res, MaxTime}.

add_file(PrivDir, Path, File, Res) ->
  JS = iolist_to_binary(["angular.module('skuapso').run(['$templateCache', function(cache) {",
                         "cache.put('/", Path, "/", File, "', \""]),
  {ok, Html} = file:read_file(PrivDir ++ "/" ++ Path ++ "/" ++ File),
  Html1 = iolist_to_binary(re:replace(Html, "\"", "\\\\\"", [global])),
  Html2 = case iolist_to_binary(re:replace(Html1, "(.*)\n", " \\1", [global])) of
            <<32, Rest/binary>> -> Rest;
            Rest -> Rest
          end,
  Html3 = <<Html2/binary, "\")}]);">>,
  <<Res/binary, JS/binary, Html3/binary, "\n\n\n">>.
