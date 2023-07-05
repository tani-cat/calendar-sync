// ref: https://for-dummies.net/gas-noobs/gas-japanese-reference-for-calendar/#calendar

const TARGET_BEFORE = 7;
const TARGET_AFTER = 21;


const getProperty = (key) => {
  return PropertiesService.getScriptProperties().getProperty(key);
}


const syncCalendar = () => {
  // カレンダーの取得
  Logger.log('前処理: 開始');
  // 同期の対象期間は実行日の14日前から84日後までの98日間
  const dateToday = new Date();
  Logger.log('実行日: ' + dateToday.toString());
  let dateFrom = new Date(dateToday);
  dateFrom.setDate(dateToday.getDate() - TARGET_BEFORE);
  let dateUntil = new Date(dateToday);
  dateUntil.setDate(dateToday.getDate() + TARGET_AFTER);
  Logger.log('開始日: ' + dateFrom.toString());
  Logger.log('終了日: ' + dateUntil.toString());
  // カレンダー情報の取得
  const srcCalendarList = getSourceCalendar();
  const srcCalendarDict = srcCalendarList.reduce((res, calendar) => {
    res[calendar.getId()] = calendar;
    return res;
  }, {});
  // ソースのイベントをすべて取得しておく(getEventByIdで検索しても引っかからないことがあるため)
  const srcEventsDict = srcCalendarList.reduce((resDict, calendar) => {
    resDict[calendar.getId()] = namingEvents(calendar, dateFrom, dateUntil);
    return resDict;
  }, {});
  Logger.log('前処理: ソースカレンダー (' + srcCalendarList.length.toString() + ')');
  const tgtCalendar = CalendarApp.getCalendarById(getProperty("target"));
  if (tgtCalendar === null) {
    Logger.log('エラー: ターゲット (target) をプロパティに設定してください');
    return;
  }
  Logger.log('前処理: カレンダー情報の取得');
  Logger.log('前処理: 完了');

  // ターゲットに存在するが、ソースに存在しないイベントを削除する & 変更されたイベントを更新する
  Logger.log('既存イベントの同期処理: 開始');
  // ターゲットのイベント取得
  const tgtEventDict = namingEvents(tgtCalendar, dateFrom, dateUntil);
  Logger.log('既存イベントの取得: ' + Object.keys(tgtEventDict).length.toString());
  Object.keys(tgtEventDict).map(tgtEventId => {
    // descriptionの一行目からソースを取得する: ソースがない場合は管理対象外なので無視する
    let tgtEvent = tgtEventDict[tgtEventId];
    let value = tgtEvent.getDescription().split('\n')[0];
    if (value.substring(0, SYNC_DESC.length) !== SYNC_DESC) {
      return;
    }
    // ソースにイベントがあるかどうか調べる
    // TODO: Error Handling
    value = value.substring(SYNC_DESC.length, value.length);
    let srcCalendarId = value.split('/')[0];
    let srcEventId = value.split('/')[1] + '/' + value.split('/')[2];
    Logger.log('fetched src: ' + srcCalendarId + ':' + srcEventId + ', target: ' + tgtEventId);
    // 存在判定: カレンダー自体と、その中のイベントが存在すること
    if (
      Object.keys(srcCalendarDict).includes(srcCalendarId)
      && Object.keys(srcEventsDict[srcCalendarId]).includes(srcEventId)
    ) {
      let srcCalendar = srcCalendarDict[srcCalendarId];
      let srcEvent = srcEventsDict[srcCalendarId][srcEventId];
      if (tgtEvent.getLastUpdated() <= srcEvent.getLastUpdated()) {
        // lastUpdated が異なればアップデートする
        updateEvent(srcCalendar, srcEvent, tgtEvent);
        Logger.log('updated target: ' + tgtEventId);
      }
      // srcEventsDict から除く
      srcEventsDict[srcCalendarId][srcEventId] = null;
    } else {
      // 同期元に存在しない場合は削除する
      tgtEvent.deleteEvent();
      Logger.log('deleted event: ' + tgtEventId);
    }

  });
  Logger.log('既存イベントの同期処理: 完了');

  // srcEventsDict に残ったままの event を追加する(既に存在する場合は、nullになっている)
  Logger.log('新規イベントの同期処理: 開始');
  const addEventCnt = Object.keys(srcEventsDict).reduce((res, srcCalendarId) => {
    res += Object.keys(srcEventsDict[srcCalendarId]).reduce((res2, srcEventId) => {
      let srcEvent = srcEventsDict[srcCalendarId][srcEventId];
      if (srcEvent !== null && !srcEvent.isAllDayEvent()) {
        newEvent = createEvent(
          srcCalendarDict[srcCalendarId],
          srcEvent,
          tgtCalendar
        );
        Logger.log('created event: ' + eventUqId(newEvent) + ' from ' + eventUqId(srcEvent));
        res2 += 1;
      }
      return res2;
    }, 0);
    return res;
  }, 0);
  Logger.log('新規イベント数: ' + addEventCnt.toString());
  Logger.log('新規イベントの同期処理: 完了');
}


const main = () => {
  syncCalendar();
}
