-module(ska_object).

-export([json/2]).

-include_lib("logger/include/log.hrl").

track_sql(ValCondition, Join, AddCondition) ->
  "select row_to_json(S1.*) as jsons from ("
    "select"
      " array_to_json(array_agg(loc_json order by time)) as track,"
      "object_id,"
      "min(time),"
      "max(time)"
    " from ("
      "select *,navigation.part(condition) over (order by time) from ("
        "select"
          " array_to_json(array[navigation.y(location),navigation.x(location)]) as loc_json,"
          " time,"
          " object_id,"
          " " ++ ValCondition ++ " as condition"
        " from events.data as ev "
        ++ Join ++
        " where valid and location is not null"
        " and object_id=$1 and time>=$2 and time<=$3 "
        ++ AddCondition ++
        " order by time"
      ") S3"
    ") S2"
    " group by part,condition,object_id"
    " having condition and count(*)>1"
  ") S1"
  .

json(<<"GET">>, [ObjectId, <<"track">>, FromDateTime, ToDateTime | Mod]) ->
  {ValCondition, Join, AddCondition, AddValues} = track_condition(Mod),
  Query = track_sql(ValCondition, Join, AddCondition),
  TracksJson = ska_rest:sql(execute, {Query, [
                        binary_to_integer(ObjectId),
                        ska:to_datetime(FromDateTime),
                        ska:to_datetime(ToDateTime) | AddValues]}),
  debug("tracks: ~w", [TracksJson]),
  Tracks = case iolist_to_binary([<<$,, X/binary>> || [{jsons, X}] <- TracksJson]) of
             <<>> -> <<>>;
             <<$,, T/binary>> -> T
           end,
  [<<"[">>, Tracks , <<"]">>].

track_condition([]) -> {"true", "", "", []};
track_condition([<<"sensor">>, SensorIdBin, Cond, SensorValue]) ->
  SensorId = binary_to_integer(SensorIdBin),
  case ska_rest:sql(execute, {"select sensor.data_type(object.sensor($1)) as json", [SensorId]}) of
    [] ->
      warning("sensor type not found"),
      track_condition([]);
    SensorDataType ->
      debug("sensor data type is ~w", [SensorDataType]),
      alert("sql injection"),
      {
       "value::" ++ binary_to_list(SensorDataType)
              ++ binary_to_list(Cond)
              ++ binary_to_list(SensorValue),
       " left join events.sensors S using(id)",
       " and sensor_id=$4",
       [SensorId]
      }
  end.
