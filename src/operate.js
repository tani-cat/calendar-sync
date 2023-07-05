const SYNC_DESC = 'sync from: ';


const getSourceCalendar = () => {
  // 同期先のカレンダーと、同期元のカレンダーの一覧を取得
  const calendarList = CalendarApp.getAllCalendars();
  // @import.calendar.google.com のものが対象
  const srcCalendarList = calendarList.filter(calendar => calendar.getId().endsWith('@import.calendar.google.com'));
  return srcCalendarList;
}


const eventUqId = (event) => {
  // イベントのID + 開始日時の秒以下を切り捨て
  // イベントIDのみだと繰り返し予定が重複してしまうため
  return event.getId() + '/' + event.getStartTime().toISOString().replace(/[^0-9]/g, '').slice(0, -5);
}


const namingEvents = (calendar, dateFrom, dateUntil) => {
  // カレンダーからイベントを辞書形式で取得する
  let eventList = calendar.getEvents(dateFrom, dateUntil);
  return eventList.reduce((res, event) => {
    res[eventUqId(event)] = event;
    return res;
  }, {});
}


const createEvent = (sourceCalendar, sourceEvent, targetCalendar) => {
  // イベントの追加: カレンダーの description に追加元のカレンダーIDを追加しておく
  const syncDesc = SYNC_DESC + sourceCalendar.getId() + '/' + eventUqId(sourceEvent) + '\n';
  if (sourceEvent.isAllDayEvent()) {
    // 終日イベント
    return targetCalendar.createAllDayEvent(
      title=sourceEvent.getTitle(),
      startDate=sourceEvent.getAllDayStartDate(),
      endDate=sourceEvent.getAllDayEndDate(),
      options={
        description: syncDesc + sourceEvent.getDescription(),
        location: sourceEvent.getLocation()
      }
    );
  } else {
    return targetCalendar.createEvent(
      title=sourceEvent.getTitle(),
      startTime=sourceEvent.getStartTime(),
      endTime=sourceEvent.getEndTime(),
      options={
        description: syncDesc + sourceEvent.getDescription(),
        location: sourceEvent.getLocation()
      }
    );
  }
}

const updateEvent = (sourceCalendar, sourceEvent, event) => {
  // イベントの追加: カレンダーの description に追加元のカレンダーIDを追加しておく
  const syncDesc = SYNC_DESC + sourceCalendar.getId() + '/' + eventUqId(sourceEvent) + '\n';
  // 共通項目
  event.setTitle(sourceEvent.getTitle());
  event.setDescription(syncDesc + sourceEvent.getDescription());
  event.setLocation(sourceEvent.getLocation());
  if (event.isAllDayEvent()) {
    // 終日イベント
    event.setAllDayDates(
      sourceEvent.getAllDayStartDate(),
      sourceEvent.getAllDayEndDate()
    );
  } else {
    event.setTime(
      startTime=sourceEvent.getStartTime(),
      endTime=sourceEvent.getEndTime()
    );
  }
}
