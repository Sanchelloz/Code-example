import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Feedback} from 'src/app/products/interfaces';


@Component({
  selector: 'xcdrs-feedback-list-item',
  templateUrl: './feedback-list-item.component.html',
  styleUrls: ['./feedback-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedbackListItemComponent implements OnInit {
  @Input() feedback: Feedback;

  constructor(
  ) {
  }

  ngOnInit(): void {
  }

}
