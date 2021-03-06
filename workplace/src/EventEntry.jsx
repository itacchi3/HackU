import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { firebaseApp } from "./config/firebase";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import { TextField } from "@material-ui/core";
import { Calendar } from "react-multi-date-picker";
import { makeStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";
import liff from "@line/liff";

import "./assets/styles/EventEntry.css";

const firebaseDb = firebaseApp.database();

const useStyles = makeStyles({
  root: {
    width: 300,
  },

  slider: {
    marginTop: 20,
  },
});

const EventEntry = (props) => {
  const classes = useStyles();
  // イベント名
  const [eventName, setEventName] = useState("");
  // 説明
  const [description, setDescription] = useState("");
  // イベント候補日
  const [dates, setDates] = useState([]);
  // 時間幅
  const [timeWidth, setTimeWidth] = useState([0, 24]);
  // 時間区切り
  const [timeInterval, setTimeInterval] = useState([60]);
  // バリデーション
  const [eventNameValidation, setEventNameValidation] = useState(true);
  const [datesValidation, setDatesValidation] = useState(true);

  // console.log(eventName);
  // console.log(description);
  // console.log(dates);
  // console.log(timeWidth);
  // console.log(timeInterval);

  // const toString = Object.prototype.toString;
  // console.log(toString.call(dates[0]));

  const changeTimeWidth = (event, newTimeWidth) => {
    setTimeWidth(newTimeWidth);
  };
  const changeTimeInterval = (event, newTimeInterval) => {
    setTimeInterval(newTimeInterval);
  };
  const marksTimeWidth = [
    {
      value: 0,
      label: "0:00",
    },
    {
      value: 12,
      label: "12:00",
    },
    {
      value: 24,
      label: "24:00",
    },
  ];
  const marksTimeInterval = [
    {
      value: 15,
      label: "15分",
    },
    {
      value: 30,
      label: "30分",
    },
    {
      value: 60,
      label: "60分",
    },
    {
      value: 120,
      label: "120分",
    },
  ];
  console.log(dates);

  const errorCheck = () => {
    if (eventName === "") {
      setEventNameValidation(false);
    } else {
      setEventNameValidation(true);
    }
    if (dates.length === 0) {
      setDatesValidation(false);
    } else {
      setDatesValidation(true);
    }
  };

  const registerEvent = async () => {
    if (eventNameValidation && datesValidation) {
      //入力した値の整形
      const possibleDates = dates.map(
        (date) => date.year + "/" + date.month + "/" + date.day
      );

      const sortedPossibleDates = [...possibleDates].sort(
        (a, b) => new Date(a) - new Date(b)
      );
      console.log(sortedPossibleDates);

      const times = [];
      switch (timeInterval[0]) {
        case 15:
          for (let i = timeWidth[0]; i < timeWidth[1]; i++) {
            times.push(i + ":00");
            times.push(i + ":15");
            times.push(i + ":45");
          }
          break;
        case 30:
          for (let i = timeWidth[0]; i < timeWidth[1]; i++) {
            times.push(i + ":00");
            times.push(i + ":30");
          }
          break;
        case 60:
          for (let i = timeWidth[0]; i < timeWidth[1]; i++) {
            times.push(i + ":00");
          }
          break;
        case 120:
          for (let i = timeWidth[0]; i < timeWidth[1]; i = i + 2) {
            times.push(i + ":00");
          }
          break;

        default:
        // do nothing
      }
      console.log(sortedPossibleDates.length);
      console.log(times.length);
      const prospectiveDates = [];
      for (let j = 0; j < sortedPossibleDates.length; j++) {
        for (let k = 0; k < times.length; k++) {
          prospectiveDates.push(sortedPossibleDates[j] + "  " + times[k]);
        }
      }

      console.log(prospectiveDates);
      const eventData = {
        name: eventName,
        description: description,
        dates: sortedPossibleDates,
        times: times,
        prospectiveDates: prospectiveDates,
      };
      //Realtime Databaseに整形した値を書き込む
      //LINEに出欠表のURLを送信する

      const eventPush = await firebaseDb.ref("events").push(eventData);
      const eventId = eventPush.key;
      await liff
        .sendMessages([
          {
            type: "text",
            text: "出欠表が完成したよ！",
          },
          {
            type: "text",
            text:
              "【イベント名】\n" +
              eventName +
              "\n" +
              "【概要】\n" +
              description +
              "\n" +
              "https://liff.line.me/1656098585-v7VEeZ7Q/event/" +
              eventId,
            wrap: true,
          },
        ])
        .then(() => {
          console.log("message sent");
        })
        .catch((err) => {
          console.log("error", err);
        });
      // props.history.push(`/event/${eventId}`);
      // liffアプリを閉じる
      liff.closeWindow();
    }
  };

  useEffect(() => {
    errorCheck();
  }, [eventName, dates]);

  return (
    <Grid
      id="event-entry"
      container
      item
      direction="column"
      justify="space-between"
      alignItems="center"
      xs={12}
      spacing={3}
    >
      <Grid container item xs={11} justify="flex-start">
        <div className="guide-title">
          <Chip color="primary" label="1" className="guide-title__chip" />
          イベント概要を入力
        </div>
        <TextField
          placeholder="イベント名"
          onChange={(evt) => setEventName(evt.target.value)}
          value={eventName}
          fullWidth={true}
          variant="outlined"
        />
        <TextField
          placeholder="説明"
          onChange={(evt) => setDescription(evt.target.value)}
          value={description}
          margin="normal"
          multiline
          rows={7}
          fullWidth={true}
          variant="outlined"
        />
      </Grid>
      <Grid container item xs={11}>
        <div className="guide-title">
          <Chip color="primary" label="2" className="guide-title__chip" />
          イベント候補日を入力
        </div>
        <Grid container justify="center" alignItems="center">
          <Calendar value={dates} onChange={setDates} />
        </Grid>
      </Grid>
      <Grid container item xs={11} justify="center">
        <Grid
          container
          item
          xs={12}
          justify="flex-start"
          alignItems="flex-start"
        >
          <div className="guide-title">
            <Chip color="primary" label="3" className="guide-title__chip" />
            調整したい時間を入力
          </div>
        </Grid>
        <Grid
          container
          item
          xs={9}
          justify="center"
          alignItems="center"
          className={classes.slider}
        >
          <Slider
            value={timeWidth}
            onChange={changeTimeWidth}
            valueLabelDisplay="auto"
            aria-labelledby="range-slider"
            step={1}
            marks={marksTimeWidth}
            min={0}
            max={24}
            valueLabelDisplay="on"
          />
        </Grid>
      </Grid>
      <Grid container item xs={11} justify="center">
        <Grid
          container
          item
          xs={12}
          justify="flex-start"
          alignItems="flex-start"
        >
          <div className="guide-title">
            <Chip color="primary" label="4" className="guide-title__chip" />
            時間幅を入力
          </div>
        </Grid>
        <Grid
          container
          item
          xs={9}
          justify="center"
          alignItems="center"
          className={classes.slider}
        >
          <Slider
            value={timeInterval}
            onChange={changeTimeInterval}
            valueLabelDisplay="auto"
            aria-labelledby="track-false-slider"
            step={null}
            marks={marksTimeInterval}
            min={15}
            max={120}
            track={false}
            valueLabelDisplay="on"
          />
        </Grid>
      </Grid>

      <Grid container item xs={12} justify="flex-end" className="button-area">
        <Grid container item justify="flex-end">
          {eventNameValidation === false ? (
            <p>イベント名を入力してください</p>
          ) : (
            <p>
              <br />
            </p>
          )}
          {datesValidation === false ? (
            <p>候補日を入力してください</p>
          ) : (
            <p>
              <br />
            </p>
          )}
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              registerEvent();
            }}
          >
            イベントを作る
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withRouter(EventEntry);
