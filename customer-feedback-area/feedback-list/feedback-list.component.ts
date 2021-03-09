import {Component, Input, OnInit} from '@angular/core';

import {Feedback} from 'src/app/products/interfaces';

@Component({
  selector: 'xcdrs-feedback-list',
  templateUrl: './feedback-list.component.html',
  styleUrls: ['./feedback-list.component.scss']
})
export class FeedbackListComponent implements OnInit {
  @Input() feedbackItems: Feedback[];

  constructor() {
  }

  ngOnInit(): void {
  }

  trackById(idx: number, item: Feedback): string {
    return item.RatingId
  }

}
