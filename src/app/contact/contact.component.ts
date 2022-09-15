import { Component, OnInit } from '@angular/core';
import * as systemjs from 'scriptjs';
declare var window: any;
declare const SystemJS: any;
// import SystemJS from 'systemjs';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  holidayEventsLib: any;
  public showWeekDayDetails = false;
  public weekEndOrNot = false;
  constructor() {
    // const umdUrl =
    //   'http://127.0.0.1:8887/holiday-events/bundles/holiday-events.umd.js';
    // systemjs.get(umdUrl, () => {
    //   console.log('window', window);
    //   if (window['holiday-events']) {
    //     this.holidayEventsLib = new window['holiday-events'].HolidayEvents(
    //       'hello'
    //     );
    //     this.holidayEventsLib.isWeekEnd(0);
    //     console.log('holidayEventsLib', this.holidayEventsLib);
    //   } else {
    //   }
    // });
  }

  ngOnInit(): void {
    const time = new Date().getTime();
    const coreUrl =
      'https://sit.app01.evloyalty.everiaml.com/Creative_Trilogy_Latest/clientConfig/core-engine.umd.js';
    const url =
      'http://10.119.200.44:8887/bundles/holiday-events.umd.js';
    const v12url = 'http://127.0.0.1:8887/bundles/holiday-events.umd.js';
    System.import(url)
      .then((response) => {
        console.log('response', response);
        this.holidayEventsLib = new window['holiday-events'].HolidayEvents(
          'hello'
        );
        this.holidayEventsLib.isWeekEnd(3);
        console.log('holidayEventsLib', this.holidayEventsLib.isWeekEnd(3));
      })
      .catch((error) => {
        console.log('error', error);
      });
  }

  checkIsWeekEnd(): void {
    const today = new Date().getDay();
    this.weekEndOrNot = this.holidayEventsLib.isWeekEnd(today);
  }
}
