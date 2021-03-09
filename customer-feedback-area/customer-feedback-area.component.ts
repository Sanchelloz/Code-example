import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subject, of, Observable} from 'rxjs';
import {finalize, switchMap, takeUntil} from 'rxjs/operators';

import {Feedback, FeedbackBasic, Product} from 'src/app/products/interfaces';
import {UserService} from 'src/app/shared/services/user.service';
import {ProductsService} from 'src/app/products/products.service';
import {AuthService} from 'src/app/shared/services/auth.service';
import {SignInProposeService} from 'src/app/shared/modals/signin-propose/signin-propose.service';

enum FeedbackAction {
  ADD = 'add',
  UPDATE = 'update'
}

@Component({
  selector: 'xcdrs-customer-feedback-area',
  templateUrl: './customer-feedback-area.component.html',
  styleUrls: ['./customer-feedback-area.component.scss'],
})
export class CustomerFeedbackAreaComponent implements OnInit, OnDestroy {
  @Input() product: Product;
  isAuthenticated = false;
  isCommentedBefore$: Observable<FeedbackBasic>
  feedbackItems: Feedback[] = [];
  feedbackAction = FeedbackAction
  ratings: Feedback[] = [];
  loading;
  isAllRatings = false;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private router: Router,
    private userService: UserService,
    private productsService: ProductsService,
    private authService: AuthService,
    private signInProposeService: SignInProposeService
  ) {
    this.isAuthenticated = this.authService.isLoggedIn();
  }


  ngOnInit(): void {
    if (this.product.TopicId) {
      this.fetchData();
      this.isCommentedBefore$ = this.productsService.getGetMineFeedback(this.product.TopicId)
    }

  }

  fetchData(
    startRowIndex: number = 0,
    maximumRows: number = 3): void {
    this.loading = true;
    this.productsService.getCustomerFeedback(this.product.TopicId,
      startRowIndex, maximumRows).pipe(
      switchMap(ratings => {
        this.ratings = ratings;
        const userIds = ratings.map(r => r.UserId);
        if (userIds.length) {
          return this.userService.getUserData([...userIds]);
        } else {
          return of([])
        }
      }),
      finalize(() => this.loading = false)
    ).subscribe(users => {
      if (users.length) {
        const combinedData: Feedback[] = this.ratings.map(
          (rate, idx) => Object.assign(rate, users[idx]));
        this.feedbackItems.push(...combinedData);
      }
    });
  }


  showAll(): void {
    if (this.isAllRatings && this.feedbackItems.length > 3) {
      return;
    }
    this.fetchData(3, 100);
    this.isAllRatings = true;
  }

  navigateToFeedbackAction(action: FeedbackAction): void {
    if (this.isAuthenticated) {
      this.router.navigate(
        [`/pages/products/details/${this.product.TopicId}/feedback/${action}`], {
          queryParams: {
            productName: this.product.TopicName
          }
        });
    } else {
      this.signInProposeService.showSignInProposal().pipe(
        takeUntil(this.destroy$)
      ).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

