-module(ska_ng_tpl).

-export([to_js/2]).

to_js(Path, Html) ->
  [_PrivDir | PathWithoutPrivDir] = lists:reverse(Path),
  JS = iolist_to_binary(["angular.module('skuapso-cache').run(['$templateCache', function(cache) {",
                         "cache.put('/", '_':join(PathWithoutPrivDir, "/"), "', \""]),
  Html1 = iolist_to_binary(re:replace(Html, "\"", "\\\\\"", [global])),
  Html2 = case iolist_to_binary(re:replace(Html1, "(.*)\n", " \\1", [global])) of
            <<32, Rest/binary>> -> Rest;
            Rest -> Rest
          end,
  {ok, <<JS/binary, Html2/binary, "\")}]);">>}.
