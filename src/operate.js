const SYNC_DESC = 'sync from: ';


const createEvent = (sourceCalendar, sourceEvent, targetCalendar) => {
  // イベントの追加: カレンダーの description に追加元のカレンダーIDを追加しておく
  const syncDesc = SYNC_DESC + sourceCalendar.getId() + '/' + sourceEvent.getId() + '\n';
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
  const syncDesc = SYNC_DESC + sourceCalendar.getId() + '/' + sourceEvent.getId() + '\n';
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
